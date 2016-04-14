// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const cluster = require("cluster");
const express = require("express");
const program = require("commander");
const scrape = require("./lib/scrape");
const test = require("./lib/test");

// Returns all roarmap institutions as JSON
let latestCheck = 0;
let cache = {};
const getInstitutions = exports.getInstitutions = (_, res) => {
    const now = new Date().getTime();
    if (now - latestCheck < 15000) {
        res.json(cache);
        return;
    }
    scrape.scrape((err, d) => {
        if (err) {
            console.log(err);
            res.status(500).send("Internal server error");
            return;
        }
        latestCheck = now;
        cache = d;
        res.json(d);
    });
};

program
    .version("0.0.4")
    .option("-d, --dump", "Scrape roarmaps database and dump it to stdout")
    .option("-t, --test", "Self test scraper and rules")
    .parse(process.argv);

if (program.dump) {
    scrape((err, data) => {
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
        }, 1000);
    });
    return;
}

const app = express();
app.get("/api", availableApis);
app.get("/api/", availableApis);
app.get("/api/v1/institutions", getInstitutions);
app.get("/api/version", (_, res) => { res.json({version: 1}); });
app.use(express.static(`${__dirname}/static`));
app.listen(process.env.PORT || 8080, () => {
    console.log("web application started");
});
