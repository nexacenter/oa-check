// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const database = require("./database");
const express = require("express");

const getInstitutions = (callback) => {
    database.query((err, data) => {
        if (err) {
            callback(err);
            return;
        }
        callback(null, data);
    });
};

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
getInstitutions((error) => {
    if (error) {
        console.log("error when getting institutions:", error);
        // fallthrough
    }
    app.listen(process.env.PORT || 8080, () => {
        console.log("web application started");
    });
});

exports.main = () => {
    console.log("Slave worker started");
};
