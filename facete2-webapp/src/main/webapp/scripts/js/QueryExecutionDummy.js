jassa.service.QueryExecutionDummy = Class.create(jassa.service.QueryExecution, {
//    createPromise: function(val) {
//        var deferred = jQuery.Deferred();
//        deferred.resolve(val);
//        return deferred.promise();
//    },

    execAsk: function() {
        var result = this.createPromise(false);
        return result;
    },

    execSelect: function() {
        // TODO If the query uses aggregations, such as count(*) there will be a result row

        var rs = new jassa.service.ResultSetArrayIteratorBinding(new jassa.util.IteratorArray([]));
        //var result = this.createPromise(rs);
        var result = Promise.resolve(rs);
        return result;
    },

    setTimeout: function(timeoutInMillis) {

    }
});
