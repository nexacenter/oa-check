// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const database = require("database");

exports.main = () => {
    database.query((err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Dump follows:\n\n");
        console.log(data);
    });
};
