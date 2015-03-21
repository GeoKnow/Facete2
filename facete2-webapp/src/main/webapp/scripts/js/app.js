angular.module('Facete2', ['ui.router', 'ui.bootstrap', 'ui.jassa', 'ngTable', 'ui.jassa.openlayers', 'ngSanitize', 'pascalprecht.translate'/* get rid of these modules rest -> 'luegg.directives', 'ui.jassa.facet-list', 'ui.jassa.jassa-list', 'ui.jassa.breadcrumb' */], ['$rootScopeProvider', function($rootScopeProvider) {
    $rootScopeProvider.digestTtl(10);
}])

.config(['$locationProvider', '$translateProvider', function($locationProvider, $translateProvider) {
	//$locationProvider
	//    .html5Mode(true)
	//    .hashPrefix('!');
	
	// add translation tables
  	$translateProvider.translations('en', translationsEN);
  	$translateProvider.translations('de', translationsDE);
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
