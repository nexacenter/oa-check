// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const assert = require("chai").assert;
const scrape = require("../../lib/server/scrape");

describe("scrape", () => {

    describe("fetch", () => {

        it("deals with request.request() errors", (done) => {
            scrape.fetch("http://www.google.com/robots.txt", (error) => {
                assert.instanceOf(error, Error);
                done();
            }, (options, callback) => {
                callback(new Error("xo"));
            });
        });

        it("deals with wrong response statuses", (done) => {
            scrape.fetch("http://www.google.com/robots.txt", (error) => {
                assert.instanceOf(error, Error);
                done();
            }, (options, callback) => {
                callback(null, {statusCode: 400});
            });
        });

    });

    describe("jsdomWrap", () => {

        it("deals with fetch() errors", (done) => {
            scrape.jsdomWrap("http://www.google.com/robots.txt", (error) => {
                assert.instanceOf(error, Error);
                done();
            }, (url, callback) => {
                callback(new Error("mm"));
            }, () => {
                throw new Error("xo");
            });
        });

    });

});
