// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var angular = require("angular");
var jQuery = require("jquery");
var rules = require("../common/rules");
var institutions_by_id = {};
var institutions_by_name = {};

/*
   _
  (_) __ _ _   _  ___ _ __ _   _
  | |/ _` | | | |/ _ \ '__| | | |
  | | (_| | |_| |  __/ |  | |_| |
 _/ |\__, |\__,_|\___|_|   \__, |
|__/    |_|                |___/
*/

function escapeHtml(unsafe) { // See http://stackoverflow.com/questions/6234773
    unsafe = unsafe + "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function drawDetails(info) {
    var html = "<td>";
    if (info instanceof Array) {
        for (var i = 0; i < info.length; ++i) {
            html += "<a href='details.html#" + escapeHtml(info[i]) + "' target='_blank'>[" + escapeHtml(info[i]) + "]</a> ";
        }
    } else if (info) {
        html += "<a href='details.html#" + escapeHtml(info) + "' target='_blank'>[" + escapeHtml(info) + "]</a>";
    }
    html += "</td>";
    return html;
}

function drawCompliance(result) {

    result.compliance = rules.apply(result);

    var html = "<h1>" + escapeHtml(result.title) + "</h1>";
    html += "<p><a href='" + escapeHtml(result.uri) + "'>" + escapeHtml(result.uri) + "</a></p>";
    html += "<p><a href='#' id='toggle-debug'>toggle debug</a></p>";
    html += "<p><table>";
    for (var i = 0; i < result.compliance.length; ++i) {
        var rec = result.compliance[i];
        if (i === 0) {
            html += "<tr>";
            html += "<th>field</th>";
            html += "<th>value</th>";
            html += "<th>fuzzy_label</th>";
            html += "<th style='display: none' class='debug-info'>is_compliant_expr</th>";
            html += "<th style='display: none' class='debug-info'>normalize_expr</th>";
            html += "<th>guidelines</th>";
            html += "<th>gmga</th>";
            html += "</tr>";
        }
        html += "<tr>";
        html += "<td>" + escapeHtml(rec.field) + "</td>";
        html += "<td>";
        if (rec.is_compliant) {
            html += "<font color='green'>";
        } else {
            html += "<font color='red'>";
        }
        html += escapeHtml(JSON.stringify(rec.value)) + "</font></td>";
        html += "<td>" + escapeHtml(rec.fuzzy_label || "") + "</td>";
        var idx = rec.is_compliant_expr.lastIndexOf(rec.specific_clause);
        if (idx >= 0) {
            html += "<td style='display: none' class='debug-info'>";
            html += escapeHtml(rec.is_compliant_expr.substr(0, idx));
            if (rec.is_compliant) {
                html += "<font color='green'><b>";
            } else {
                html += "<font color='red'><b>";
            }
            html += escapeHtml(rec.specific_clause);
            html += "</b></font>";
            html += escapeHtml(rec.is_compliant_expr.substr(
                idx + rec.specific_clause.length));
            html += "</td>";
        } else {
            html += "<td>N/A</td>";
        }
        html += "<td style='display: none' class='debug-info'>" + escapeHtml(rec.normalize_expr || "") + "</td>";
        html += drawDetails(rec.guidelines);
        html += drawDetails(rec.gmga);
        html += "</tr>";
    }
    html += "</table></p>";
    jQuery("#university").html(html);
    jQuery("#toggle-debug").click(function () {
        jQuery(".debug-info").toggle();
        return false;
    });
}

function getUniversity(universityId, callback) {
    jQuery("#university").html("Getting info about universityId: " + universityId + "...");

    if (institutions_by_id[universityId] !== undefined) {
        callback(institutions_by_id[universityId]);
        return;
    }

    jQuery("#university").html("Not found");
    return false;
}

function doClick(eprintid) {
    getUniversity(eprintid, drawCompliance);
}

function drawSearchResult(result) {
    var html = "<ol>";
    for (var i = 0; i < result.length; ++i) {
        html += "<li>";
        html += '<a href="#" id="result-' + i + '"></a>';
        html += "</li>";
    }
    html += "</ol>";
    jQuery("#search-result").html(html);
    jQuery("#university").html("");
    for (i = 0; i < result.length; ++i) {
        jQuery("#result-" + i).text(result[i].title);
        jQuery("#result-" + i).attr("eprintid", result[i].eprintid);
        jQuery("#result-" + i).click(function () {
            doClick(jQuery(this).attr("eprintid"));
        });
    }
}

function search(terms, cb) {
    terms = terms.toLowerCase();

    if (terms.match(/^[0-9]+$/)) {
        getUniversity(terms, drawCompliance);
        return;
    }
    jQuery("#search-result").html("Searching for: " + terms + "... ");

    if (institutions_by_name[terms] !== undefined) {
        cb([institutions_by_name[terms]]);
        return;
    }

    // See: http://stackoverflow.com/a/21185103
    (function next(keys, index, result) {
        if (index === keys.length) {
            cb(result);
            return;
        }
        var entry = institutions_by_name[keys[index]];
        if (entry.title.toLowerCase().indexOf(terms) >= 0) {
            result.push(entry);
        }
        process.nextTick(function () {
            next(keys, index + 1, result);
        });
    })(Object.keys(institutions_by_name), 0, []);
}

/*
                         _
  __ _ _ __   __ _ _   _| | __ _ _ __
 / _` | '_ \ / _` | | | | |/ _` | '__|
| (_| | | | | (_| | |_| | | (_| | |
 \__,_|_| |_|\__, |\__,_|_|\__,_|_|
             |___/
*/

function initGlobals(result) {
    for (var i = 0; i < result.length; ++i) {
        var entry = result[i];
        institutions_by_id[entry.eprintid] = entry;
        institutions_by_name[entry.title.toLowerCase()] = entry;
    }
    jQuery("#search").click(function () {
        search(jQuery("#search-terms").val(), drawSearchResult);
    });
}

angular.module("roarmap-h2020-view", [])
    .controller("MainController", function ($scope, $http) {
        $scope.institutions = {};
        $scope.state = "Calling /api/version...";
        $http({
            method: "GET",
            url: "/api/version",
            timeout: 1000,
        }).then(function (response) {
            $scope.state = "Calling /api/v1/institutions...";
            $http({
                method: "GET",
                url: "/api/v1/institutions",
                timeout: 20000,
            }).then(function (response) {
                try {
                    $scope.institutions = JSON.parse(response.data);
                } catch (error) {
                    $scope.state = "Cannot parse institutions JSON";
                    return;
                }
                $scope.state = "Successfully loaded institutions JSON";
                // Glue together Angular.js and jQuery code
                initGlobals($scope.institutions);
            }, function (response) {
                $scope.state = "Calling /api/v1/institutions... ERROR";
            });
        }, function (response) {
            $scope.state = "Calling /api/version... ERROR";
        });
    });
