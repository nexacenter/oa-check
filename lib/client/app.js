// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var angular = require("angular");
var jQuery = require("jquery");
var rules = require("../common/rules");

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

/*
                         _
  __ _ _ __   __ _ _   _| | __ _ _ __
 / _` | '_ \ / _` | | | | |/ _` | '__|
| (_| | | | | (_| | |_| | | (_| | |
 \__,_|_| |_|\__, |\__,_|_|\__,_|_|
             |___/
*/

angular.module("roarmap-h2020-view", [])
    .controller("MainController", function ($scope, $http) {
        $scope.g = {
            institutions: [],
            state: "",
            search: {
                terms: "",
                result: [],
            },
        };

        $scope.search = function () {};
        $scope.show = function () {};

        $scope.g.state = "Calling /api/version...";
        $http({
            method: "GET",
            url: "/api/version",
            timeout: 1000,
        }).then(function (response) {
            $scope.g.state = "Calling /api/v1/institutions...";
            $http({
                method: "GET",
                url: "/api/v1/institutions",
                timeout: 20000,
            }).then(function (response) {

                try {
                    $scope.g.institutions = JSON.parse(response.data);
                } catch (error) {
                    $scope.g.state = "Cannot parse institutions JSON";
                    return;
                }
                $scope.g.state = "Successfully loaded institutions JSON";

                $scope.search = function () {
                    $scope.g.state = "Searching for: " + $scope.g.search.terms;
                    $scope.g.search.result = [];
                    $scope.g.institutions.forEach(function (entry) {
                        if (entry.title.toLowerCase().indexOf(
                                $scope.g.search.terms.toLowerCase()) >= 0) {
                            $scope.g.search.result.push(entry);
                        }
                    });
                };

                $scope.show = function (entry) {
                    drawCompliance(entry);
                };

            }, function (response) {
                $scope.g.state = "Calling /api/v1/institutions... ERROR";
            });
        }, function (response) {
            $scope.g.state = "Calling /api/version... ERROR";
        });
    });
