angular.module('Facete2', ['ui.router', 'ui.bootstrap', 'ui.jassa', 'ngTable', 'ui.jassa.openlayers', 'ngSanitize', /* get rid of these modules rest -> 'luegg.directives', 'ui.jassa.facet-list', 'ui.jassa.jassa-list', 'ui.jassa.breadcrumb' */ 'pascalprecht.translate'], ['$rootScopeProvider', function($rootScopeProvider) {
    $rootScopeProvider.digestTtl(10);
}])

.config(['$locationProvider', function($locationProvider) {
//    $locationProvider
//        .html5Mode(true)
//        .hashPrefix('!');
}])

.config([function() {
    // Setup drop down menu
    jQuery('.dropdown-toggle').dropdown();

    // Fix input element click problem
    jQuery('.dropdown input, .dropdown label').click(function(e) {
      e.stopPropagation();
    });
}])

.config(['$translateProvider', function ($translateProvider) {
  // add translation tables
  $translateProvider.translations('en', translationsEN);
  $translateProvider.translations('de', translationsDE);
  $translateProvider.preferredLanguage('en');
  $translateProvider.fallbackLanguage('en');
}])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");


    //
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
        ;

}]);
