// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const rules = require("../common/rules");
const fs = require("fs");
const scrape = require("./scrape");

const simplify = (x) => {
    let r = {};
    for (let i = 0; i < x.length; ++i) {
        r[x[i].field_id] = x[i].is_compliant;
    }
    return r;
}

exports.test = () => {
    scrape.scrape((err, data) => {
        if (err) {
            throw err;
        }
        let records = JSON.parse(data);
        let map = {};
        for (let i = 0; i < records.length; ++i) {
            let record = records[i];
            map[record.eprintid] = simplify(rules.apply(record));
        }
        fs.writeFileSync("test-vector.json.new",
            JSON.stringify(map, undefined, 4), "utf-8");
    });
}
