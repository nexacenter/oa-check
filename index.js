// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

var fs = require("fs"),
    http = require("http"),
    level = require("level-browserify"),
    levelgraph = require("levelgraph"),
    program = require("commander"),
    kvCache = levelgraph(level("cache")),
    kvHostName = 'roarmap.eprints.org',
    kvPort = process.env.PORT || 8080;

const applyRules = require("./roarmap-rules").applyRules;

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

function searchObject(pattern, callback) {
    pattern = pattern.replace("/cgi/search/simple?output=JSON&q=", "");
    pattern = pattern.toLowerCase();
    kvCache.search([{
        subject: kvCache.v("uri"),
        predicate: "title",
        object: kvCache.v("title")
    }, {
        subject: kvCache.v("uri"),
        predicate: "eprintid",
        object: kvCache.v("eprintid")
    }], function (error, triples) {
        // XXX: Is there a more efficient way than the following?
        var uris = [];
        for (var i = 0; i < triples.length; ++i) {
            if (triples[i].title.toLowerCase().indexOf(pattern) >= 0) {
                uris.push(triples[i]);
            }
        }
        callback(undefined, uris);
    });
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

/// Run the API server.
/// \param getFunc Function used to get record by id.
/// \param searchFunc Function used to search by name.
/// \param fules Rules to evaluate compliance.
function runServer (getFunc, searchFunc) {
    http.createServer(function (request, response) {

        if (request.url.match(/^\/id\/eprint\/[0-9]+$/)) {
            getFunc(request.url, function (error, record) {
                if (error) {
                    console.log("getFunc error:", error);
                    processError(error, response);
                    return;
                }
                record.compliance = applyRules(record);
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
                    processError(error, response);
                    return;
                }
                response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify(record));
            });
            return;
        }

        if (request.url === "/api/version") {
            response.writeHead(200, {
                "Content-Type": "application/json"
            });
            response.end(JSON.stringify({version: "0.0.1"}));
            return;
        }

        var realpath;
        if (request.url === "/") {
            realpath = "static/app.html";
        } else if (request.url === "/app.js") {
            realpath = "static/app.js";
        } else if (request.url === "/app.css") {
            realpath = "static/app.css";
        } else if (request.url === "/details.html") {
            realpath = "static/details.html";
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
    var searchFunc = (program.cache) ? searchObject : callEprints;
    runServer(getFunc, searchFunc);
}

function doTest() {
    function simplify(x) {
        var r = {};
        for (var i = 0; i < x.length; ++i) {
            r[x[i].field_id] = x[i].is_compliant;
        }
        return r;
    }
    var records = JSON.parse(fs.readFileSync("roarmap-dump.json", "utf8"));
    var map = {};
    for (var i = 0; i < records.length; ++i) {
        var record = records[i];
        map[record.eprintid] = simplify(applyRules(record));
    }
    fs.writeFileSync("test-vector.json.new",
            JSON.stringify(map, undefined, 4), "utf-8");
}

function doUpdate() {
    kvCache.del({}, function (error) {
        if (error) throw error;
        var all = JSON.parse(fs.readFileSync("roarmap-dump.json", "utf8"));
        for (var i = 0; i < all.length; ++i) {
            Object.keys(all[i]).forEach(function (key) {
                if (key !== "uri") {
                    kvCache.put({subject: all[i].uri, predicate: key,
                                 object: all[i][key]});
                }
            });
        }
    });
}

program
    .version("0.0.1")
    .option("-c, --cache", "Use cache instead of sending requests to roarmap")
    .option("-l, --listen", "Start local web server")
    .option("-t, --test", "Produce test vector from roarmap-dump.json")
    .option("-u, --update", "Update cache from file name roarmap-dump.json")
    .parse(process.argv);

if (program.listen) {
    doListen();
} else if (program.test) {
    doTest();
} else if (program.update) {
    doUpdate();
} else {
    program.help();
}
