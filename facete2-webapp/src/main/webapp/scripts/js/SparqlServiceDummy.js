/**
 * A sparql service representing an empty store
 */
jassa.service.SparqlServiceDummy = Class.create(jassa.service.SparqlService, {

    createQueryExecution: function(query) {
        return new jassa.service.QueryExecutionDummy();
    },

    getStateId: function() {
        return 'dummyId';
    },

    getStateHash: function() {
        return 'dummyHash';
    },

    hashCode: function() {
        return 'dummy-sparql-service';
    }

});
