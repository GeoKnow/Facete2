angular.module('Facete2', ['ui.router', 'ui.bootstrap', 'ui.jassa', 'ngGrid', 'ngTable', 'ui.jassa.openlayers', 'ngSanitize'], function($rootScopeProvider) {
    $rootScopeProvider.digestTtl(10);
})

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
