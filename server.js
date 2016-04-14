// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const cluster = require("cluster");
const express = require("express");
const program = require("commander");
const scrape = require("./lib/server/scrape");
const test = require("./lib/server/test");

// Returns all roarmap institutions as JSON
let latestCheck = 0;
let cache = {};
const checkInterval = 900000;
const getInstitutions = (callback) => {
    const now = new Date().getTime();
    if (now - latestCheck < checkInterval) {
        callback(null, cache);
        return;
    }
    // Note: since the request takes around ten seconds, immediately
    // update `latestCheck` otherwise all requests arriving into this
    // time frame when we are updating will trigger other updates
    latestCheck = now;
    scrape.scrape((err, d) => {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        cache = d;
        callback(null, cache);
    });
};

program
    .version("0.0.4")
    .option("-d, --dump", "Scrape roarmaps database and dump it to stdout")
    .option("-t, --test", "Self test scraper and rules")
    .parse(process.argv);

if (program.dump) {
    scrape.scrape((err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Dump follows:\n\n");
        console.log(data);
    });
    return;
}

if (program.test) {
    test.test();
    return;
}

const availableApis = (_, res) => {
    res.json({
        "/api": "Return this list of APIs",
        "/api/": "Same as '/api'",
        "/api/v1/institutions": "Scrape and return all roarmap institutions",
        "/api/version": "Returns API version",
        "/id/eprint/[0-9]+": "Forwards entity query for ID to eprints",
        "/cgi/search/simple": "Forwards search query to eprints",
    });
}

// Robustness model: process requests using a child process and
// respawn it in the event that it dies
if (cluster.isMaster) {
    console.log("forking worker process");
    cluster.fork();
    cluster.on("exit", (worker, code, signal) => {
        console.log("worker process died");
        setTimeout(() => {
            console.log("forking worker process");
            cluster.fork();
        }, 15000);
    });
    return;
}

const app = express();
app.get("/api", availableApis);
app.get("/api/", availableApis);

app.get("/api/v1/institutions", (_, res) => {
    getInstitutions((err, d) => {
        if (err) {
            res.status(500).send("Internal server error");
            return;
        }
        res.json(d);
    });
});

app.get("/api/version", (_, res) => { res.json({version: 1}); });
app.use(express.static(`${__dirname}/static`));

// Before listening attempt once to fetch the institutions such that in
// the common case we start serving when we have good institutions.
// XXX This algorithm could of course become smarter than it is now...
getInstitutions((error) => {
    console.log("error when getting institutions?", error);
    app.listen(process.env.PORT || 8080, () => {
        console.log("web application started");
    });
});
