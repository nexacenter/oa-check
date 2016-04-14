// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var jQuery = require("jquery");
var rules = require("../common/rules");

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
            html += "<a href='details.html#" + escapeHtml(info[i])
                    + "' target='_blank'>[" + escapeHtml(info[i]) + "]</a> ";
        }
    } else if (info) {
        html += "<a href='details.html#" + escapeHtml(info)
                + "' target='_blank'>[" + escapeHtml(info) + "]</a>";
    }
    html += "</td>";
    return html;
}

function drawCompliance(result) {

    result.compliance = rules.apply(result);

    var html = "<h1>" + escapeHtml(result.title) + "</h1>";
    html += "<p><a href='" + escapeHtml(result.uri) + "'>"
                + escapeHtml(result.uri) + "</a></p>";
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
    jQuery.get({
        url: "/id/eprint/" + universityId,
        success: callback,
        error: function (_, s, e) {
            jQuery("#university").html("<p>Failure: type=" + escapeHtml(s)
                + ", reason=" + escapeHtml(e) + "</p>");
        },
    });
    return false;
}

function parseUrl(url) { // See https://gist.github.com/jlong/2428561
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
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
    if (terms.match(/^[0-9]+$/)) {
        getUniversity(terms, drawCompliance);
        return;
    }
    jQuery("#search-result").html("Searching for: " + terms + "... ");
    jQuery.get({
        url: "/cgi/search/simple?output=JSON&q=" + encodeURIComponent(terms),
        success: cb,
        error: function (_, s, e) {
            jQuery("#search-result").html("<p>Failure: type=" + escapeHtml(s)
                + ": reason=" + escapeHtml(e) + "</p>");
        },
    });
}

function getVersion() {
    jQuery.get({
        url: "/api/version",
        success: function (result) {
            if (result.version === 1) {
                jQuery("#search").click(function () {
                    search(jQuery("#search-terms").val(), drawSearchResult);
                });
            } else {
                jQuery("#search-result").text("unsupported version");
            }
        },
        error: function (_, s, e) {
            jQuery("#search-result").html("<p>Failure: type=" + escapeHtml(s)
                + ": reason=" + escapeHtml(e) + "</p>");
        },
    });
}

jQuery("load", function () {
    getVersion();
});
