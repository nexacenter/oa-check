// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

var fs = require("fs"),
    jquery = "https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js",
    page = require("webpage").create();

page.onConsoleMessage = function (message) {
    console.log(message);
};

page.onLoadStarted = function () {
    console.log("load started");
};

// Stage #1: load the advanced search page and make a search that causes all
// the available data to be returned as a result.

page.open("http://roarmap.eprints.org/cgi/search/advanced", function (status) {
    console.log("opened web page:", status);
    if (status !== "success") {
        phantom.exit();
        return;
    }
    page.includeJs(jquery, function () {
        console.log("included jQuery");

        page.onLoadFinished = function (status) {
            console.log("load finished:", status);
            if (status !== "success") {
                phantom.exit();
                return;
            }

            // Stage #2: request result in JSON format

            page.includeJs(jquery, function () {
                console.log("included jQuery");

                page.onLoadFinished = function (status) {
                    console.log("load finished:", status);
                    if (status !== "success") {
                        phantom.exit();
                        return;
                    }

                    // Stage #3: print the JSON to standard output

                    fs.write("roarmap-dump.json", page.plainText, "w");
                    console.log("written JSON to file");
                    phantom.exit();
                };

                page.evaluate(function () {
                    jQuery("select[name='output']").each(function (_, elem) {
                        console.log("selected option: JSON");
                        jQuery(elem).val("JSON");
                    });
                    var clicked = false;
                    jQuery("input.ep_form_action_button").each(
                        function (_, elem) {
                            if (elem.name === "_action_export_redir" &&
                                !clicked) {
                                    clicked = true;
                                    elem.click();
                                    console.log("clicked button:", elem.value);
                                }
                        });
                });
            });
        };

        page.evaluate(function() {
            jQuery("input.ep_form_checkbox").each(function (_, elem) {
                if (elem.value === "funder" ||
                    elem.value === "research_org" ||
                    elem.value === "funder_and_research_org" ||
                    elem.value === "multiple_research_orgs" ||
                    elem.value === "research_org_subunit") {
                    elem.click();
                    console.log("clicked checkbox:", elem.value);
                }
            });
            var clicked = false;
            jQuery("input.ep_form_action_button").each(function (_, elem) {
                if (elem.name === "_action_search" && !clicked) {
                    clicked = true;
                    elem.click();
                    console.log("clicked button:", elem.value);
                }
            });
        });
    });
});
