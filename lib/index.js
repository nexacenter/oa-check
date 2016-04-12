// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const basedir = `${__dirname}/..`;
const express = require("express");
const fs = require("fs");
const jquery = `file:///${basedir}/node_modules/jquery/dist/jquery.min.js`;
const jsdom = require("jsdom");
const outFile = `${basedir}/roarmap-dump.json`;
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
const getInstitutions = exports.getInstitutions = (_, res) => {
    scrape((err, d) => {
        if (err) {
            console.log(err);
            res.status(500).send("Internal server error");
            return;
        }
        res.json(d);
    });
};

program
    .version("0.0.2")
    .option("-l, --listen", "Start local web server")
    .parse(process.argv);

if (program.listen) {
    const app = express();
    app.get("/institutions", getInstitutions);
    app.listen(process.env.PORT || 8080, () => {
        console.log("web application started");
    });
    return;
}

scrape((err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    fs.writeFileSync(outFile, data, "utf-8");
});
