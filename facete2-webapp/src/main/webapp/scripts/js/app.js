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

.config([function() {
    // Setup drop down menu
    jQuery('.dropdown-toggle').dropdown();

    // Fix input element click problem
    jQuery('.dropdown input, .dropdown label').click(function(e) {
      e.stopPropagation();
    });
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

