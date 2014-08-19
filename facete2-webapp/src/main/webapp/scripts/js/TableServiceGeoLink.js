
jassa.service.TableServiceGeoLink = Class.create(service.TableServiceDelegateBase, {
    initialize: function($super, delegate, lookupServicePaths, pathColId, labelColId) {
        $super(delegate);
        this.lookupServicePaths = lookupServicePaths;
        this.pathColId = pathColId;
        this.labelColId = labelColId;
    },

    fetchSchema: function() {
        var self = this;

        var result = this.delegate.fetchSchema().pipe(function(schema) {
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
        var deferred = jQuery.Deferred();

        var tmp = this.delegate.fetchData(limit, offset);

        var self = this;
        tmp.done(function(rows) {

            // Collect all paths
            var paths = _(rows).map(function(row) {
                var col = row[self.pathColId];

                var labelField = row[self.labelColId];
                var pathStr = labelField.node.getLiteralValue();
                var r = facete.Path.parse(pathStr);

                // Add the path object to the row
                row[self.pathColId].path = r;

                return r;
            });

            var p = self.lookupServicePaths.lookup(paths).done(function(map) {
                _(rows).map(function(row) {
                    var path = row[self.pathColId].path;
                    var doc = map.get(path);
                    if(doc) {
                        row[self.pathColId].displayLabel = doc;// displayLabel;
                    }
                });

                deferred.resolve(rows);
            }).fail(function() {
                deferred.fail();
            });


        }).fail(function() {
            deferred.fail();
        });

        return deferred.promise();
    }
});
