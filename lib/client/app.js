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
                controller: "MainController",
            })
            .otherwise({
                redirectTo: "/search",
            });
    }])

    .service("roarmapLoader", function ($http) {
        var institutions = null;
        return function (callback) {
            if (institutions) {
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

    .controller("MainController", function ($scope, $http, roarmapLoader) {
        $scope.g = {
            institutions: null,
            state: "",
            search: {
                terms: "",
                result: null
            },
            selected: null
        };

        $scope.search = function () {};
        $scope.show = function () {};

        roarmapLoader(function (error, institutions) {
            $scope.g.state = error;
            $scope.g.institutions = institutions;

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
                // TODO: colors and details expansion for now
                // are still missing in the view!
                $scope.g.selected = entry;
                $scope.g.selected.nexa = rules.apply(entry);
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
            };
        });
    });
