jassa.sparql.ConceptFactory = Class.create({
    createConcept: function() {
        throw new Error('Not overridden');
    }
});

jassa.sparql.ConceptFactoryConst = Class.create(/* ns.ConceptFactory, */ {
    initialize: function(concept) {
        this.concept = concept;
    },

    setConcept: function(concept) {
        this.concept = concept;
    },

    getConcept: function() {
        return this.concept;
    },

    createConcept: function() {
        return this.concept;
    },

});

jassa.sparql.ConceptFactoryFacetTreeConfig = Class.create(/* ns.ConceptFactory, */ {
    initialize: function(facetTreeConfig, path, excludeSelfConstraints) {
        this.facetTreeConfig = facetTreeConfig;
        this.path = path || new facete.Path();
        this.excludeSelfConstraints = excludeSelfConstraints;
    },

    setPath: function(path) {
        this.path = path;
    },

    getPath: function() {
        return this.path;
    },

    getFacetTreeConfig: function() {
        return this.facetTreeConfig;
    },

    setFacetTreeConfig: function(facetTreeConfig) {
        this.facetTreeConfig = facetTreeConfig;
    },

    isExcludeSelfConstraints: function() {
        return this.excludeSelfConstraints;
    },

    setExcludeSelfConstraints: function(excludeSelfConstraints) {
        this.excludeSelfConstraints = excludeSelfConstraints;
    },

    createConcept: function() {
        var facetConfig = this.facetTreeConfig.getFacetConfig();

        var result = facete.FacetUtils.createConceptResources(facetConfig, this.path, this.excludeSelfConstraints);

//        var facetConceptGenerator = ns.FaceteUtils.createFacetConceptGenerator(facetConfig);
//        var result = facetConceptGenerator.createConceptResources(this.path, this.excludeSelfConstraints);
        return result;
    }
});


/**
 * Item Tagger for paths of whether they are linked as a table column
 *
 */
jassa.facete.ItemTaggerMembership = Class.create(/* ns.ItemTagger, */ {
    initialize: function(collection) {
        this.collection = collection;
    },

    createTags: function(item) {
        var isContained = this.collection.contains(item);

        var result = { isContained: isContained };
        //console.log('table: ' + path, isContained);
        return result;
    }
});


jassa.facete.ElementFactoryConceptFactory = Class.create(/*sparql.ElementFactory,*/ {
    initialize: function(conceptFactory) {
        this.conceptFactory = conceptFactory;
    },

    createElement: function() {
        var concept = this.conceptFactory.createConcept();
        var result = concept ? concept.getElement() : null;

        return result;
    }
});




/**
 * Client wrapper for an API that searches for property paths
 * connecting a source concept to a target concept.
 *
 */
jassa.client = jassa.client || {};

jassa.client.ConceptPathFinderApi = Class.create({
    initialize: function(apiUrl, sparqlServiceIri, defaultGraphIris, joinSummaryServiceIri, joinSummaryGraphIris, ajaxOptions) {
        this.apiUrl = apiUrl;
        this.sparqlServiceIri = sparqlServiceIri;
        this.defaultGraphIris = defaultGraphIris;

        // TODO Path finding options and strategy should go into generic attributes
        //this.nPaths = nPaths;
        //this.maxHops = maxHops;

        this.joinSummaryServiceIri = joinSummaryServiceIri;
        this.joinSummaryGraphIris = joinSummaryGraphIris;

        this.ajaxOptions = ajaxOptions;
    },

    createAjaxConfig: function(sourceConcept, targetConcept) {
        var result = {
            'service-uri': this.sparqlServiceIri,
            'default-graph-uri': this.defaultGraphIris,
            'source-element': sourceConcept.getElement().toString(),
            'source-var':  sourceConcept.getVar().getName(),
            'target-element': targetConcept.getElement().toString(),
            'target-var': targetConcept.getVar().getName(),
            'js-service-uri': this.joinSummaryServiceIri,
            'js-graph-uri': this.joinSummaryGraphIris
            //'n-paths': this.nPaths,
            //'max-hops': this.maxHops
        };

        return result;
    },

    createSparqlService: function(sourceConcept, targetConcept) {
        var data = this.createAjaxConfig(sourceConcept, targetConcept);

        // TODO How can we turn the ajax spec into a (base) URL?
        //var ajaxOptions = { type: 'POST'};
        //ajaxOptions

        var result = new service.SparqlServiceHttp(this.apiUrl, this.defaultGraphIris, this.ajaxOptions, data);
        return result;
    },

    findPaths: function(sourceConcept, targetConcept) {
        var data = this.createAjaxConfig(sourceConcept, targetConcept);

        var ajaxSpec = {
            url: this.apiUrl,
            dataType: 'json',
            crossDomain: true,
            traditional: true, // Serializes JSON arrays by repeating the query string paramater
            data: data
        };

        //console.log('[DEBUG] Path finding ajax spec', ajaxSpec);

        var result = $.ajax(ajaxSpec).pipe(function(pathStrs) {
            var result = [];

            for(var i = 0; i < pathStrs.length; ++i) {
                var pathStr = pathStrs[i];

                //console.log("pathStr is", pathStr);

                var path = facete.Path.parse(pathStr);
                result.push(path);
            }

            return result;
        });

        return result;
    },

    findPathsOldApi: function(sourceConcept, targetConcept) {

        var querySpec = {
                service: {
                    serviceIri: this.sparqlServiceIri,
                    defaultGraphIris: this.defaultGraphIris
                },
                sourceConcept: {
                    elementStr: sourceConcept.getElement().toString(),
                    varName: sourceConcept.getVar().value
                },
                targetConcept: {
                    elementStr: targetConcept.getElement().toString(),
                    varName: targetConcept.getVar().value
                }
        };

        var ajaxSpec = {
            url: this.apiUrl,
            dataType: 'json',
            data: {
                query: JSON.stringify(querySpec)
            }
        };

        //console.log('[DEBUG] Path finding ajax spec', ajaxSpec);

        var result = $.ajax(ajaxSpec).pipe(function(pathStrs) {
            var result = [];

            for(var i = 0; i < pathStrs.length; ++i) {
                var pathStr = pathStrs[i];

                //console.log("pathStr is", pathStr);

                var path = facete.Path.parse(pathStr);
                result.push(path);
            }

            return result;
        });

        return result;
    }
});




var ns = ns || {};



ns.ExprModFactoryAggCount = Class.create({
    createExpr: function(baseExpr) {
        var result = new sparql.E_Count(baseExpr);

        return result;
    }
 });

 ns.ExprModFactoryAggMin = Class.create({
     createExpr: function(baseExpr) {
         var result = new sparql.E_Min(baseExpr);

         return result;
     }
 });

 ns.ExprModFactoryAggMax = Class.create({
     createExpr: function(baseExpr) {
         var result = new sparql.E_Min(baseExpr);

         return result;
     }
 });

ns.ExprModRegistry = {
    'count': new ns.ExprModFactoryAggCount,
    'min': new ns.ExprModFactoryAggMin,
    'max': new ns.ExprModFactoryAggMax
};

jassa.facete.QueryFactoryTableMod = Class.create(/*ns.QueryFactory,*/ {
    initialize: function(elementFactory, tableMod) {
        this.elementFactory = elementFactory;
        this.tableMod = tableMod;
    },

    createQuery: function() {
        var tableMod = this.tableMod;
        var element = this.elementFactory.createElement();

        if(!element) {
            return null;
        }


        var isDistinct = tableMod.isDistinct();


        var result = new sparql.Query();
        //result.getElements().push(element);
        result.setQueryPattern(element);

        var columns = tableMod.getColumns();


        // Map from column id to SPARQL expression representing this column
        var idToColExpr = {};

        var aggColumnIds = [];
        var nonAggColumnIds = [];

        _(columns).each(function(c) {
            var columnId = c.getId();
            var v = rdf.NodeFactory.createVar(columnId);
            var ev = new sparql.ExprVar(v);


            var agg = c.getAggregator();
            if(agg) {
                aggColumnIds.push(columnId);

                var aggName = agg.getName();

                var aggExprFactory = ns.ExprModRegistry[aggName];
                if(!aggExprFactory) {
                    throw 'No aggExprFactory for ' + aggName;
                }

                var aggExpr = aggExprFactory.createExpr(ev);

                ev = aggExpr;

                result.getProject().add(v, ev);

            } else {
                nonAggColumnIds.push(columnId);
                result.getProject().add(v);
            }


            idToColExpr[columnId] = ev;
        });

        if(aggColumnIds.length > 0) {
            _(nonAggColumnIds).each(function(nonAggColumnId) {
                var expr = idToColExpr[nonAggColumnId];
                result.getGroupBy().push(expr);
            });

            // Aggregation implies distinct
            isDistinct = false;
        }


        // Apply limit / offset
        result.setLimit(tableMod.getLimit());
        result.setOffset(tableMod.getOffset());

        // Apply sort conditions
        var sortConditions = tableMod.getSortConditions();


        _(sortConditions).each(function(sortCondition) {
            var columnId = sortCondition.getColumnId();

            var colExpr = idToColExpr[columnId];

            if(!colExpr) {
                console.log('[ERROR] Should not happen');
                throw 'Should not happen';
            }

            // Ordering of null values
            //var sortCondition = cs.getSortCondition();
            var sortDir = sortCondition.getSortDir();
            var sortType = sortCondition.getSortType();

            var sortCond = null;

            switch(sortType) {
            case 'null':
                // Null ordering only works with non-aggregate columns
                if(_(aggColumnIds).indexOf(columnId) < 0) {

                    if(sortDir > 0) {
                        sortCond = new sparql.SortCondition(new sparql.E_LogicalNot(new sparql.E_Bound(colExpr)), 1);
                    } else if(sortDir < 0) {
                        sortCond = new sparql.SortCondition(new sparql.E_Bound(colExpr), 1);
                    }

                }

                break;

            case 'data':
                sortCond = !sortDir ? null : new sparql.SortCondition(colExpr, sortDir);

                break;

            default:
                console.log('Should not happen');
                throw 'Should not happen';
            }

            if(sortCond) {
                result.getOrderBy().push(sortCond);
            }


        });

        result.setDistinct(isDistinct);

        return result;
    }
});


var IdList = function() {
    this.nextId = 0;
    this.items = [];

    this.resultList = [];
};

IdList.prototype = {

    add: function(data) {
        var id = ++this.nextId;
        var item = {
            id: id,
            data: data
        };
        this.items.push(item);
        this.resultList.push(data);

        var self = this;

        // TODO The result could be an object with methods:
        // remove() and addRemoveListener()
        var result = function() {
            // Remove item by id;
            jassa.util.ArrayUtils.filter(self.items, function(item) {
                var retain = item.id != id;
                return retain;
            });

            self.updateResultList();
        };

        return result;
    },

    updateResultList: function() {
        // TODO: Better always return the same reference
        var replacement = this.items.map(function(item) {
            return item.data;
        });

        jassa.util.ArrayUtils.replace(this.resultList, replacement);
    },

    list: function() {
        return this.resultList;
    }
};
