// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const rules = require("../common/rules");
const fs = require("fs");
const filename = "test/fixtures/test-vector.json.new";
const scrape = require("./scrape");

exports.main = () => {
    scrape.scrape((err, data) => {
        if (err) {
            throw err;
        }

        const res = JSON.parse(data).map(policy => ({
            [policy.eprintid]: rules.apply(policy).map(compliance => ({
                [compliance.field_id]: compliance.is_compliant
            })).reduce((all, one) => (Object.assign(all, one)))
        })).reduce((all, one) => (Object.assign(all, one)));

        fs.writeFileSync(filename,
            JSON.stringify(res, undefined, 4), "utf-8");
        console.log(`Test vector written as ${filename}`);
    });
};
