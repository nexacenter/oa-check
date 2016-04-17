// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const database = require("./database");
let basicDocument = {
    foo: 3.14,
    foobar: [1, 2, 3],
    bar: "baz",
    jarjar: null
};

database.update_((err, data) => {
    console.log(err);
    console.log(data);

    database.update_((err, data) => {
        console.log(err);
        console.log(data);

        database.update_((err, data) => {
            console.log(err);
            console.log(data);
        }, (callback) => {
            basicDocument.foobar.push(4);
            callback(null, JSON.stringify(basicDocument));
        });

    }, (callback) => {
        callback(null, JSON.stringify(basicDocument));
    });

}, (callback) => {
    callback(null, JSON.stringify(basicDocument));
});
