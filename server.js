// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const basedir = `${__dirname}`;
const express = require("express");
const fs = require("fs");
const jquery = `file:///${basedir}/node_modules/jquery/dist/jquery.min.js`;
const jsdom = require("jsdom");
const prefix = "https://roarmap.eprints.org/cgi/search/advanced";
const program = require("commander");
const request = require("request");
const timeout = 5000;

// Basic building block to fetch URLs with timeout and SSL checks
const fetch = exports.fetch = (url, callback) => {
    request({
        uri: url,
        timeout: timeout,
    }, (error, response, body) => {
        if (error) {
            callback(error);
            return;
        }
        if (response.statusCode !== 200) {
            callback(new Error("invalid status code"));
            return;
        }
        callback(null, body);
    });
};

// Wrapper for jsdom.env() that uses our fetch() to retrieve data
const jsdomWrap = exports.jsdomWrap = (url, callback) => {
    fetch(url, (error, body) => {
        if (error) {
            callback(error);
            return;
        }
        // XXX: I initially tried to specify timeout using the `pool`
        // parameter of jsdom.env()'s config but failed.
        // Note: The following does not use the nework as long as
        // the `jquery` parameter references a file.
        jsdom.env(body, [jquery], callback);
    });
};

// Scrape all institutions in JSON format from roarmap website
const scrape = exports.scrape = (callback) => {

    // 1. Load advanced search form
    console.log("load:", prefix);
    jsdomWrap(prefix, (err, window) => {
        if (err) {
            callback(err);
            return;
        }
        console.log("ok");

        // 2. Do advanced search for all institution types
        const institutionTypes = [
            "funder", "research_org", "funder_and_research_org",
            "multiple_research_orgs", "research_org_subunit"
        ];
        window.$("input.ep_form_checkbox").each((_, elem) => {
            if (institutionTypes.indexOf(elem.value) >= 0) {
                console.log("click:", elem.value);
                elem.click();
            }
        });
        const form = window.$("form[action='/cgi/search/advanced']");
        const url = prefix + "?" + form.serialize();
        form.on("submit", () => {
            console.log("on submit");
            jsdomWrap(url, (err, window) => {
                if (err) {
                    callback(err);
                    return;
                }
                console.log("ok");

                // 3. Select export to JSON
                window.$("select[name='output']").val("JSON");
                const form = window.$(
                        "form input.ep_form_action_button[value='Export']")
                    .parents("form");
                const url = prefix + "?" + form.serialize();
                form.on("submit", () => {
                    console.log("on submit");
                    jsdomWrap(url, (err, window) => {
                        if (err) {
                            callback(err);
                            return;
                        }
                        console.log("ok");

                        // 4. Pass JSON to caller
                        const ttt = window.document.documentElement.textContent;
                        try {
                            JSON.parse(ttt);
                        } catch (err) {
                            callback(err);
                            return;
                        }
                        callback(undefined, ttt);
                    });
                });
                console.log("submit:", url);
                form.submit();
            });
        });
        console.log("submit:", url);
        form.submit();
    });
};

// Returns all roarmap institutions as JSON
let latestCheck = 0;
let cache = {};
const getInstitutions = exports.getInstitutions = (_, res) => {
    const now = new Date().getTime();
    if (now - latestCheck < 15000) {
        res.json(cache);
        return;
    }
    scrape((err, d) => {
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
    .version("0.0.3")
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
app.use(express.static(`${basedir}/static`));
app.listen(process.env.PORT || 8080, () => {
    console.log("web application started");
});
