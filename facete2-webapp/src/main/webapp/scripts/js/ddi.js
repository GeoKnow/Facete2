/**
 * Dependency: {
 *     model: 'string',
 *     optional: 'boolean'
 * }
 *
 * Provider: {
 *     fn: 'function',
 *     deps: 'Dependency[]'
 * }
 *
 *
 * angular.controller('myCtrl', [ '$scope', '$ddi', function($scope, $ddi) {
 *     var ddi = new $ddi($scope);
 * }]);
 */
angular.module('ddi', [])

.service('$ddi', [ '$parse', function($parse) {

    // We partially bind a DynamicDi instance to the $parse service,
    var result = function(scope) {
        var r = new DynamicDi(scope, $parse);
        return r;
    };

    return result;
}]);

/*
angular.Scope.prototype.$ddi = function() {
    if(!this.$ddiObj) {

    }
};
*/

var DynamicDi = function(scope, $parse) {
    this.scope = scope || {};
    this.$parse = $parse;
    this.attrToProviderCtrl = {};
};

DynamicDi.prototype = {
    register: function(attr, providerSpec) {
        var provider = DiUtils.processProviderSpec(this.$parse, providerSpec);

        var providerCtrl = this.installProvider(attr, provider);

        this.attrToProviderCtrl = providerCtrl;
//        var oldProviderCtrl = this.attrToProviderCtrl[attr];
//
//        if(oldProviderCtrl) {
//
//        }
//
//        if(newProvider !== oldProvider) {
//            this.dirtyDependencies[name] = true;
//        }
    },

    installProvider: function(attr, provider) {
        var self = this;
        var deps = provider.deps;

        var doChangeAction = function() {

            // Resolve dependencies to arguments
            var args = deps.map(function(dep) {
                var r = dep.model(self.scope);
                return r;
            });

            // Validate the dependencies (currently limited to null checking)
            // If this step fails, we do not invoke the provider and set the attr to null
            var valid = true;
            for(var i = 0; i < args.length; ++i) {
                var arg = args[i];
                var dep = provider.deps[i];

                if(!dep.optional && !arg) {
                    valid = false;
                    break;
                }
            }

            var val = valid ? provider.fn.apply(self.scope, args) : null;
            self.scope[attr] = val;
        };

        // Make the provider take immediate effect
        doChangeAction();

        // Register all the watchers
        var unwatchFns = deps.map(function(dep) {
            var r = self.watch(self.scope, dep.model, function() {
                doChangeAction();
            }, dep.cmpMode);
            return r;
        });

        var result = unwatchFns;
        return result;
    },

    /**
     *
     * @param scope
     * @param expr
     * @param listener
     * @param mode
     * @returns The unregister function of the watch
     */
    watch: function(scope, expr, listener, mode) {
        var result;

        switch(mode) {
        case '':
            result = scope.$watch(expr, listener);
            break;
        case '=':
            result = scope.$watch(expr, listener, true);
            break;
        case '@':
            result = scope.$watchCollection(expr, listener);
            break;
        default:
            throw new Error('Unsupported watch mode: [' + mode + ']');
        }

        return result;
    }
};


var DiUtils = {
    processProviderSpec: function($parse, spec) {
        var result;

        if(spec.$inject) {
            throw new Error('Not supported yet');
        }
        else if(Array.isArray(spec)) {
            result = DiUtils.processProviderSpecArray($parse, spec);
        }
        else if(spec instanceof Function) {
            // Treat the provider as an identity function that dependends on the given function
            var rephrased = [spec, angular.identity];
            result = DiUtils.processProviderSpecArray($parse, rephrased);
        } else {
            throw new Error('Unknow spec');
        }

        return result;
    },

    processProviderSpecArray: function($parse, spec) {
        var l = spec.length;

        var depSpecs = spec.slice(0, l - 1);
        var fn = spec[l - 1];

        var deps = depSpecs.map(function(depSpec) {
            var r = DiUtils.parseDepSpec($parse, depSpec);
            return r;
        });

        var result = {
            fn: fn,
            deps: deps
        };

        return result;
    },


    /**
     * =depName - deep equality - $watch( ..., true)
     * \@depName - array equality
     * depName - default equality - a == b
     *
     * TODO ?depName - strict equality - a === b
     *
     *
     */
    parseDepSpec: function($parse, depSpec) {
        var result;

        if(_.isString(depSpec)) {
            var pattern = /(\?)?(=|@)?(.+)/
            var groups = pattern.exec(depSpec);

            result = {
                model: $parse(groups[3]),
                optional: groups[1] === '?',
                cmpMode: groups[2] || ''
            };

        } else if(angular.isFunction(depSpec)) {
            // If the argument is a function, it will always be evaluated and
            // the respective value will be passed as an argument to the provider
            result = {
                model: depSpec,
                optional: true,
                cmpMode: ''
            };
        } else {
            throw new Error('Non-string arguments not yet supported');
        }

        return result;
    }
};


