

    var applyRootScope = function(scope) {
        var rootScope = scope.$root;

        if(!rootScope.$$phase) {
            rootScope.$apply()
        }
    };
