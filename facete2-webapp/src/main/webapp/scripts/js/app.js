angular.module('Facete2', [
        'ngSanitize',
        'ngAnimate',
        'ui.router',
        'ui.bootstrap',
        'ui.jassa',
        'ui.jassa.edit',
        'ui.jassa.edit.tpls',
        'ui.codemirror',
        'ui.jassa.openlayers',
        'ui.jassa.rex',
        'dddi',
        'pascalprecht.translate',
        'base64'
   ], [ '$rootScopeProvider', function($rootScopeProvider) {
     $rootScopeProvider.digestTtl(10);
}])

.config(['$locationProvider', function($locationProvider) {
    //$locationProvider
    //    .html5Mode(true)
    //    .hashPrefix('!');
}])

.config(['$translateProvider', function($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: 'data/ui/i18n/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('en');
    $translateProvider.fallbackLanguage('en');
}])

//.config([function() {
//    // Setup drop down menu
//    jQuery('.dropdown-toggle').dropdown();
//
//    // Fix input element click problem
//    jQuery('.dropdown input, .dropdown label').click(function(e) {
//      e.stopPropagation();
//    });
//}])

.service('$problems', [ '$q', function($q) {

    var ProblemManager = function() {
        this.problems = new IdList();
    };

    ProblemManager.prototype = {
        add: function(problemSpec) {
            var removeFn = this.problems.add({
                data: problemSpec,
                getName: function() {
                    var r = problemSpec.getName();
                    return r;
                },
                isRetryable: function() {
                    return angular.isFunction(problemSpec.retry);
                },
                retry: function() {
                    // remove the problem
                    removeFn();

                    if(this.isRetryable()) {
                        problemSpec.retry();
                    }
                },
                remove: function() {
                    removeFn();
                }
            });

            return removeFn;
        },

        list: function() {
            var result = this.problems.list();
            return result;
        }
    };



    var result = new ProblemManager();

    return result;


    return result;
}])


/**
 * An action spawns a process, and if the process fails, a problem is created which allows restarting the process
 *
 * $problems: By default, failed processes are added to the problems list
 *
 *
 */
.service('$processes', [ '$problems', '$q', function($problems, $q) {


/*
We probably need to extend the pending/problem concept with a third entity, such as the action,
to which problems and pending (what?) are linked.

Execution of an action spawns a process


 */

//    actionSpec = {
//        info
//        promiseFn
//    };

    var createAction = function(idList, actionSpec) {
        var removePriorProblem = null;

        var fn = function() {

            var removePriorAction = idList.add(actionSpec);

            removePriorProblem && removePriorProblem();
            //removePriorAction && removePriorAction();

            var promise = actionSpec.run();

            // Remove the entry from the action list as soon as the promise completes
            var onDone = function() {
                removePriorAction && removePriorAction();
            };

            // On retry, re-execute the action again
            var onProblem = function() {
                onDone();

                var removePriorProblem = $problems.add({
                    getName: function() {
                        var r = 'Failed at: ' + actionSpec.getName();
                        return r;
                    },
                    retry: function() {
                        fn();
                    }
                });

            };

            $q.when(promise).then(onDone, onProblem);
        };

        fn();
        return null;
    };



    var ActionManager = function() {
        this.actions = new IdList();
    };

    ActionManager.prototype = {

        add: function(actionSpec) {
            var result = createAction(this.actions, actionSpec);
            return result;
        },

        list: function() {
            var result = this.actions.list();
            return result;
        }
    };



    var result = new ActionManager();

    return result;
}])


.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");

    // Now set up the states
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'partials/home.html',
           // controller: 'SearchCtrl'
        })
        .state('config', {
            url: "/config",
            templateUrl: "partials/config.html",
        })
        .state('edit', {
            url: "/edit",
            templateUrl: "partials/simple-editor.html",
        })
        .state('tools', {
            url: "/tools",
            templateUrl: "partials/tools.html",
        })
        ;
}])

.run(['$rootScope', function($rootScope) {
    /* Application UI state */
    $rootScope.ui = AppConfig.ui;
}])

.run(['$rootScope', '$processes', '$problems', function($rootScope, $processes, $problems) {
    $rootScope.$processes = $processes;
    $rootScope.$problems = $problems;
}])

.run(['$rootScope', '$dddi', '$timeout', function($rootScope, $dddi, $timeout) {

//    $rootScope.$watch('$processes.list().length', function(totalLength) {
//        $rootScope.ui.pending.isOpen = totalLength > 0;
//    });

    $dddi($rootScope).register('ui.processes.isOpen', ['$processes.list().length',
        function(totalLength) {
            var r = totalLength > 0;
            return r;
        }]);

    $dddi($rootScope).register('ui.problems.isOpen', ['$problems.list().length',
        function(totalLength) {
            var r = totalLength > 0;
            return r;
        }]);

}])

.run(['$rootScope', '$translate', function($rootScope, $translate) {
    var global = $rootScope.global = $rootScope.global || {};
    var ui = global.ui = global.ui || {};

    ui.availableLangs = ['en', 'de'];
    ui.lang = 'en';

    $rootScope.$watch('global.ui.lang', function(lang) {
        $translate.use(lang);
    });

}])


;

