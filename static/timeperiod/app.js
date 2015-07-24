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

    .factory('User', ['$resource', function($resourse) {
        return $resourse('api/users/:id/', {id: 'current'});
    }])
    
    .factory('Activity', ['$resource', function($resourse) {
        return $resourse('api/users/:id/activities/', {id: 'current'});
    }])

    .controller('OptionsCtrl', ['User', '$mdSidenav', '$http', function(User, $mdSidenav, $http) {
        var options = this;
        options.user = null;
        options.user_is_auth = false;

        User.get(function(data){
            options.user = data;
            options.user_is_auth = true;
        }, function(){
            options.user = null;
            options.user_is_auth = false;
        });

        options.logout = function(){
            $http.get("/api-auth/logout/")
            .success(function(){
                options.user = null;
            });
        }
    }])

    .controller('ActivitiesCtrl', ['Activity', '$anchorScroll', '$location', '$mdSidenav', function(Activity, $anchorScroll, $location, $mdSidenav) {
        var vm = this;
        vm.list = [];
        $anchorScroll.yOffset = 500;

        vm.toggleSidenavbar = function(){
            var navID = "left";
            $mdSidenav(navID)
            .toggle()
            .then(function () {
                $log.debug("toggle " + navID + " is done");
            });
          }

        Activity.query(function(list){
            vm.list = list;
            console.log(list);
        })

        vm.new = function(){

            var obj = {name:'', periods:[], editing:true};
            vm.list.unshift(obj);
        }

        vm.edit = function(activity) {
            if(activity.editing)
                activity.editing = false;
            else {
                activity.editing = true;
                var newHash = activity.$$hashKey;
                if($location.hash() !== newHash)
                    $location.hash(newHash);
                else
                    $anchorScroll();
            }
        }

        vm.toggleRunning = function(activity) {
            if(activity.running)
                activity.running = false;
            else {
                activity.running = true;
                activity.periods.push({start:1});
            }
        }

        vm.getAVImage = function(activity) {
            if(activity.running)
                return "/static/timeperiod/mdi/av/svg/production/ic_pause_48px.svg";
            else
                return "/static/timeperiod/mdi/av/svg/production/ic_play_arrow_48px.svg";
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

    .directive('period', function(){
        return{
            restrict: 'E',
            templateUrl: '/static/timeperiod/partials/period.html',
            controller: 'PeriodCtrl',
            controllerAs: 'period',
            scope: {
                period_href: '=href'
            }
        };
    })

    .controller('PeriodCtrl', ['$scope', '$http','$mdDialog', function($scope, $http, $mdDialog) {
        var period = this;
        period.start = 0;
        period.end = 0;
        period.editing = false;
        period.href = $scope.period_href;

        period.retrieve = function() {
            $http.get(period.href)
            .success(function(data) {
                period.start = data.start;
                period.end = data.end;
            })
            .error(function(data, status, headers, config){
                console.log(status);
            });
        }

        period.retrieve();

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
            var end = new Date(period.end);
            var diff = (end - start) / 1e3;
            return diff;
            
            // return moment.utc(moment(period.end).diff(moment(period.start))).format("mm");
            // return period.end - period.start;
        };

        period.eliminate = function() {
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

            }, function() {

            });
            
        };

    }]);

})();