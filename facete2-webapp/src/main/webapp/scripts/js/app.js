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
 * We need to clarify how actions, operations, processes and problems are related to each other.
 *
 * so the entities are:
 * an operation which spawns processes
 * a process which represents some computation; a process ends at some point either in success or failure
 *
 * a problem could also be seen as a request for user input
 * in that case, any process could request user input at some point
 *
 * yet, the difference is, that by default, a failed process results in a problem entry
 * that allows the process's corresponding operation to be restarted.
 *
 *
 *
 * problems -
 *
 * what are the cardinalities?
 * operation : process : problems
 *
 * One model could be like this:
 * An operation represents a computation that can be executed/run/performed.
 * Running an operation yields a process (only one or more?)
 *
 *
 * - A process is represented by an object that comprises
 *   - A process is spawned by running an operation
 *   - a promise (which marks the success or failure of a promise)
 *   - metadata, such as a name, and methods or attributes for retrieving its current state
 *
 * -
 *
 * $operations.add({
 *     getName: function() { },
 *     run: function() { }
 * });
 *
 *
 * operation: "analyze the sparql endpoint"
 *    run(): executes the operation and spawns a process
 *
 *
 * process: send a test query, check for join summary, check property indexes, ...
 *     cancel(): abort the process
 *
 * problems: [test query failed]
 *    retry(): run the operation again
 *
 * $problems: By default, failed processes are added to the problems list
 *
 *
 */
.service('$processes', [ '$problems', '$q', function($problems, $q) {

    var ProcessManager = function() {
        this.processes = new IdList();
    };

    ProcessManager.prototype = {

        add: function(processSpec) {
            //var result = createProcess(this.processes, processSpec);
            var result = this.processes.add(processSpec)

            return result;
        },

        list: function() {
            var result = this.processes.list();
            return result;
        }
    };



    var result = new ProcessManager();

    return result;
}])


/**
 * Technically, actions are factories for processes.
 * This means, as soon as an action is run, a corresponding process is spawned.
 *
 * Removing an action from the action list cancels and removes related processes and thus implicitly cleans up related problems
 *
 * An actionSpec is an object that provides:
 * - .run() method
 * - .getName() // getDescription()
 * - (anything else?)
 *
 *
 */
.service('$actions', ['$q', '$processes', '$problems', function($q, $processes, $problems) {

    /**
     * Creates a process for an action
     *
     */
    var createProcess = function(idList, actionSpec, onSuccess) {

        var removePriorProblem = null;
        var removePriorProcess = null;

        // Remove the entry from the action list as soon as the promise completes
        var onDone = function() {
            removePriorProcess && removePriorProcess();
            removePriorProblem && removePriorProblem();
            onSuccess();
        };

        var promise;

        var fn = function() {

            removePriorProcess = idList.add(actionSpec);

            removePriorProblem && removePriorProblem();
            //removePriorAction && removePriorAction();

            promise = actionSpec.run();

            // Remove the entry from the action list as soon as the promise completes
//            var onDone = function() {
//                removePriorProcess && removePriorProcess();
//                removePriorProblem && removePriorProblem();
//                onSuccess();
//            };

            // On retry, re-execute the action again
            var onProblem = function() {
                onDone();

                removePriorProblem = $problems.add({
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


        return function() {
            promise && promise.cancel();
            onDone();
        };
        /*
        return {
            getName: function() {
                return 'Running ' + actionSpec.getName();
            },
            cancel: function() {
                promise && promise.cancel();
            }
        };*/
    };



   var ActionManager = function() {
       this.actions = new IdList();
   };

   /**
    * By default, an action is removed once its spawned process succeeds.
    * Conversely, as long as the process is running or in failed state, that action
    * remains in the list.
    *
    * Removing an action using the remove function cancels the corresponding process.
    * The rationale is, that if the action is manually removed (i.e. not by a succeeded process),
    * than there is no longer interest in completion of that action.
    *
    *
    */
   ActionManager.prototype = {
       add: function(actionSpec) {
           var removeFn = this.actions.add(actionSpec);

           var removeProcess = createProcess($processes.processes, actionSpec, removeFn);
           return removeProcess;
       }
   };

   return new ActionManager();
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
            //var r = Math.random() < 0.5;
            //console.log('ui.processes.isOpen ' + r, $rootScope.ui.processes.isOpen);
            //console.log('ui.processes.isOpen ' + r);
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

