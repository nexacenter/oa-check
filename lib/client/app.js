// This software is free software. See AUTHORS and LICENSE for more
// information on the copying conditions.

var angular = require("angular");
var rules = require("../common/rules");

angular.module("roarmap-h2020-view", [])
    .controller("MainController", function ($scope, $http) {
        $scope.g = {
            institutions: [],
            state: "",
            search: {
                terms: "",
                result: [],
            },
            selected: {}
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
                    // TODO: colors and details expansion for now
                    // are still missing in the view!
                    $scope.g.selected = rules.apply(entry);
                };

            }, function (response) {
                $scope.g.state = "Calling /api/v1/institutions... ERROR";
            });
        }, function (response) {
            $scope.g.state = "Calling /api/version... ERROR";
        });
    });
