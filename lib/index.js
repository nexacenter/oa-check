// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const express = require("express");
const fs = require("fs");
const jquery = `file:///${__dirname}/../node_modules/jquery/dist/jquery.min.js`;
const jsdom = require("jsdom");
const outFile = `${__dirname}/../roarmap-dump.json`;
const prefix = "https://roarmap.eprints.org/cgi/search/advanced";
const program = require("commander");

// Scrape all institutions from roarmap website
const scrape = (callback) => {

    // 1. Load advanced search form
    console.log("load:", prefix);
    jsdom.env(prefix, [jquery], (err, window) => {
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
            jsdom.env(url, [jquery], (err, window) => {
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
                    jsdom.env(url, [jquery], (err, window) => {
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
const getInstitutions = (_, res) => {
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
