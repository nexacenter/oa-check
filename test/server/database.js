// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const assert = require("chai").assert;
const database = require("../../lib/server/database");

describe("database", () => {
    describe("update_", () => {
        it("correctly updates the underlying data base", (done) => {

            let basicDocument = {
                foo: 3.14,
                foobar: [1, 2, 3],
                bar: "baz",
                jarjar: null
            };

            database.update_((err, data) => {
                assert.isNull(err);
                assert.deepEqual(JSON.parse(data.val), basicDocument);

                database.update_((err, data) => {
                    assert.isNull(err);
                    const val = JSON.parse(data.val);
                    assert.strictEqual(val.foo, basicDocument.foo);
                    assert.deepEqual(val.foobar, [1, 2, 3, 4]);
                    assert.strictEqual(val.baz, basicDocument.baz);
                    assert.strictEqual(val.jarjar, basicDocument.jarjar);
                    done();

                }, (callback) => {
                    basicDocument.foobar.push(4);
                    callback(null, JSON.stringify(basicDocument));
                });

            }, (callback) => {
                callback(null, JSON.stringify(basicDocument));
            });

        });
    });
});
