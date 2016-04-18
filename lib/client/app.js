// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var angular = require("angular");
var angularRoute = require("angular-route");
var rules = require("../common/rules");

angular.module("roarmap-h2020-view", ["ngRoute"])

    .config(function ($routeProvider) {
        $routeProvider
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

    .service("roarmapSearch", function (roarmapLoader) {

        // TODO: Here we should probably also store the searched
        // terms such that one also see them when he returns into
        // the search tab rather than seeing an empty box.
        var current = null;
        return {

            beginSearch: function (terms, callback) {
                current = [];
                terms = terms.toLowerCase();
                roarmapLoader(function (error, institutions) {
                    if (error) {
                        callback(error);
                        return;
                    }

                    // TODO: if performance becomes a bottleneck we could
                    // create once an index and then use such index
                    institutions.forEach(function (entry) {
                        if (entry.title.toLowerCase().indexOf(terms) >= 0) {
                            current.push(entry);
                        }
                    });
                    callback(null, current);
                });
            },

            getCurrentSearch: function () {
                return current;
            },
        };
    })

    // TODO: all the following code should be adapted not to throw
    // errors but rather to write somewhere what went wrong. Also
    // indication that processing is ongoing would be a great thing.

    .controller("SearchController", function ($scope, roarmapSearch) {
        $scope.g = {
            terms: "",
            result: roarmapSearch.getCurrentSearch(),
        };
        $scope.search = function () {
            roarmapSearch.beginSearch($scope.g.terms,
                                      function (error, result) {
                if (error) {
                    throw error;
                }
                $scope.g.result = result;
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
                    $scope.g.selected.nexa = rules.apply(institutions[i]);

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
