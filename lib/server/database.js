// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const Datastore = require("nedb");
const db = new Datastore({
    filename: 'roarmap.db',
    autoload: true,
    timestampData: true,
});
const interval = process.env.UPDATE_INTERVAL || 900000;
const scrape = require("./scrape");
const stamp = () => (new Date().getTime());

db.persistence.setAutocompactionInterval(interval * 4);

let latest = stamp();

// Semi internal function to test the updating logic
const update_ = exports.update_ = (callback, provider) => {
    console.log("Started scraper");
    provider((error, d) => {
        if (error) {
            console.log("Scraper failed", error);
            callback(error);
            return;
        }
        console.log("Scraper succeeded; now updating database");
        db.update({
            type: 'roarmap-dump'
        }, {
            type: 'roarmap-dump',
            val: d,
        }, {
            upsert: true,
            returnUpdatedDocs: true,
        }, (err, numAffected, affectedDocuments, upsert) => {
            if (err) {
                console.log("Database update failed", err);
                callback(err);
                return;
            }
            console.log(`numAffected: ${numAffected}`);
            console.log(`upsert: ${upsert}`);
            if (numAffected !== 1) {
                console.log("Possibly programmer error");
                callback(new Error("Programmer error"));
                return;
            }
            console.log("Database update succeeded");
            callback(null, affectedDocuments);
        });
    });
};

const update = exports.update = (callback) => {
    console.log("");
    update_((error, data) => {
        console.log("");
        callback(error, data);
    }, scrape.scrape);
};

const query = exports.query = (callback) => {
    console.log("Querying database");
    db.find({
        type: 'roarmap-dump'
    }, (err, docs) => {
        if (err) {
            console.log("Query failed", err);
            callback(err);
            return;
        }
        if (docs.length === 0) {
            console.log("Database empty");
            update((err, docs) => {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, docs.val);
            });
            return;
        }
        if (docs.length !== 1) {
            console.log("Invalid docs length");
            callback(new Error("Programmer error"));
            return;
        }
        const now = stamp();
        if (now - latest > interval) {
            console.log("Triggering background update");
            // Immediately update time such that subsequent queries do not
            // trigger other, expensive scraping processes
            latest = now;
            update(() => {});
            // fallthrough
        }
        callback(null, docs[0].val);
    });
};
