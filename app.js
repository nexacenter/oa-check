// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

function escapeHtml(unsafe) { // See http://stackoverflow.com/questions/6234773
    unsafe = unsafe + "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function drawCompliance(result) {
    var html = "<h1>" + escapeHtml(result.title) + "</h1>";
    html += "<p><a href='" + escapeHtml(result.uri) + "'>"
                + escapeHtml(result.uri) + "</a></p>";
    html += "<p><table>";
    for (var i = 0; i < result.compliance.length; ++i) {
        html += "<tr><td>";
        html += escapeHtml(result.compliance[i][0]);
        html += "</td><td>";
        html += escapeHtml(result.compliance[i][1]);
        html += "</td><td>";
        html += escapeHtml(result.compliance[i][2]);
        html += "</td><td>";
        html += escapeHtml(result.compliance[i][3]);
        html += "</td></tr>";
    }
    html += "</table></p>";
    jQuery("#university").html(html);
}

function getUniversity(universityId, callback) {
    jQuery.get({
        url: "/id/eprint/" + universityId,
        success: callback
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
    jQuery.get({
        url: "/cgi/search/simple?output=JSON&q=" + encodeURIComponent(terms),
        success: cb
    });
}

jQuery("load", function () {
    jQuery("#search").click(function () {
        search(jQuery("#search-terms").val(), drawSearchResult);
    });
});
