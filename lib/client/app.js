// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var angular = require("angular");
var angularRoute = require("angular-route");
var rules = require("../common/rules");

angular.module("roarmap-h2020-view", ["ngRoute"])

    .config(["$routeProvider", function ($routeProvider) {
        $routeProvider
            .when("/search", {
                templateUrl: "partials/search.html",
                controller: "SearchController",
            })
            .when("/institutions/:eprintid", {
                templateUrl: "partials/institution.html",
                controller: "InstitutionController",
            })
            .otherwise({
                redirectTo: "/search",
            });
    }])

    .service("roarmapLoader", function ($http) {
        var institutions = null;
        return function (callback) {
            if (institutions !== null) {
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

    .controller("SearchController", function ($scope, $http, roarmapSearch) {
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
                function ($scope, $http, $routeParams, roarmapLoader) {
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
                    console.log(institutions[i]);
                    $scope.g.selected = institutions[i];
                    $scope.g.selected.nexa = rules.apply(institutions[i]);
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
                    // TODO: colors and details expansion for now
                    // are still missing in the view!
                    return;
                }
            }
        });
    });
