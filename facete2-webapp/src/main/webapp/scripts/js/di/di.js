// Consideration: The angular Scope object (e.g. created $scope.$new()) provides the watcher mechanism


var Injector = Class.create({
    initialize: function(context, dependencies) {
        this.context = context || {};
        this.providers = providers;

        this.dirtyDependencies = {};
    },

    register: function(name, providerDef) {
        // Unless this is a re-registration of the same provider, mark the dependency as dirty

        var oldProvider = this.providers[name]
        if(newProvider !== oldProvider) {
            this.dirtyDependencies[name] = true;
        }
    },

    buildDependencyGraph: function() {
        for(var provider : this.providers) {

        }
    },

    // Return an order in which to resolve dependencies
    createResolutionOrder: function() {

    },

    /**
     *
     *
     * Note: You can wire up this DI system with angular using $watch:
     *
     * $scope.$watch(function() {
     *     injector.apply();
     * });
     *
     */
    apply: function() {
        // Process all dirty providers
        var dirtyProviders = Object.keys(this.dirty);
        for(var providerName in dirtyProviders) {
            var provider = this.nameToProvider[providerName];

            var self = this;
            // Resolve all dependencies against the context
            var args = provider.deps.map(function(depName) {
                var r = self.context[depName];
                return r;
            });

            // Compare the old and the new value
            var o = this.context[providerName];
            var n = provider.fn.apply({}, args);

            var isEqual = provider.cmp(o, n);

            // If the new value equals the old one, there is nothing to do and the old one is retained
            // Otherwise, we replace the old value and mark the provider as dirty
            if(!isEqual) {
                this.dirty[providerName] = true;
                this.context[providerName] = n;
            }

            this.context[providerName] = val;
        }

    }

});



Injector.refEquals = function(a, b) {
    return a === b;
};

Injector.stateEquals = function(a, b) {
    var result = _.isEqual(a, b);
    return result;
}

Injector.collectionEquals = function(a, b) {
    var result = a === b || (a.length === b.length && _.forAll(_.zip(a, b), function(items) { return item[0] === item[1]})
    return result;
}


Injector.parseProvider = function(def) {
    if(def.$inject) {

    }
    else if(Array.isArray(def)) {

    }
    else if(def instanceof Function) {

    }


};

