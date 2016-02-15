// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

// Returns true if the STEM embarg period is compliant
var eval_stem_embarg = (value) => (["0m", "6m"].indexOf(value) >= 0);

// Returns true if HASS embarg period is compliant
var eval_hass_embarg = (value) => (["0m", "6m", "12m"].indexOf(value) >= 0);

// Rules to evaluate compliancy according to Nexa Center
exports.NEXA_RULES = {
    can_deposit_be_waived: {
        meg_id: 1,
        criterion_id: 7,
        compliantValues: "yes",
        guidelines: 3.13
    },

    date_made_open: {
        meg_id: 2,
        criterion_id: 10,
        compliantValues: (value, record) => {
            if (["acceptance", "publication"].indexOf(value) >= 0) {
                return true;
            }
            if (value !== "embargo") {
                return false;
            }
            return (eval_hass_embarg(record["embargo_hum_soc"]) &&
                    eval_stem_embarg(record["embargo_sci_tech_med"]));
        },
        guidelines: 3.15,
        gmga: "29.2.2.b",
    },

    date_of_deposit: {
        meg_id: 3,
        criterion_id: 16,
        compliantValues: ["acceptance", "publication"],
        guidelines: [3.7, 3.9],
        gmga: "29.2.2.a.1",
    },

    deposit_of_item: {
        meg_id: 4,
        criterion_id: 2,
        compliantValues: "required",
        guidelines: 3.7,
        gmga: ["29.2.2.a.1", "29.2.2.c.1"],
    },

    embargo_hum_soc: {
        meg_id: 5,
        criterion_id: 16,
        compliantValues: eval_hass_embarg,
        guidelines: 3.15,
        gmga: "29.2.2.b",
    },

    embargo_sci_tech_med: {
        meg_id: 6,
        criterion_id: 15,
        compliantValues: eval_stem_embarg,
        guidelines: 3.15,
        gmga: "29.2.2.b",
    },

    gold_oa_options: {
        meg_id: 7,
        criterion_id: 19,
        compliantValues: () => true,
        guidelines: [3.14, 3.16],
        gmga: "29.2.2.b",
        normalize: (value) => ((value === "reccomended") ? "recommended" :
                               (value === "reqired") ? "required" : value),
    },

    journal_article_version: {
        meg_id: 8,
        criterion_id: 6,
        compliantValues: ["author_final", "published"],
        guidelines: [3.7, 3.9, 3.15],
        gmga: "29.2.2.a.1",
    },

    locus_of_deposit: {
        meg_id: 9,
        criterion_id: 3,
        compliantValues: ["any_repo", "institution_repo", "suject_repo"],
        guidelines: [3.7, 3.10, 3.15],
        gmga: "29.2.2.a.1",
    },

    making_deposit_open: {
        meg_id: 10,
        criterion_id: 8,
        compliantValues: "required",
        guidelines: [3.2, 3.16, 3.18],
        gmga: ["29.1.1", "29.2.1", "29.2.2.b", "29.2.2.c.1"],
    },

    maximal_embargo_waivable: {
        meg_id: 11,
        criterion_id: 17,
        compliantValues: "no",
        guidelines: 3.15,
        gmga: "29.2.2.b",
    },

    open_access_waivable: {
        meg_id: 12,
        criterion_id: 9,
        compliantValues: "yes", // FIXME: I think this is wrong
        gmga: ["29.1.1", "29.1.2"],
    },

    open_licensing_conditions: {
        meg_id: 13,
        criterion_id: 18,
        compliantValues: "req_cc_by",
        guidelines: [3.3, 3.20],
    },

    mandate_content_types: {
        criterion_id: 5,
        compliantValues: (value) => (
            value.indexOf("not_specified") < 0
        ),
        guidelines: [3.2, 3.4, 3.5, 3.11],
        gmga: ["29.2.1", "29.2.2.a.2"],
    },
};
