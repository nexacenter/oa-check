// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const scrape = require("./scrape");

exports.main = () => {
    scrape.scrape((err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Dump follows:\n\n");
        console.log(data);
    });
};
