jassa.sparql.ElementFactoryTransform = Class.create(jassa.sparql.ElementFactory, {
    initialize: function(baseElementFactory, fn) {
        this.baseElementFactory = baseElementFactory;
        this.fn = fn;
    },

    createElement: function() {
        var element = this.baseElementFactory.createElement();
        var result = this.fn(element);
        return result;
    }
});

