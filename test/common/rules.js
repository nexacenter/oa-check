// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

const assert = require("chai").assert;
const rules = require("../../lib/common/rules");

const entry = {
    "iliege_hefce_model": "not_specified",
    "gold_oa_options": "not_specified",
    "datestamp": "2014-12-15 22:09:36",
    "rights_holding": "not_mentioned",
    "status_changed": "2014-12-15 22:09:36",
    "repository_url": "http://preprints.acmac.uoc.gr/",
    "date_made_open": "not_mentioned",
    "waive_open_access": "not_specified",
    "maximal_embargo_waivable": "not_applicable",
    "policymaker_type": "research_org_subunit",
    "policymaker_url": "http://www.acmac.uoc.gr/index.php",
    "rights_retention_waivable": "not_applicable",
    "title": "ACMAC - Archimedes Center for Modeling, Analysis & Computation",
    "lastmod": "2015-07-24 08:29:49",
    "policy_colour": "black",
    "embargo_hum_soc": "not_specified",
    "type": "article",
    "policymaker_name": "ACMAC - Archimedes Center for Modeling, Analysis & Computation",
    "locus_of_deposit": "not_specified",
    "eprintid": 173,
    "country_inclusive": [
        "un_geoscheme",
        150,
        39,
        300
    ],
    "can_deposit_be_waived": "not_specified",
    "rev_number": 8,
    "date_of_deposit": "not_specified",
    "making_deposit_open": "not_mentioned",
    "country_names": [
        "Europe",
        "Southern Europe",
        "Greece"
    ],
    "deposit_of_item": "not_specified",
    "mandate_content_types": [
        "not_specified"
    ],
    "metadata_visibility": "show",
    "open_licensing_conditions": "not_specified",
    "userid": 251,
    "uri": "http://roarmap.eprints.org/id/eprint/173",
    "embargo_sci_tech_med": "not_specified",
    "eprint_status": "archive",
    "journal_article_version": "author_final",
    "open_access_waivable": "not_specified",
    "country": 300,
    "dir": "disk0/00/00/01/73",
    "apc_funding": "not_mentioned"
};

const rule = {
    field_id: 1024,
    compliant_values: {},
    guidelines: ["3.2", "3.20"],
};

describe("rules", () => {
    describe("evaluateRule", () => {
        it("throws Error if the input rule is invalid", () => {
            assert.throws((() => (rules.evaluateRule(rule, entry,
                "open_licensing_conditions", "req_cc_by"))), Error);
        });
    });
});
