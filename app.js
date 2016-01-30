// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

function drawCompliance(title, result) { // XXX Very naive impl.
    var html = "<h1>" + title + "</h1><table>";
    for (var i = 0; i < result.length; ++i) {
        html += "<tr><td>";
        html += result[i][0];
        html += "</td><td>";
        html += result[i][1];
        html += "</td><td>";
        html += result[i][2];
        html += "</td><td>";
        html += result[i][3];
        html += "</td></tr>";
    }
    html += "</table>";
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

function doClick(title, eprintid) {
    getUniversity(eprintid, function (result) {
        drawCompliance(title, result);
    });
}

function drawSearchResult(result) {
    var html = "<ol>";
    for (var i = 0; i < result.length; ++i) {
        html += "<li>";
        html += '<a href="#" onclick="doClick('
                    + "'" + result[i].title + "' ,"
                    + result[i].eprintid
                    + ');">'
            + result[i].title + "</a>";
        html += "</li>";
    }
    html += "</ol>";
    jQuery("#search-result").html(html);
    jQuery("#university").html("");
}

function searchUniversity(terms, cb) {
    jQuery.get({
        url: "/cgi/search/simple?output=JSON&q=" + encodeURIComponent(terms),
        success: cb
    });
}

jQuery("load", function () {
    jQuery("#search").click(function () {
        searchUniversity(jQuery("#search-terms").val(), drawSearchResult);
    });
});
