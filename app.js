// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

function drawCompliance(result) { // XXX Very naive impl.
    var html = "<table>";
    for (var i = 0; i < result.length; ++i) {
        html += "<tr><td>";
        html += result[i][0];
        html += "</td><td>";
        html += result[i][1];
        html += "</td><td>";
        html += result[i][2];
        html += "</td><td>";
        html += result[i][3];
        html += "</td><td>";
        html += result[i][4];
        html += "</td></tr>";
    }
    html += "</table>";
    jQuery("#result").html(html);
}

function getUniversity(universityId, callback) {
    jQuery.get({
        url: "/id/eprint/" + universityId,
        success: callback
    });
    return false;
}

function parse_url(url) { // See https://gist.github.com/jlong/2428561
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
}

function drawSearchResult(result) {
    var html = "<ol>";
    for (var i = 0; i < result.length; ++i) {
        html += "<li>";
        html += '<a href="#" onclick="getUniversity(' + + result[i].eprintid
                    + ', drawCompliance);">' + result[i].title + "</a>";
        html += "</li>";
    }
    html += "</ol>";
    jQuery("#result").html(html);
}

function searchUniversity(terms, cb) {
    jQuery.get({
        url: "/cgi/search/simple?output=JSON&q=" + encodeURIComponent(terms),
        success: cb
    });
}

jQuery("load", function () {
    jQuery("#submit").click(function () {
        var value = jQuery("#institution-id").val();
        if (value.match(/^[0-9]+$/)) {
            getUniversity(value, drawCompliance);
        }
    });
    jQuery("#search").click(function () {
        searchUniversity(jQuery("#search-terms").val(), drawSearchResult);
    });
});
