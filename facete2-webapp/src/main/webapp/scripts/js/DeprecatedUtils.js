    /**
     * Index the map of a spring batch object
     * this is for spring batch ~2.2
     */
    var indexBatchMapOld = function(map) {
        var result;
        var entry = map ? map.entry : null;

        if(!entry) {
            result = {};
        }
        else if(_(entry).isArray()) {
            result = _(entry).indexBy('string');
        }
        else {
            result = {};
            var key = entry['string'];
            result[key] = entry;
        }

        return result;
    };

    var applyRootScope = function(scope) {
        var rootScope = scope.$root;

        if(!rootScope.$$phase) {
            rootScope.$apply()
        }
    };
