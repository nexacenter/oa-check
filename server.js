// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const express = require("express");
const program = require("commander");
const scrape = require("./lib/scrape");

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

const availableApis = (_, res) => {
    res.json({
        "/api": "Return this list of APIs",
        "/api/": "Same as '/api'",
        "/api/institutions": "Scrape and return all roarmap institutions",
        "/api/version": "Returns API version",
    });
}

const app = express();
app.get("/api", availableApis);
app.get("/api/", availableApis);
app.get("/api/institutions", getInstitutions);
app.get("/api/version", (_, res) => { res.json({version: "0.0.2"}); });
app.use(express.static(`${__dirname}/static`));
app.listen(process.env.PORT || 8080, () => {
    console.log("web application started");
});
