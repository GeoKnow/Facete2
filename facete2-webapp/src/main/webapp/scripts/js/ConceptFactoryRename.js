jassa.sparql.ConceptFactoryRename = Class.create(jassa.sparql.ConceptFactory, {
    initialize: function(baseConceptFactory, varMap) {
        this.baseConceptFactory = baseConceptFactory;
        this.varMap = varMap;
    },

    createConcept: function() {
        var baseConcept = this.baseConceptFactory.createConcept();
        var v = baseConcept.getVar();
        var e = baseConcept.getElement();

        var ne = jassa.sparql.ElementUtils.createRenamedElement(e, this.varMap);

        var nv = this.varMap.get(v);
        if(!nv) {
            nv = v;
        }

        var result = new sparql.Concept(ne, nv);
        return result;
    }
});
