// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const http = require("http");

function callEprints(path, callback) {
    var request = http.request({
        hostname: 'roarmap.eprints.org',
        method: "GET",
        path: path,
        headers: {
            accept: "application/json"
        }
    }, function (response) {
        if (response.statusCode !== 200) {
            response.resume();
            callback(new Error("BadStatusCode"));
            return;
        }
        response.on("error", function (error) {
            callback(error);
        });
        var body = "";
        response.on("data", function (data) {
            body += data;
        });
        response.setTimeout(2000, function () {
            callback(new Error("TimeoutError"));
        });
        response.on("end", function () {
            var record;
            try {
                record = JSON.parse(body);
            } catch (error) {
                callback(error);
                return;
            }
            callback(undefined, record);
        });
    });
    request.setTimeout(2000, function () {
        callback(new Error("TimeoutError"));
    });
    request.on("error", function (error) {
        callback(error);
    });
    request.end();
}

function processError(error, response) {
    if (error.message === "TimeoutError") {
        response.status(504).send("Gateway Timeout\n");
    } else if (error.message === "BadStatusCode") {
        response.status(502).send("Bad Gateway\n");
    } else {
        response.status(500).send("Internal Server Error\n");
    }
}

const forward = exports.forward = (req, res) => {
    callEprints(req.url, function (error, record) {
        if (error) {
            console.log("callEprints error:", error);
            processError(error, res);
            return;
        }
        res.json(record);
    });
};
