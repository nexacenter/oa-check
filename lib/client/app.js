// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var angular = require("angular");
var angularRoute = require("angular-route");
var rules = require("../common/rules");

angular.module("roarmap-h2020-view", ["ngRoute"])

    .config(function ($routeProvider) {
        $routeProvider
            .when("/about", {
                templateUrl: "partials/about.html",
            })
            .when("/search", {
                templateUrl: "partials/search.html",
                controller: "SearchController",
            })
            .when("/institutions/:eprintid", {
                templateUrl: "partials/institution.html",
                controller: "InstitutionController",
            })
            .when("/by/type", {
                templateUrl: "partials/by_type.html",
                controller: "ByTypeController",
            })
            .when("/by/country", {
                templateUrl: "partials/by_country.html",
                controller: "ByCountryController",
            })
            .otherwise({
                redirectTo: "/search",
            });
    })

    .service("roarmapLoader", function ($http) {
        var institutions = null;
        return function (callback) {
            if (institutions !== null) {
                // TODO: we should probably sometimes reach out to
                // the server and see if anything was changed.
                callback(null, institutions);
                return;
            }
            $http({
                method: "GET",
                url: "/api/version",
                timeout: 2000,
            }).then(function (response) {
                $http({
                    method: "GET",
                    url: "/api/v1/institutions",
                    // TODO: now that scraping is performed in background
                    // by the server, this timeout is probably big.
                    timeout: 20000,
                }).then(function (response) {
                    try {
                        institutions = JSON.parse(response.data);
                    } catch (error) {
                        callback(error);
                        return;
                    }
                    callback(null, institutions);
                }, function (response) {
                    callback(new Error("/api/v1/institutions request failed"));
                });
            }, function (response) {
                callback(new Error("/api/version request failed"));
            });
        };
    })

    // TODO: all the following code should be adapted not to throw
    // errors but rather to write somewhere what went wrong. Also
    // indication that processing is ongoing would be a great thing.

    .controller("MainController", function ($scope, roarmapLoader) {
        $scope.g = {
            is_loaded: false
        };
        $scope.$on('$viewContentLoaded', function () {
            roarmapLoader(function (error, institutions) {
                if (error) {
                    throw error;
                }
                $scope.g.is_loaded = true;
            });
        });
    })

    .controller("SearchController", function ($scope, roarmapLoader) {
        $scope.g = {
            terms: "",
            result: null
        };
        $scope.search = function () {
            current = [];
            terms = $scope.g.terms.toLowerCase();
            roarmapLoader(function (error, institutions) {
                if (error) {
                    throw error;
                }

                // TODO: if performance becomes a bottleneck we could
                // create once an index and then use such index
                institutions.forEach(function (entry) {
                    if (entry.title.toLowerCase().indexOf(terms) >= 0) {
                        current.push(entry);
                    }
                });
                $scope.g.result = current;
            });
        };
    })

    .controller("InstitutionController",
                function ($scope, $routeParams, roarmapLoader) {
        $scope.g = {
            selected: null,
        };
        roarmapLoader(function (error, institutions) {
            if (error) {
                throw error;
            }

            // TODO: consider implementing a map if speed becomes a problem
            for (i = 0; i < institutions.length; ++i) {
                if (institutions[i].eprintid === ($routeParams.eprintid | 0)) {
                    $scope.g.selected = institutions[i];
                    $scope.g.selected.nexa = rules.apply(institutions[i],
                            function (entry) {
                                // Changes to avoid too large tables
                                // Humans will still understand <3
                                entry.field = entry.field.replace(/_/g, " ");
                                entry.reason = entry.reason.replace(/_/g, " ");
                                if (entry.value instanceof Array) {
                                    var value = entry.value;
                                    entry.value = "[ ";
                                    value.forEach(function (e) {
                                        e = e.replace(/_/g, " ");
                                        entry.value += e + ", ";
                                    });
                                    entry.value += "]";
                                } else {
                                    entry.value = entry.value.replace(/_/g, " ");
                                }
                                // Add color for boostrap list-group-item
                                entry.color = (entry.is_compliant) ?
                                    "success" : "danger";
                            });

                    // TODO: this block of code actually belongs to the
                    // function that applies rules, not to here.
                    var total = 0.0;
                    var compliant = 0.0;
                    $scope.g.selected.nexa.forEach(function (r) {
                        total += 1;
                        if (r.is_compliant) {
                            compliant += 1;
                        }
                    });
                    $scope.g.selected.percentage = (total > 0) ?
                            (compliant / total) * 100.0 : 0;

                    // Make policymaker_type more readable
                    $scope.g.selected.policymaker_type =
                            $scope.g.selected.policymaker_type
                                    .replace(/_/g, " ");

                    return;
                }
            }
        });
    })

    .controller("ByTypeController", function ($scope, roarmapLoader) {
        $scope.g = {
            aggregate: null,
            view: {},
        };

        roarmapLoader(function (error, institutions) {
            if (error) {
                throw error;
            }
            $scope.g.aggregate = {};
            $scope.g.view = {};
            institutions.forEach(function (e) {
                var k = e.policymaker_type;
                $scope.g.aggregate[k] = $scope.g.aggregate[k] || [];
                $scope.g.aggregate[k].push(e);
            });
        });
    })

    .controller("ByCountryController", function ($scope, roarmapLoader) {
        $scope.g = {
            aggregate: null,
            view: {},
        };

        roarmapLoader(function (error, institutions) {
            if (error) {
                throw error;
            }
            $scope.g.view = {};
            var p = {};
            institutions.forEach(function (e) {
                // Still not so readable but better than before
                var t = p;
                t = (t[e.country_names[0]] = (t[e.country_names[0]] || {}));
                t = (t[e.country_names[1]] = (t[e.country_names[1]] || {}));
                t = (t[e.country_names[2]] = (t[e.country_names[2]] || []));
                t.push(e);

            });
            $scope.g.aggregate = p;
        });
    });
