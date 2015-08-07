(function() {
    'use strict';
    
    angular.module('timeperiod', ['ngResource', 'ngMaterial', 'ngAnimate'])

    .config(function($interpolateProvider, $httpProvider) {
        // Force angular to use square brackets for template tag
        // The alternative is using {% verbatim %}
        $interpolateProvider.startSymbol('[[').endSymbol(']]');

        // CSRF Support
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    })

    .config(['$resourceProvider', function($resourceProvider) {
      $resourceProvider.defaults.stripTrailingSlashes = false;
    }])

    .factory('User', ['$resource', function($resourse) {
        return $resourse('api/users/:id/', {id: 'current'});
    }])
    
    .factory('Activity', ['$resource', function($resourse) {
        return $resourse('api/activities/', null, {'update': { method:'PUT' }});
    }])

    .factory('Periods', ['$resource', function($resourse) {
        return $resourse('api/activities/:id/periods/', {id:'@id'});
    }])


    .controller('OptionsCtrl', ['User', '$mdSidenav', '$http', "$mdToast", function(User, $mdSidenav, $http, $mdToast) {
        var options = this;
        options.user = null;

        options.getUser = function() {
            User.get(function(data){
                options.user = data;
                options.activities.update();
            }, function(error){
                options.user = null;
                $mdToast.show(
                  $mdToast.simple()
                  .content(error.data.detail)
                  .position("left right bottom")
                  .hideDelay(3000)
                );
            });
        };

        options.getUser();

        options.logout = function(){
            $http.get("/api-auth/logout/")
            .success(function(){
                options.user = null;
            });
        };

        options.login = function(){
            var data = "username="+options.username+"&password="+options.password;
            $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
            $http.post("/api-auth/login/?next=/timeperiod/", data)
            .success(function(data){
                console.log(data);
                options.username = null;
                options.password = null;
                options.getUser();
            })
            .error(function(data, status, headers, config) {
                $mdToast.show(
                  $mdToast.simple()
                  .content('Server error: '+status)
                  .position("left right bottom")
                  .hideDelay(3000)
                );
            });
        };
    }])

    .controller('ActivitiesCtrl', ['Periods', '$http', 'User', 'Activity', '$anchorScroll', '$location', '$mdSidenav', function(Periods, $http, User, Activity, $anchorScroll, $location, $mdSidenav) {
        var vm = this;
        vm.list = [];

        vm.toggleSidenavbar = function(){
            var navID = "left";
            $mdSidenav(navID)
            .toggle();
          }

        vm.update = function() {
            Activity.query(function(activities){
                vm.list = activities;
            })
        };

        vm.update();

        vm.new = function(){
            Activity.save(function(obj){
                obj.editing = true;
                vm.list.unshift(obj);
            }, function(){
                console.log("save bad");
            });
        }

        vm.edit = function(activity) {
            if(activity.editing) {
                activity.editing = false;
                $http.put(activity.url, activity).success(function(obj){
                    console.log("update ok");
                }).error(function(){
                    console.log("update bad");
                });
            }
            else {
                activity.editing = true;
                var newHash = activity.$$hashKey;
                if($location.hash() !== newHash)
                    $location.hash(newHash);
                else
                    $anchorScroll();
                $http.get(activity.url+'periods/').success(function(data){
                    activity.periods = data;
                    console.log(activity);
                });
            }
        }

        vm.eliminate = function(activity, index){
            $http.delete(activity.url).success(function (data, status) {
                vm.list.splice(index, 1);
            }).error(function(){
                console.log("delete bad");
            });
        }

        vm.toggleRunning = function(activity) {
            if(activity.running) {
                activity.running = false;
                var period = activity.periods[activity.periods.length-1]
                var now = new Date();
                period.end = now.toJSON();
                console.log(period);
                $http.put(period.url, period).success(function(obj){
                    console.log(obj)
                });
            }
            else {
                activity.running = true;

                $http.post('api/periods/', {activity: activity.url})
                .success(function(period) {
                    period.end = period.start;
                    if(!('periods' in activity))
                        activity.periods = [];
                    activity.periods.push(period);
                })
                .error(function(data, status, headers, config){
                    vm.response_error = data;
                });
            }
        }

        vm.getAVImage = function(activity) {
            if(activity.running)
                return "/static/timeperiod/mdi/av/svg/production/ic_pause_48px.svg";
            else
                return "/static/timeperiod/mdi/av/svg/production/ic_play_arrow_48px.svg";
        }

        vm.retrieve_total = function(activity){
            console.log('retrieve_total')
            $http.get(activity.url+'total/').success(function(data){
                console.log('data '+data)
                activity.total = Number(data);
            });
        }

    }])

    .filter('timediff', function(){
        function my_round(value, unit) {
            value = Math.round(value);
            return value + ' ' + (value == 1? unit : unit+'s');
        }
        return function(seconds){
            if(seconds < 60)
                return my_round(seconds, 'second');
            if(seconds < 3600)
                return my_round(seconds/60, 'minute');
            else
                return my_round(seconds/3600, 'hour');
        }
    })

    .filter("sanitize", ['$sce', function($sce) {
        return function(htmlCode){
            return $sce.trustAsHtml(htmlCode);
        }
    }])

    .directive('period', function(){
        return{
            restrict: 'E',
            templateUrl: '/static/timeperiod/partials/period.html',
            controller: 'PeriodCtrl',
            controllerAs: 'period',
            scope: {
                period_json: '=json'
            }
        };
    })

    .controller('PeriodCtrl', ['$scope', '$http','$mdDialog', function($scope, $http, $mdDialog) {
        var period = this;
        period.start = $scope.period_json.start;
        period.end = $scope.period_json.end;
        period.editing = false;
        period.href = $scope.period_json.url;

        period.retrieve = function() {
            $http.get(period.href)
            .success(function(data) {
                period.start = data.start;
                period.end = data.end;
                period.href = data.url;
            })
            .error(function(data, status, headers, config){
                console.log(status);
            });
        }

        period.edit = function() {
            if(period.editing) {
                period.editing = false;
            }
            else {
                period.editing = true;
                period.retrieve();
            }
        };

        period.duration = function() {
            var start = new Date(period.start);
            if(period.end)
                var end = new Date(period.end);
            else
                return 0;
            var diff = (end - start) / 1e3;
            return diff;
            
            // return moment.utc(moment(period.end).diff(moment(period.start))).format("mm");
            // return period.end - period.start;
        };

        period.eliminate = function() {
            console.log(period);
            $http.delete(period.href).success(function (data, status) {
                // vm.list.splice(index, 1);
            }).error(function(){
                console.log("delete bad");
            });
        };

        period.showAlert = function(ev) {
            var confirm = $mdDialog.confirm()
                .parent(angular.element(document.body))
                .title('Eliminate')
                .content('Are you sure?')
                .ariaLabel('Eliminate this period')
                .ok('Eliminate!')
                .cancel('Keep it')
                .targetEvent(ev);
            $mdDialog.show(confirm).then(function() {
                period.eliminate();
            }, function() {

            });
            
        };

    }]);

})();