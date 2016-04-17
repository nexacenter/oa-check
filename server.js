// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const cluster = require("cluster");
const database = require("./lib/server/database");
const express = require("express");
const program = require("commander");
const test = require("./lib/server/test");

const getInstitutions = (callback) => {
    database.query((err, data) => {
        if (err) {
            callback(err);
            return;
        }
        callback(null, data);
    });
};

program
    .version("0.0.4")
    .option("-d, --dump", "Scrape roarmaps database and dump it to stdout")
    .option("-t, --test", "Self test scraper and rules")
    .parse(process.argv);

if (program.dump) {
    database.query((err, data) => {
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
};

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

app.get("/api/version", (_, res) => {
    res.json({
        version: 1
    });
});
app.use(express.static(`${__dirname}/static`));

// Before listening attempt once to fetch the institutions such that in
// the common case we start serving when we have good institutions.
// XXX This algorithm could of course become smarter than it is now...
getInstitutions((error) => {
    if (error) {
        console.log("error when getting institutions:", error);
        // fallthrough
    }
    app.listen(process.env.PORT || 8080, () => {
        console.log("web application started");
    });
});
