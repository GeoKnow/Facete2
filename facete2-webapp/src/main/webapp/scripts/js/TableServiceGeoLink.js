
jassa.service.TableServiceGeoLink = Class.create(service.TableServiceDelegateBase, {
    initialize: function($super, delegate, lookupServicePaths, pathColId, labelColId) {
        $super(delegate);
        this.lookupServicePaths = lookupServicePaths;
        this.pathColId = pathColId;
        this.labelColId = labelColId;
    },

    fetchSchema: function() {
        var self = this;

        var result = this.delegate.fetchSchema().then(function(schema) {
            console.log('SCHEMA', schema);

            // Hide the label column in the schema
            schema.colDefs = _(schema.colDefs).chain()
               .filter(function(colDef) {
                   return colDef.field != self.labelColId;
               })
               .compact()
               .value();

            return schema;
        });

        return result;
    },

    fetchData: function(limit, offset) {
        //var deferred = jQuery.Deferred();

        var self = this;
        var result = this.delegate.fetchData(limit, offset).then(function(rows) {

            // Collect all paths
            var paths = _(rows).map(function(row) {
                var col = row[self.pathColId];

                var labelField = row[self.labelColId];

                var node = labelField.node;
                if(node == null) {
                    console.log('should not happen');
                }
                var pathStr = node.getLiteralValue();
                var r = facete.Path.parse(pathStr);

                // Add the path object to the row
                row[self.pathColId].path = r;

                return r;
            });

            var p = self.lookupServicePaths.lookup(paths).then(function(map) {
                _(rows).map(function(row) {
                    var path = row[self.pathColId].path;
                    var doc = map.get(path);
                    if(doc) {
                        row[self.pathColId].displayLabel = doc;// displayLabel;
                    }
                });

                return rows;
            });

            return p;
        });

        return result;
    }
});
