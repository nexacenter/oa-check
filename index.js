// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

var fast_csv = require("fast-csv"),
    fs = require("fs"),
    http = require("http"),
    kvHostName = 'roarmap.eprints.org',
    kvPort = 8080,
    kvRetainFields = {
        "can_deposit_be_waived": true,
        "date_made_open": true,
        "date_of_deposit": true,
        "embargo_hum_soc": true,
        "embargo_sci_tech_med": true,
        "gold_oa_options": true,
        "iliege_hefce_model": true,
        "journal_article_version": true,
        "locus_of_deposit": true,
        "making_deposit_open": true,
        "mandate_content_types": true,
        "maximal_embargo_waivable": true,
        "open_licensing_conditions": true
    },
    kvRulesPath = "roarmap-rules.csv";

function simplify(record) {
    var newRecord = {};
    Object.keys(record).forEach(function (key) {
        if (kvRetainFields[key]) {
            newRecord[key] = record[key];
        }
    });
    return newRecord;
}

function asList(record) {
    var newRecord = [];
    Object.keys(record).forEach(function (key) {
        var value = record[key];
        if (value instanceof Array) {
            for (var i = 0; i < value.length; ++i) {
                newRecord.push([key, value[i]]);
            }
        } else {
            newRecord.push([key, value]);
        }
    });
    return newRecord;
}

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
            callback(new Error("unexpected status code"));
            return;
        }
        response.on("error", function (error) {
            callback(error);
        });
        var body = "";
        response.on("data", function (data) {
            body += data;
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
    request.on("error", function (error) {
        callback(error);
    });
    request.end();
}

function loadRules(callback) {
    var rules = [];
    fast_csv
        .fromPath(kvRulesPath)
        .on("data", function (fields) {
            rules.push(fields);
        })
        .on("end", function () {
            callback(rules);
        });
}

function applyRules(rules, record) { // Yes, this is O(N^2)
    var newRecord = [];
    for (var i = 1; i < rules.length; ++i) {
        var policy_id = rules[i][0],
            roarmap_field = rules[i][1],
            if_field_equals = rules[i][2],
            then = rules[i][3],
            human_rationale = rules[i][4];
        for (var j = 0; policy_id && j < record.length; ++j) {
            if (record[j][0] === roarmap_field &&
                record[j][1] === if_field_equals) {
                    newRecord.push([
                        policy_id,
                        roarmap_field,
                        if_field_equals,
                        then,
                        human_rationale
                    ]);
                    // Note: no break since more than one rule may apply
                }
        }
    }
    return newRecord;
}

loadRules(function (rules) {
    http.createServer(function (request, response) {

        if (request.url.match(/^\/id\/eprint\/[0-9]+/)) {
            callEprints(request.url, function (error, record) {
                if (error) {
                    console.log("callEprints error:", error);
                    response.writeHead(500);
                    response.end("Internal Server Error\n");
                    return;
                }
                record = applyRules(rules, asList(simplify(record)));
                response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify(record));
            });
            return;
        }

        var realpath;
        if (request.url === "/" || request.url === "/index.html") {
            realpath = "index.html";
        } else if (request.url === "/app.js") {
            realpath = "app.js";
        }

        if (realpath) {
            var stream = fs.createReadStream(realpath);
            stream.on("error", function (error) {
                console.log("stream error:", error);
                response.end();
            });
            stream.pipe(response);
        } else {
            response.writeHead(404);
            response.end("Not Found\n");
        }

    }).listen(kvPort, function () {
        console.log("server listening on port", kvPort);
    });
});
