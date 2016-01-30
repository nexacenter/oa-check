// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

var fast_csv = require("fast-csv"),
    fs = require("fs"),
    http = require("http"),
    level = require("level-browserify"),
    levelgraph = require("levelgraph"),
    program = require("commander");

var kvCache = levelgraph(level("cache")),
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

function triplesToObject(triples) {
    var object = {};
    if (triples.length > 0) {
        object.uri = triples[0].subject;
        for (var i = 0; i < triples.length; ++i) {
            object[triples[i].predicate] = triples[i].object;
        }
    }
    return object;
}

function objectToTriples(object) {
    var triples = [];
    Object.keys(object).forEach(function (key) {
        if (key !== "uri") {
            triples.push({
                subject: object.uri,
                predicate: key,
                object: object[key]
            });
        }
    });
    return triples;
}

function getObject(path, callback) {
    var uri = "http://roarmap.eprints.org" + path;
    kvCache.get({subject: uri}, function (error, triples) {
        if (error) {
            callback(error);
            return;
        }
        callback(undefined, triplesToObject(triples));
    });
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
            normalized_field = rules[i][4],
            human_rationale = rules[i][5];
        // Check both for the field with incorrect name and the field with
        // correct name such that this API is future proof
        for (var j = 0; policy_id && j < record.length; ++j) {
            if (record[j][0] === roarmap_field &&
                (record[j][1] === if_field_equals ||
                 record[j][1] === normalized_field)) {
                    newRecord.push([
                        policy_id,
                        roarmap_field,
                        normalized_field,  // Postel's law
                        then,
                        human_rationale
                    ]);
                    // Note: no `break` since more than one rule may apply
                }
        }
    }
    return newRecord;
}

/// Run the API server.
/// \param getFunc Function used to get record by id.
/// \param searchFunc Function used to search by name.
/// \param fules Rules to evaluate compliance.
function runServer (getFunc, searchFunc, rules) {
    http.createServer(function (request, response) {

        if (request.url.match(/^\/id\/eprint\/[0-9]+$/)) {
            getFunc(request.url, function (error, record) {
                if (error) {
                    console.log("getFunc error:", error);
                    response.writeHead(500);
                    response.end("Internal Server Error\n");
                    return;
                }
                record.compliance = applyRules(rules, asList(simplify(record)));
                response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify(record));
            });
            return;
        }

        if (request.url.match(/^\/cgi\/search\/simple\?output=JSON&q=.*$/)) {
            searchFunc(request.url, function (error, record) {
                if (error) {
                    console.log("searchFunc error:", error);
                    response.writeHead(500);
                    response.end("Internal Server Error\n");
                    return;
                }
                response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify(record));
            });
            return;
        }

        var realpath;
        if (request.url === "/") {
            realpath = "app.html";
        } else if (request.url === "/app.js") {
            realpath = "app.js";
        } else if (request.url === "/app.css") {
            realpath = "app.css";
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
}

function doListen() {
    var getFunc = (program.cache) ? getObject : callEprints;
    var searchFunc = callEprints;
    loadRules(function (rules) {
        runServer(getFunc, searchFunc, rules);
    });
}

program
    .version("0.0.1")
    .option("-c, --cache", "Use cache instead of sending requests to roarmap")
    .option("-l, --listen", "Start local web server")
    .parse(process.argv);

if (program.listen) {
    doListen();
}
