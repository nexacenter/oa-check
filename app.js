jQuery("load", function () {
    jQuery("#submit").click(function () {
        var value = jQuery("#institution-id").val();
        if (value.match(/^[0-9]+$/)) {
            jQuery.get({
                url: "/id/eprint/" + value,
                success: function (result) {
                    // XXX all of this is very naive
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
            });
        }
    });
});
