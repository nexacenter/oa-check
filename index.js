// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const express = require("express");
const app = express();

var http = require("http"),
    program = require("commander"),
    kvHostName = 'roarmap.eprints.org',
    kvPort = process.env.PORT || 8080;

function callEprints(path, callback) {
    var request = http.request({
        hostname: kvHostName,
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
        response.writeHead(504);
        response.end("Gateway Timeout\n");
    } else if (error.message === "BadStatusCode") {
        response.writeHead(502);
        response.end("Bad Gateway\n");
    } else {
        response.writeHead(500);
        response.end("Internal Server Error\n");
    }
}

function runServer() {
    app.get(/^\/id\/eprint\/[0-9]+$/, (req, res) => {
        callEprints(req.url, function (error, record) {
            if (error) {
                console.log("getFunc error:", error);
                processError(error, res);
                return;
            }
            res.json(record);
        });
    });

    app.get(/^\/cgi\/search\/simple$/, (req, res) => {
        callEprints(req.url, function (error, record) {
            if (error) {
                console.log("searchFunc error:", error);
                processError(error, res);
                return;
            }
            res.json(record);
        });
    });

    app.get("/api/version", (_, res) => (res.json({version: "0.0.1"})));

    app.use(express.static(`${__dirname}/static`));

    app.listen(kvPort, function () {
        console.log("server listening on port", kvPort);
    });
}

function doListen() {
    runServer();
}

program
    .version("0.0.1")
    .option("-l, --listen", "Start local web server")
    .parse(process.argv);

if (program.listen) {
    doListen();
} else {
    program.help();
}
