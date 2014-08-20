var ConceptFactoryTableConfigFacet = Class.create(jassa.facete.ConceptFactory, {
    initialize: function(tableConfigFacet) {
        this.tableConfigFacet = tableConfigFacet;
    },

    createConcept: function() {
        var result = this.tableConfigFacet.createDataConcept();
        return result;
    }
});
