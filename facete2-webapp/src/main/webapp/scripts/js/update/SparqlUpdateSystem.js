
var DatasetSpec = Class.create({
    initialize: function(accessUrl, defaultGraphs, namedGraphs) {
        this.accessUrl = accessUrl;
        this.defaultGraphs = defaultGraphIris || [];
        this.namedGraphs = namedGraphs || [];
    },

    getAccessUrl: function() {
        return this.accessUrl;
    },

    getDefaultGraphs: function() {
        return this.defaultGraphs;
    },

    getNamedGraphs: function () {
        return this.namedGraphs;
    },

    equals: function(that) {

    },

    hashCode: function() {
        if(!this.hash) {

        }
    }
});


var RegistrationCollection = Class.create({
    initialize: function() {
        this.idToItem = {};
        this.nextItemId = 0;
    },

    add: function(item) {
        var itemId = 'item_' + this.nextItemId++;

        this.idToItem[itemId] = item;

        var self = this;
        var result = function remove() {
            delete self.idToItem[itemId];
        };

        return result;
    },

    equals: function(that) {
        var result = this == that;
        return result;
    }
    // todo hashcode / equals
});


var SparqlSystem = Class.create({
    initialize: function() {

        this.listeners = new RegistrationCollection();

        this.defaultServiceSupplier = function(accessUrl, graphIris) {
            var r = jassa.service.SparqlServiceBuilder.http(accessUrl, graphIris);
            return r;
        }
    }

    aquireQueryService: function() {

    },

    createUpdateService: function(updateRequest) {
        var rawUpdateExecution = this.createUpdateExecution(updateRequest);

        var self = this;
        var updateExecution = new UpdateExecutionEventSource(rawUpdateExecution, [{
            onAfterUpdate: function() {
                self.
            }
        }]);

    },

    /**
     * Register a listener on a given dataset.
     *
     * Argument is an object; currently it includes serviceUrl and affected graph names
     * TODO Specify more clearly
     *
     * @returns a function that when called removes the listener again
     */
    registerChangeListener: function(callbackFn) {
        var result = this.listeners.add(callbackFn);
        return result;
    }
};


/**
 * A simple ioc container which can be used to call functions that declare dependencies
 * TODO Service references are mandatory by default; append '?' to make them optional
 *
 * var fn = ['service1', 'service2', function(service1, service2) { ... }]
 * var returnValue = ioc.invoke(fn);
 *
 */
var IocContainer = Class.create({
    initialize: function() {
        this.context = context || {};
        this.parent = parent;

        // Make the container make itself known in the context
        this.context.$ioc = this;
    },

    invoke: function(arrFn) {
        var result = IocContainer.invoke(arrFn, this.context);
        return result;
    }
});

/**
 * Argument is expected to be an array with service references, and the last argument the actual function to be invoked
 */
IocContainer.invoke = function(arrFn, context) {
    var args = [];

    var l = arrFn.length;
    for(var i = 0; i < l - 1; ++i) {
        var refName = arrFn[i];
        var ref = this.resolveRefName(refName);
        args.push(ref);
    }

    var fn = arrFn[l - 1];
    fn.prototype.apply(this, args);
};




QueryExecutionFactory = bound to some service, but not to a query
sparqlService = createQueryExecution(someQuery);



var SparqlSystemCache = Class.create({
    initialize: function() {
        this.delegate = delegate;
        this.stateToCache =
    }
});
