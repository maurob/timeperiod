(function() {
    'use strict';
    
    angular.module('timeperiod', ['ngResource', 'ngMaterial'])

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

    .controller('ActivitiesCtrl', ['Activity', function(Activity) {
        var vm = this;
        vm.list = [];

        Activity.query(function(list){
            vm.list = list;
        })

        vm.new = function(){
            vm.list.push({name:'', periods:[]})
        }

        vm.edit = function(activity) {
            if(activity.editing)
                activity.editing = false;
            else
                activity.editing = true;
        }

        vm.toggleRunning = function(activity) {
            if(activity.running)
                activity.running = false;
            else
                activity.running = true;
        }

        vm.getAVImage = function(activity) {
            if(activity.running)
                return "/static/timeperiod/mdi/av/svg/production/ic_pause_48px.svg";
            else
                return "/static/timeperiod/mdi/av/svg/production/ic_play_arrow_48px.svg";
        }

    }])

    .controller('PeriodCtrl', function() {

    });

})();