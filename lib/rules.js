// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

"use strict";

// Rules to evaluate compliancy according to Nexa Center
var NEXA_RULES = {
    can_deposit_be_waived: {
        meg_id: 1,
        field_id: 7,
        compliantValues: "no",
        guidelines: 3.12
    },

    date_made_open: {
        meg_id: 2,
        field_id: 10,
        compliantValues: function (v, r) { return (
          (["acceptance", "publication"].indexOf(v) >= 0)
            ? 1.0
            : (v === "embargo" &&
                  ["0m", "6m", "12m"].indexOf(r.embargo_hum_soc) >= 0 &&
                  ["0m", "6m"].indexOf(r.embargo_sci_tech_med) >= 0)
              ? 2.0
              : false
        ); },
        guidelines: 3.14,
        gmga: "29.2.2.b",
    },

    date_of_deposit: {
        meg_id: 3,
        field_id: 16,
        compliantValues: ["acceptance", "publication"],
        guidelines: [3.6, 3.8],
        gmga: "29.2.2.a.1",
    },

    deposit_of_item: {
        meg_id: 4,
        field_id: 2,
        compliantValues: "required",
        guidelines: 3.6,
        gmga: ["29.2.2.a.1", "29.2.2.c.1"],
    },

    embargo_hum_soc: {
        meg_id: 5,
        field_id: 16,
        compliantValues: ["0m", "6m", "12m"],
        guidelines: 3.14,
        gmga: "29.2.2.b",
    },

    embargo_sci_tech_med: {
        meg_id: 6,
        field_id: 15,
        compliantValues: ["0m", "6m"],
        guidelines: 3.14,
        gmga: "29.2.2.b",
    },

    gold_oa_options: {
        meg_id: 7,
        field_id: 19,
        compliantValues: function () { return true; },
        guidelines: [3.5, 3.13, 3.15],
        gmga: "29.2.2.b",
        normalize: function (v) { return (
            ((v === "reccomended") ? "recommended" :
                           (v === "reqired") ? "required" : v)
        ); },
    },

    journal_article_version: {
        meg_id: 8,
        field_id: 6,
        compliantValues: ["author_final", "published"],
        guidelines: [3.6, 3.8, 3.14],
        gmga: "29.2.2.a.1",
    },

    locus_of_deposit: {
        meg_id: 9,
        field_id: 3,
        compliantValues: ["any_repo", "institution_repo", "suject_repo"],
        guidelines: [3.6, 3.9, 3.14],
        gmga: "29.2.2.a.1",
    },

    making_deposit_open: {
        meg_id: 10,
        field_id: 8,
        compliantValues: "required",
        guidelines: [3.1, 3.15, 3.17],
        gmga: ["29.1.1", "29.2.1", "29.2.2.b", "29.2.2.c.1"],
    },

    maximal_embargo_waivable: {
        meg_id: 11,
        field_id: 17,
        compliantValues: function (v) { return (
          (["no", "not_specified"].indexOf(v) >= 0)
            ? true
            : (v === "yes")
              ? 0.25
              : false
        ); },
        guidelines: 3.14,
        gmga: "29.2.2.b",
        fuzzyLabels: {
            0.25: "Please note that European Commission does not " +
                  "expressly state that maximal embargo cannot be " +
                  "waived. However, given that a maximal embargo " +
                  "is established, and no exceptions are mentioned, " +
                  "it is reasonable to believe that waiver is not admitted.",
        },
    },

    waive_open_access: {
        meg_id: 12,
        field_id: 9,
        compliantValues: function (v) { return (
          (v === "no")
            ? 0.75
            : (v === "yes")
              ? 0.25
              : false
        ); },
        gmga: ["29.1.1", "29.1.2"],
        fuzzyLabels: {
            0.75: "However, please note that Open Access must be " +
                  "sacrificed when specific conflicting obligations " +
                  "to be respected subsist.",
            0.25: "Except if the waiver is limited to specific exceptions " +
                  "introduced in order to safeguard specific obligations " +
                  "conflicting with Open Access.",
        },
    },

    open_licensing_conditions: {
        meg_id: 13,
        field_id: 18,
        compliantValues: "req_cc_by",
        guidelines: [3.2, 3.20],
    },

    mandate_content_types: {
        field_id: 5,
        compliantValues: function (value) { return (
            value.indexOf("not_specified") < 0
        ); },
        guidelines: [3.1, 3.3, 3.4, 3.11],
        gmga: ["29.2.1", "29.2.2.a.2"],
    },
};

var evaluateRule = function (rule, record, key, value) {
    var compliantValues = rule.compliantValues,
        initialExpr = compliantValues;
    var compliant = ((typeof compliantValues === "string" &&
                      value === compliantValues) ||
                     (compliantValues instanceof Array &&
                      compliantValues.indexOf(value) >= 0) ||
                     (compliantValues instanceof Function &&
                      compliantValues(value, record, key)));
    return {
        clause: compliantValues,
        expr: initialExpr,
        fuzzyLabel: (rule.fuzzyLabels && rule.fuzzyLabels[compliant]),
        value: compliant
    };
}

var applyRules = exports.applyRules = function (record) {
    var rules = NEXA_RULES;
    var newRecord = [];
    Object.keys(rules).forEach(function (key) {
        var rule = rules[key],
            value = record[key],
            compliantRec = evaluateRule(rule, record, key, value);
        newRecord.push({
            field_id: rule.field_id,
            field: key,
            value: (function () {
                return (rule.normalize && rule.normalize(value));
            })() || value,
            is_compliant: (compliantRec.value >= 0.5),
            is_compliant_float: compliantRec.value,
            guidelines: rule.guidelines,
            gmga: rule.gmga,
            is_compliant_expr: (
                (compliantRec.expr instanceof Function &&
                 compliantRec.expr.toString()) ||
                JSON.stringify(compliantRec.expr)),
            specific_clause: (
                (compliantRec.clause instanceof Function &&
                 compliantRec.clause.toString()) ||
                JSON.stringify(compliantRec.clause)),
            normalize_expr: (
                (rule.normalize && rule.normalize.toString()) || undefined),
            fuzzy_label: compliantRec.fuzzyLabel,
        });
    });
    return newRecord;
}
