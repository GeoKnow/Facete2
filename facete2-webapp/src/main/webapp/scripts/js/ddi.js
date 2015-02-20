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
    register: function(targetExprStr, providerSpec) {
        var target = this.$parse(targetExprStr);
        if(!target.assign) {
            throw new Error('Target is not writeable: ', targetExprStr, providerSpec);
        }

        var provider = DiUtils.processProviderSpec(this.$parse, providerSpec);

        var providerCtrl = this.installProvider(target, provider);

        return providerCtrl;
        //this.attrToProviderCtrl[target] = providerCtrl;
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

    installProvider: function(target, provider) {
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
            //self.scope[attr] = val;
            target.assign(self.scope, val);
        };

        // Make the provider take immediate effect
        doChangeAction();

        // Group the watches:
        // none: All reference watches go into an array that will be watched with $watchCollection
        // @:
        // =: All deep watches will go into a function returning a (static) array of all items to be deep watched

        var cmpModeToDeps = {};

        deps.forEach(function(dep) {
            var group = cmpModeToDeps[dep.cmpMode] = cmpModeToDeps[dep.cmpMode] || [];
            group.push(dep);
        });


        // Function that returns a watchExpression function.
        // The latter which will on every call return the same array instance,
        // however with updated items
        var createArrFn = function(deps) {
            var arr = [];

            // Init the array
            for(var i = 0; i < deps.length; ++i) {
                var val = deps[i].model;
                arr.push(val);
            }

            var result = function() {
                for(var i = 0; i < deps.length; ++i) {
                    var model = deps[i].model;
                    arr[i] = model(self.scope);
                }
                return arr;
            };

            return result;
        };

        var cmpModes = Object.keys(cmpModeToDeps);


        var result = [];
        cmpModes.forEach(function(cmpMode) {
            var group = cmpModeToDeps[cmpMode];

            switch(cmpMode) {
            case '': {
                var unwatcher;
                if(group.length === 1) {
                    unwatcher = self.scope.$watch(group[0], doChangeAction);
                } else {
                    var fn = createArrFn(group);
                    unwatcher = self.scope.$watchCollection(fn, doChangeAction);
                }

                result.push(unwatcher);
                break;
            }

            case '=': {
                var unwatcher;
                if(group.length === 1) {
                    unwatcher = self.scope.$watch(group[0], doChangeAction, true);
                } else {
                    var fn = createArrFn(group);
                    unwatcher = self.scope.$watch(fn, doChangeAction, true);
                }

                result.push(unwatcher);
                break;
            }

            case '@': {
                var unwatchers = group.map(function(dep) {
                    var r = scope.$watchCollection(dep.model, doChangeAction);
                    return r;
                });

                result.push.apply(result, unwatchers);
                break;
            }
            default:
                throw new Error('Unsupported watch mode: [' + mode + ']');
            }


        });

        return result;

/*
        // Register all the watchers
        var unwatchFns = deps.map(function(dep) {
            var r = self.watch(self.scope, dep.model, function() {
                doChangeAction();
            }, dep.cmpMode);
            return r;
        });

        var result = unwatchFns;
        return result;
        */
    },

    /**
     * Not used anymore, as superseded by the grouping approach
     *
     * @param scope
     * @param expr
     * @param listener
     * @param mode
     * @returns The unregister function of the watch
     */
//    watch: function(scope, expr, listener, mode) {
//        var result;
//
//        switch(mode) {
//        case '':
//            result = scope.$watch(expr, listener);
//            break;
//        case '=':
//            result = scope.$watch(expr, listener, true);
//            break;
//        case '@':
//            result = scope.$watchCollection(expr, listener);
//            break;
//        default:
//            throw new Error('Unsupported watch mode: [' + mode + ']');
//        }
//
//        return result;
//    }
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


