// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const cluster = require("cluster");
const program = require("commander");

program
    .version("0.2.0")
    .option("-d, --dump", "Scrape roarmaps database and dump it to stdout")
    .parse(process.argv);

if (program.dump) {
    require("./lib/server/cmd_dump").main();
    return;
}

// Robustness model: process requests using a child process and
// respawn it in the event that it dies
if (cluster.isMaster) {
    console.log("forking worker process");
    cluster.fork();
    cluster.on("exit", (worker, code, signal) => {
        console.log("worker process died");
        setTimeout(() => {
            console.log("forking worker process");
            cluster.fork();
        }, 15000);
    });
} else {
    require("./lib/server/cmd_slave").main();
}
