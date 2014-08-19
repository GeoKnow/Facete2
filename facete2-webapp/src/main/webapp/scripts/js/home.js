

    var jassa = jassa || Jassa;

    var rdf = jassa.rdf;
    var vocab = jassa.vocab;
    var sparql = jassa.sparql;
    var service = jassa.service;
    var sponate = jassa.sponate;
    var facete = jassa.facete;
    var geo = jassa.geo;
    var util = jassa.util;

    var client = Jassa.client;


    var ns = service;



    service.TableServiceGeoLink = Class.create(service.TableServiceDelegateBase, {
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

    var ConceptFactoryTableConfigFacet = Class.create(facete.ConceptFactory, {
        initialize: function(tableConfigFacet) {
            this.tableConfigFacet = tableConfigFacet;
        },

        createConcept: function() {
            var result = this.tableConfigFacet.createDataConcept();
            return result;
        }
    });




//    var myModule = angular.module('Facete2', ['ui.bootstrap', 'ui.jassa', 'ngGrid', 'ngTable', 'ui.jassa.openlayers', 'ngSanitize'], function($rootScopeProvider) {
//        $rootScopeProvider.digestTtl(10);
//    });


    var myModule = angular.module('Facete2');





//  var snowball = new Snowball('english');
//  snowball.setCurrent('airports');
//  snowball.stem();
//  alert(snowball.getCurrent());

//  // Create a bif:contains qurey
//  var conceptFactory



myModule.controller('SparqlTableCtrl', ['$scope', '$rootScope', '$q', function($scope, $rootScope, $q) {


    var rdf = jassa.rdf;
    var sparql = jassa.sparql;
    var service = jassa.service;
    var util = jassa.util;
    var facete = jassa.facete;
    var sponate = jassa.sponate;


    // TODO Watch the tableMod object
    $scope.$watchCollection('tableMod.getSortConditions()', function() {
        var tableMod = $scope.tableMod;
        if(tableMod != null) {
            syncFromTableMod($scope.tableMod, $scope.gridOptions.sortInfo);
        }
    });

    var syncFromTableMod = function(tableMod, sortInfo) {
        var scs = tableMod.getSortConditions();

        var newFields = [];
        var newDirs = [];
        _(scs).each(function(sc) {
            newFields.push(sc.getColumnId());

            var d = sc.getSortDir();
            var dirName = d > 0 ? 'asc' : (d < 0 ? 'desc' : '');

            newDirs.push(dirName);
        });

        util.ArrayUtils.replace(sortInfo.fields, newFields);
        util.ArrayUtils.replace(sortInfo.directions, newDirs);
    };


    var syncTableMod = function(sortInfo, tableMod) {

        var newSortConditions = [];
        for(var i = 0; i < sortInfo.fields.length; ++i) {
            var columnId = sortInfo.fields[i];
            var dir = sortInfo.directions[i];

            var d = dir === 'asc' ? 1 : (dir === 'desc' ? -1 : 0);

            if(d !== 0) {
                var sortCondition = new facete.SortCondition(columnId, d);
                newSortConditions.push(sortCondition);
            }
        }

        var oldSortConditions = tableMod.getSortConditions();

        //var isTheSame = _(newSortConditions).isEqual(oldSortConditions);
        //if(!isTheSame) {
            util.ArrayUtils.replace(oldSortConditions, newSortConditions);
        //}

    };



    var createTableService = function() {
//         var config = $scope.config;

//         var sparqlService = $scope.sparqlService;
//         var queryFactory = config ? config.queryFactory : null;

//         var query = queryFactory ? queryFactory.createQuery() : null;

//         //var result = new service.TableServiceSparqlQuery(sparqlService, query);
//         var result = new service.TableServiceFacet(sparqlService, query);

        //return $scope.tableService;

        if(!$scope.configSupplier || !$scope.tableServiceSupplier) {
            return null;
        }

        var config = $scope.configSupplier();
        $scope.tableService = $scope.tableServiceSupplier(config);

        return $scope.tableService;
    };

    var sync = function() {
        //var config = $scope.config;
        //var tableMod = config ? config.tableMod : null;

        var tableMod = $scope.tableMod;

        if(tableMod != null) {
            syncTableMod($scope.gridOptions.sortInfo, tableMod);
        }
    };


    $scope.$watch('gridOptions.sortInfo', function(sortInfo) {

        sync();

        $scope.refreshData();
    }, true);


    $scope.$watch('[pagingOptions, filterOptions]', function (newVal, oldVal) {
        $scope.refreshData();
    }, true);

    var update = function() {
        $scope.refresh();
    };


    $scope.ObjectUtils = util.ObjectUtils;
    $scope.Math = Math;

    $scope.$watch('[ObjectUtils.hashCode(configSupplier()), ObjectUtils.hashCode(tableMod), disableRequests]', function (newVal, oldVal) {
        update();
    }, true);

    $scope.$watch('tableServiceSupplier', function() {
        update();
    });


    $scope.totalServerItems = 0;

    $scope.loading = {
        schema: false,
        pageCount: false,
        data: false
    };

    $scope.pagingOptions = {
        pageSizes: [10, 50, 100],
        pageSize: 10,
        currentPage: 1
    };

//     $scope.selectPage = function() {
//     };

    $scope.refresh = function() {
        var tableService = createTableService();

        if($scope.disableRequests || !tableService) {
            util.ArrayUtils.clear($scope.myData);
            return;
        }


        $scope.refreshSchema(tableService);
        $scope.refreshPageCount(tableService);
        $scope.refreshData(tableService);
    };

    $scope.refreshSchema = function(tableService) {
        tableService = tableService || createTableService();

        if(!tableService) {
            $scope.loading.schema = false;
            $scope.schema = {};
        }

        var oldSchema = $scope.schema;
        var promise = tableService.fetchSchema();

        $scope.loading.schema = true;

        jassa.sponate.angular.bridgePromise(promise, $q.defer(), $scope, function(newSchema) {
            var isTheSame = _(newSchema).isEqual(oldSchema);
            if(!isTheSame) {

                $scope.schema = newSchema;
            }

            $scope.loading.schema = false;
        });
    };

    $scope.refreshPageCount = function(tableService) {
        tableService = tableService || createTableService();

        if(!tableService) {
            $scope.totalServerItems = 0;
            $scope.loading.pageCount = false;
            return;
        }

        var promise = tableService.fetchCount();

        $scope.loading.pageCount = true;

        jassa.sponate.angular.bridgePromise(promise, $q.defer(), $scope, function(countInfo) {
            // Note: There is also countInfo.hasMoreItems and countInfo.limit (limit where the count was cut off)
            $scope.totalServerItems = countInfo.count;

            $scope.loading.pageCount = false;
        });
    };

    $scope.refreshData = function(tableService) {
        tableService = tableService || createTableService();

        if(!tableService) {
            $scope.loading.data = false;
            $scope.myData = [];
            return;
        }

        var page = $scope.pagingOptions.currentPage;
        var pageSize = $scope.pagingOptions.pageSize;

        var offset = (page - 1) * pageSize;

        var promise = tableService.fetchData(pageSize, offset);

        $scope.loading.data = true;

        jassa.sponate.angular.bridgePromise(promise, $q.defer(), $scope, function(data) {
            var isTheSame = _(data).isEqual($scope.myData);
            if(!isTheSame) {
                $scope.myData = data;
            }
            console.log('GEOLINK DATA', data);
            $scope.loading.data = false;
            //util.ArrayUtils.replace($scope.myData, data);

            // Using equals gives digest iterations exceeded errors; could be https://github.com/angular-ui/ng-grid/issues/873
            //$scope.myData = data;
        });
    };


//     var plugins = [];

//     if(ngGridFlexibleHeightPlugin) {
//         // js-hint will complain on lower case ctor call
//         var PluginCtor = ngGridFlexibleHeightPlugin;

//         plugins.push(new PluginCtor(30));
//     }

    /*
    $scope.$watch('[totalServerItems, pagingOptions.pageSize]', function(val) {
        $scope.numPages = Math.ceil($scope.totalServerItems / $scope.pagingOptions.pageSize);
    }, true);
    */
    //$scope.numPages = 10;
    $scope.maxSize = 7;

    $scope.myData = [];

    $scope.getSortDir = function(field) {
        var map = {};
        var fields = $scope.gridOptions.sortInfo.fields;
        var dirs = $scope.gridOptions.sortInfo.directions;

        var n = Math.max(fields.length, dirs.length);
        for(var i = 0; i < n; ++i) {
            var f = fields[i];
            var dir = dirs[i];

            map[f] = dir;
        }

        var result = map[field];
        return result;
    }

    $scope.setSortCondition = function(field, dir, append) {
        var fields = $scope.gridOptions.sortInfo.fields;
        var dirs = $scope.gridOptions.sortInfo.directions;

        if(!append) {
            jassa.util.ArrayUtils.replace(fields, [field]);
            jassa.util.ArrayUtils.replace(dirs, [dir]);
        } else {
            var indexes = jassa.util.ArrayUtils.indexesOf(fields, field);

            jassa.util.ArrayUtils.removeIndexes(fields, indexes);
            jassa.util.ArrayUtils.removeIndexes(dirs, indexes);

            fields.push(field);
            dirs.push(dir);
        }
        //alert(append);
    };

    // TODO Turn this into a plugin
    $scope.removeColumn = function(field) {
        $scope.configSupplier().tableConfigFacet.removeColumn(field);

        //$scope.refreshData();
        //$scope.refreshSchema();
        $scope.refresh();
    };

    $scope.gridOptions = {
        data: 'myData',
        enablePaging: true,
        useExternalSorting: true,
        showFooter: true,
        totalServerItems: 'totalServerItems',
        enableHighlighting: true,
        sortInfo: {
            fields: [],
            directions: []
            //columns: []
        },
        pagingOptions: $scope.pagingOptions,
        filterOptions: $scope.filterOptions,
        //plugins: plugins,
        columnDefs: 'schema.colDefs'
    };

//     $scope.tableParams = new ngTableParams({
//         page: 1,            // show first page
//         count: 10           // count per page
//     }, {
//         total: data.length, // length of data
//         getData: function($defer, params) {
//             $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
//         }
//     });

//     $scope.tableParams = new ngTableParams({
//         page: 1,            // show first page
//         count: 10,          // count per page
//         sorting: {
//             //name: 'asc'     // initial sorting
//         }
//     }, {
//         total: 0,           // length of data
//         getData: function($defer, params) {
//             // ajax request to api
//             Api.get(params.url(), function(data) {
//                 $timeout(function() {
//                     // update table params
//                     params.total(data.total);
//                     // set new data
//                     $defer.resolve(data.result);
//                 }, 500);
//             });
//         }
//     });
}]);

myModule.directive('sparqlTable', [function() {
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'partials/sparql-table/sparql-table.html',
        transclude: false,
        scope: {
//            sparqlService: '=',
// TODO Would it be ok to say: The config object should hold (references to) all attributes whose change should cause the table to refresh?
            // A function that is expected to yield a table service
            tableServiceSupplier: '=',
            // Some config object that upon change will be passed to the tableServiceSupplier

            configSupplier: '=',
            cellRendererSupplier: '=',
            // Hash function used to detect changes in the config object
//            configHasher: '=',
//            tableService: '=',

            tableMod: '=',
            disableRequests: '=',
            context: '='
//            onSelect: '&select',
//            onUnselect: '&unselect'
        },
        controller: 'SparqlTableCtrl',
        link: function (scope, element, attrs) {
//             if(!scope.configHasher) {
//                 scope.configHasher =
//             }
        }
    }
}]);


// Source http://stackoverflow.com/questions/17417607/angular-ng-bind-html-unsafe-and-directive-within-it
myModule.directive('compile', ['$compile', function ($compile) {
    return function(scope, element, attrs) {
        scope.$watch(
          function(scope) {
             // watch the 'compile' expression for changes
            return scope.$eval(attrs.compile);
          },
          function(value) {
            // when the 'compile' expression changes
            // assign it into the current DOM
            element.html(value);

            // compile the new DOM and link it to the current
            // scope.
            // NOTE: we only compile .childNodes so that
            // we don't get into infinite loop compiling ourselves
            $compile(element.contents())(scope);
          }
      );
  };
}]);

/*
myModule.controller("NodeCtrl", function($scope) {
    $scope.isVisible = true;
    $scope.hide = function() {
      $scope.isVisible = false;
    };
});
*/

// myModule.controller('ListController', ['$scope',
//     function ($scope) {
//     $scope.player = {
//             gold: 100
//         };
//         $scope.items = [
//             { name: 'Small Health Potion', cost: 4 },
//             { name: 'Small Mana Potion', cost: 5 },
//             { name: 'Iron Short Sword', cost: 12 }
//         ];
//         $scope.menuOptions = [
//             ['View Resource in a new Data Tab', function ($itemScope) {
//                 console.log('ItemScope', $itemScope);
//                 //$scope.player.gold -= $itemScope.item.cost;
//             }],
//             null,
//             ['Filter by this value', function ($itemScope) {
//                 //$scope.player.gold += $itemScope.item.cost;
//             }]
//         ];

//     }
// ]);

myModule.filter('sparqlLabel', function() {
    return function(lookupService) {

    }
});

myModule.directive('ngContextMenu', function ($parse) {
    var renderContextMenu = function ($scope, event, options) {
        if (!$) { var $ = angular.element; }
        $(event.target).addClass('context');
        var $contextMenu = $('<div>');
        $contextMenu.addClass('dropdown clearfix');
        var $ul = $('<ul>');
        $ul.addClass('dropdown-menu');
        $ul.attr({ 'role': 'menu' });
        $ul.css({
            display: 'block',
            position: 'absolute',
            left: event.pageX + 'px',
            top: event.pageY + 'px'
        });
        angular.forEach(options, function (item, i) {
            var $li = $('<li>');
            if (item === null) {
                $li.addClass('divider');
            } else {
                $a = $('<a>');
                $a.attr({ tabindex: '-1', href: '#' });

                if(item.linkAttrs) {
                    $a.attr(item.linkAttrs);
                }


                $a.text(item.text);
                $li.append($a);
                $li.on('click', function () {
                    $scope.$apply(function() {
                        if(item.callback) {
                            item.callback.call($scope, $scope);
                        }
                    });
                });
            }
            $ul.append($li);
        });
        $contextMenu.append($ul);
        $contextMenu.css({
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        $(document).find('body').append($contextMenu);

        $contextMenu
            .on("click", function (e) {
                $(event.target).removeClass('context');
                $contextMenu.remove();
            })
            .on('contextmenu', function (event) {
                $(event.target).removeClass('context');
                event.preventDefault();
                $contextMenu.remove();
            });
    };

    return {
        restrict: 'EA',
        //scope: true,
        compile: function() {
            return {
                pre: function ($scope, element, attrs) {
                    //element.on('contextmenu', function (event) {
                    element.on('click', function (event) {
                        $scope.$apply(function () {
                            event.preventDefault();
                            var options = $scope.$eval(attrs.ngContextMenu);
                            if(!options) {
                                throw 'Context menu options have not been set, is: ' + options;
                            }

                            if(typeof(options) === 'function') {
                                options = options($scope);
                            }

                            if (options instanceof Array) {
                                renderContextMenu($scope, event, options);
                            } else {
                                throw '"' + attrs.ngContextMenu + '" not an array';
                            }
                        });
                    })
                }
            };
        }
    };
});


/**
 * Maybe this should be a generic 'object' directive...
 * A context menu would be a nice addition...
 *
 * issue: even if we have service and value, how can we deal with the case when we want labels
 * to originate from different endpoints?
 * {
 *   serviceKey: {uri, defaultGraphs},
 *   value: new facete.Path(),
 * }
 *
 * The serviceKey is an additional attribute that specifies against which service to resolve the value.
 *
 * But maybe the context menu addition could be a directive on the outside???
 * e.g. <inline-context service="foo" data="bar"><object-view service="baz" data="baa"></object-view>
 */
/*
myModule.directive('jassaLabel', function() {
    return {
        restrict: 'AE',
        scope: {
            service: '=',
            expr: '=',
            label: '=',
            template: '<span>{{label}}</span>'
        },
        compile: function() {
            return {
                pre: function(scope, elem, attrs) {
                    scope.on('$destroy', function() {
                        var service = scope.service;

                        if(service) {
                            service.unregister(this);
                        }
                    });

                    scope.$watch('service', function(newService, oldService) {
                        if(oldService) {
                            oldService.unregister(this);
                        }

                        if(newService) {
                            newService.register(this);
                        }
                    });

                    scope.$watch('expr', function(newValue) {
                        var promise = service.request(newValue);
                        promise.then(function(label) {
                            scope.label = label;
                        });
                    });

                    if(!scope.bounds) {
                        scope.bounds = {};
                    }

                    var isInitialized = false;

                    var onConfigChange = function(newConfig) {
                        //console.log('Setting config', newConfig);
                        if(isInitialized) {
                            jQuery(elem).resizable('destroy');
                        }

                        jQuery(elem).resizable(newConfig);

                        isInitialized = true;
                    };


                    var propNames = ['top', 'bottom', 'width', 'height'];

                    var getCssPropMap = function(propNames) {
                        var data = elem.prop('style');
                        var result = _(data).pick(propNames);

                        return result;
                    };

                    var setCssPropMap = function(propMap) {
                        _(propMap).each(function(v, k) {
                            //console.log('css prop', k, v);
                            elem.css(k, v);
                        });
                    };

                    var bounds = getCssPropMap(propNames);
                    angular.copy(bounds, scope.bounds);

                    if(scope.onResizeInit) {
                        scope.onResizeInit({
                            bounds: bounds
                        });
                    }

                    var onBoundsChange = function(newBounds, oldBounds) {
                        //console.log('setting bounds', newBounds, oldBounds);
                        setCssPropMap(newBounds);
                    };

                    scope.$watch('bounds', onBoundsChange, true);

                    jQuery(elem).on('resizestop', function (evt, ui) {

                        var bounds = getCssPropMap(propNames);
                        angular.copy(bounds, scope.bounds);
                        //console.log('sigh', bounds);

                        if (scope.onResize) {
                            scope.onResize(evt, ui, bounds);
                        }

                        if(!scope.$$phase) {
                            scope.$apply();
                        }
                    });

                    scope.$watch('resizable', onConfigChange);
                    //onConfigChange(scope.resizable);
                }
            };
        }
    };
});
*/




    sparql.ElementFactoryTransform = Class.create(sparql.ElementFactory, {
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

    facete.ConceptFactoryRename = Class.create(facete.ConceptFactory, {
        initialize: function(baseConceptFactory, varMap) {
            this.baseConceptFactory = baseConceptFactory;
            this.varMap = varMap;
        },

        createConcept: function() {
            var baseConcept = this.baseConceptFactory.createConcept();
            var v = baseConcept.getVar();
            var e = baseConcept.getElement();

            var ne = sparql.ElementUtils.createRenamedElement(e, this.varMap);

            var nv = this.varMap.get(v);
            if(!nv) {
                nv = v;
            }

            var result = new facete.Concept(ne, nv);
            return result;
        }
    });


    myModule.filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    });


    /*
    var test = new service.SparqlServiceHttp('http://localhost:7532/api/path-finding?service-uri=http%3A%2F%2Fcstadler.aksw.org%2Fconti%2Ffreebase%2Fgermany%2Fsparql&default-graph-uri=http%3A%2F%2Ffreebase.com%2F2013-09-22%2Fdata%2F&source-element=%3Fs+%3F_p_+%3F_o_&source-var=s&target-element=%3Fs+<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23long>+%3Fx+%3B++<http%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23lat>+%3Fy&target-var=s&js-service-uri=');
    var qe = test.createQueryExecution('Select * { ?s ?p ?o } Limit 10');
    var promise = qe.execSelect();
    promise.done(function(rs) {
       while(rs.hasNext()) {
           var binding = rs.next();
           console.log('Binding ' + binding);
       }
    }).fail(function() {
        alert(JSON.stringify(arguments));
    });
    */

    (function() {
        var ns = service;

        ns.QueryExecutionDummy = Class.create(ns.QueryExecution, {
            createPromise: function(val) {
                var deferred = jQuery.Deferred();
                deferred.resolve(val);
                return deferred.promise();
            },

            execAsk: function() {
                var result = this.createPromise(false);
                return result;
            },

            execSelect: function() {
                var rs = new ns.ResultSetArrayIteratorBinding(new util.IteratorArray([]));
                var result = this.createPromise(rs);
                return result;
            },

            setTimeout: function(timeoutInMillis) {

            }
        });

        ns.SparqlServiceDummy = Class.create(ns.SparqlService, {

            createQueryExecution: function(query) {
                return new ns.QueryExecutionDummy();
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
    })();

    (function() {
        var ns = facete;
        ns.QueryFactoryConst = Class.create(ns.QueryFactory, {
            initialize: function(query) {
                this.query = query;
            },

            createQuery: function() {
                return this.query;
            }
        });
    })();

//     var refEquals = function(a, b) {
//         var result = a == b;
//         return result;
//     };

//     var uniqRefs = function(arr) {
//         var result = [];
//         _(arr).each(function(item) {
//             var found = _(result).find(result, refEquals);
//             if(!found) {
//                 result.push(item);
//             }
//         });

//         return result;
//     };



    myModule.controller('FaceteAppCtrl', ['$scope', '$q', '$rootScope', function($scope, $q, $rootScope) {



        // Quick test of the the .nodes() parameter
        if(false) {
            var sparqlService = new service.SparqlServiceHttp('http://dbpedia.org/sparql', ['http://dbpedia.org']);

            var nodes = [rdf.NodeFactory.createUri('http://dbpedia.org/resource/London'), rdf.NodeFactory.createUri('http://dbpedia.org/resource/Leipzig')];
            var store = new sponate.StoreFacade(sparqlService);

            var labelMap = sponate.SponateUtils.createDefaultLabelMap();
            store.addMap(labelMap, 'labels');
            var labelsStore = store.labels;

            var labelService = new service.LookupServiceSponate(labelsStore);
            labelService = new service.LookupServiceIdFilter(labelService, function(node) {
                // TODO Using a proper URI validator would increase quality
                var r = node && node.isUri();
                if(r) {
                    var uri = node.getUri();
                    r = r && !uri.contains(' ');
                    r = r && !uri.contains('<');
                    r = r && !uri.contains('>');
                }
                return r;
            });
            labelService = new service.LookupServiceTimeout(labelService, 20);
            labelService = new service.LookupServiceTransform(labelService, function(doc, id) {
                var result = doc ? doc.displayLabel : null;

                if(!result) {
                    if(id.isUri()) {
                        result = sponate.extractLabelFromUri(id.getUri());
                    } else {
                        result = '' + id;
                    }
                }

                return result;
            });
            labelService = new service.LookupServiceCache(labelService);

            var ls = new service.LookupServicePathLabels(labelService);
            var paths = [
                facete.Path.parse('http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://www.w3.org/2000/01/rdf-schema#label')
            ];
            ls.lookup(paths).pipe(function(map) {
                console.log('PATH LABELS', map);
            });


            for(var i = 0; i < 10; ++i) {
                (function(i) {
                    labelService.lookup(nodes).done(function(result) {
                        console.log('lookup result [' + i + ']: ' + JSON.stringify(result.entries()));
                    });
                    labelService.lookup([nodes[0]]).done(function(result) {
                        console.log('lookup result [' + i + ']: ' + JSON.stringify(result.entries()));
                    });
                    labelService.lookup([nodes[1]]).done(function(result) {
                        console.log('lookup result [' + i + ']: ' + JSON.stringify(result.entries()));
                    });
                })(i);
            }

            /*
            store.labels.find().nodes(nodes).asList().done(function(result) {
                alert(JSON.stringify(result));
            });
            */

        }



        /**
         * Used for progress bar
         */
        $scope.Math = Math;


        $scope.active = {
            services: {}
        };



        /* Application UI state */
        $scope.app = {
            search: {
                show: false,
                isOpen: false
            },
            dataSources: {
                isOpen: false,
                showAddDialog: false
            },
            data: {
                isOpen: false,
                tabs: [{isActive: true}, {isActive: false}, {isActive: false}, {isActive: false}, {isActive: false}],
                originalBounds: {}, // Bounds to restore size
                bounds: {} // Bounds for current size; watched and synced by the directive
            },
            geoLinks: {
                isOpen: false
            },
            facets: {
                isOpen: false
            },
            baseConceptFilterString: null,
            baseConceptFilterStringTmp: '',
        };


        var resizableConfigEnabled = {
            handles: 'n, e, ne',
            containment: 'parent',

            create: function(event, ui) {
                jQuery(event.target).on('resize', function (e, ui) {
                    // Prevent the top attribute from getting set
                    jQuery(event.target).css('top', '');
                });
            },

            // Resize might not working properly, if there are parent elements with pointer-events: none involved
            start: function(event, ui) {
                var el = jQuery(event.target);

                this.pointerEventsResets = el.parents().filter(function() {
                    var attrVal = jQuery(this).css('pointer-events');
                    var r = attrVal === 'none';
                    //console.log('resize', this, attrVal, r)
                    return r;
                });

                this.pointerEventsResets.css('pointer-events', 'auto');
            },
            stop: function(event, ui) {
                this.pointerEventsResets.css('pointer-events', 'none');
            }
        };

        var resizableConfigDisabled = {handles: 'none', disabled: true};

        $scope.resizableConfig = resizableConfigDisabled;


        $scope.$watch('app.data.isOpen', function(state) {
            $scope.resizableConfig = state ? resizableConfigEnabled : resizableConfigDisabled;
        });





        $scope.edit = {
            id: null,
            dataServiceIri: '',
            dataGraphIris: '',
            jsServiceIri: '',
            jsGraphIris: ''
        };


        var storeApiUrl = 'api/store';



        var tableConfigFacet; // Initialized later - TODO Fix the order

        var createDefaultWorkspaceConfig = function() {
            var result = {
                name: 'Unnamed Data Source',
                dataService: {
                    serviceIri: '',
                    defaultGraphIris: []
                },
                joinSummaryService: {
                    serviceIri: '',
                    defaultGraphIris: []
                },
                conceptPathFinderApiUrl: 'api/path-finding',
                facetTreeConfig: facetTreeConfig,
                mapConfig: {
                    mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                    geoConcept: geo.GeoConcepts.conceptWgs84,
                    quadTreeConfig: {
                        maxItemsPerTileCount: 1000,
                        maxGlobalItemCount: 2000
                    }
                },
                tableConfigFacet: tableConfigFacet
            };

            return result;
        };


        var applyScope = function() {
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        };

        refreshDataSources = function() {
            var spec = {
                url: storeApiUrl + '/loadState',
                traditional: true,
                data: {
                    type: 'dataSource'
                },
                dataType: 'json'
            };

            jQuery.ajax(spec).done(function(response) {

                var configs = _(response).map(function(record) {
                    var item = record.data;
                    item.id = record.id;

                    var spec = createDefaultWorkspaceConfig();
                    console.log('ITEM', item);
                    spec.id = item.id;
                    spec.name = item.name;
                    spec.dataService.serviceIri = item.dataServiceIri;
                    spec.dataService.defaultGraphIris = item.dataGraphIris;
                    spec.joinSummaryService.serviceIri = item.jsServiceIri;
                    spec.joinSummaryService. defaultGraphIris = item.jsGraphIris;

                    return spec;
                });
                console.log('CONFIGS', configs);

                $scope.active.serviceConfigs = configs;

                applyScope();
                //alert('yay' + JSON.stringify(response));
            }).fail(function() {
                alert('Failed to retrieve data sources');
            });
        };


        $scope.deleteDataSource = function(id) {

            var c = confirm('Delete dataset with id ' + id + '?');
            if(!c) {
                return;
            }

            var spec = {
                    url: storeApiUrl + '/deleteState',
                    type: 'POST',
                    traditional: true,
                    data: {
                        type: 'dataSource',
                        id: id
                    },
                    dataType: 'json'
            };

            jQuery.ajax(spec).done(function(response) {
                // FIXME Verify the response for success
            }).fail(function() {
                alert('Failed to delete data source with id ' + id);
                //$scope.active.service = serviceConfigs.length === 0 ? null : serviceConfigs[0];

            }).then(function() {
                refreshDataSources();
            });

        }

        $scope.addDataSource = function() {
            var raw = _($scope.edit).clone();


            raw.dataGraphIris = raw.dataGraphIris.match(/\S+/g);
            raw.jsGraphIris = raw.jsGraphIris.match(/\S+/g);

            var data = JSON.stringify(raw);

            var spec = {
                url: storeApiUrl + '/saveState',
                type: 'POST',
                traditional: true,
                data: {
                    type: 'dataSource',
                    data: data
                },
                dataType: 'json'
            };

            jQuery.ajax(spec).done(function(response) {
                // Hide data source creation dialog
                //$scope.app.dataSources.isOpen = false;
                $scope.app.dataSources.showAddDialog=false

                refreshDataSources();
                //alert('yay' + JSON.stringify(response));
            }).fail(function() {
                alert('Failed to store data');
            });

        };



        var vs = rdf.NodeFactory.createVar('s');



        //var tableModGeoPath = new facete.TableMod();
        //tableMode.addColumn('s');
        var vPath = rdf.NodeFactory.createUri('http://ns.aksw.org/jassa/ontology/Path');
        var facetTreeConfigGeoLink = new facete.FacetTreeConfig();
        var facetConfigGeoLink = facetTreeConfigGeoLink.getFacetConfig();
        var baseConcept = new facete.Concept(new sparql.ElementTriplesBlock([new rdf.Triple(vs, vocab.rdf.type, vPath)]), vs);
        facetConfigGeoLink.setBaseConcept(baseConcept);
        tableConfigGeoLink = new facete.TableConfigFacet(facetConfigGeoLink);
        tableConfigGeoLink.togglePath(new facete.Path());
        tableConfigGeoLink.togglePath(facete.Path.parse(vocab.rdfs.label.getUri()));
        tableConfigGeoLink.togglePath(facete.Path.parse('http://ns.aksw.org/jassa/ontology/pathLength'));
        var pathLengthColId = tableConfigGeoLink.getColIdForPath(facete.Path.parse('http://ns.aksw.org/jassa/ontology/pathLength'));

        tableConfigGeoLink.getTableMod().getSortConditions().push(new facete.SortCondition(pathLengthColId, 1));



        /* Dummy init */
        var dummyQuery = new sparql.Query();
        dummyQuery.getProject().add(vs);
        dummyQuery.getElements().push(new sparql.ElementTriplesBlock([new rdf.Triple(vs, vs, vs)]));

        var tmpTableMod = new facete.TableMod();
        tmpTableMod.addColumn('s');
//         $scope.active.tableConfigFacet = {
//             queryFactory: new facete.QueryFactoryConst(dummyQuery),
//             tableMod: tmpTableMod
//         };


        var facetTreeConfig = new facete.FacetTreeConfig();
        var targetFacetTreeConfig = new facete.FacetTreeConfig();


        // On startup, expand the root facet node
        var rootPath = new facete.Path()
        facetTreeConfig.getExpansionSet().add(rootPath);
        facetTreeConfig.getExpansionMap().put(rootPath, 1);

        targetFacetTreeConfig.getExpansionSet().add(rootPath);
        targetFacetTreeConfig.getExpansionMap().put(rootPath, 1);


        var facetConfig = facetTreeConfig.getFacetConfig();
        var pathTaggerManager = facetConfig.getPathTaggerManager()
        var taggerMap = pathTaggerManager.getTaggerMap();


        tableConfigFacet = new facete.TableConfigFacet(facetConfig);
        tableConfigFacet.togglePath(new facete.Path());


        var tableMod = tableConfigFacet.getTableMod();
        //tableMod.addColumn('s'); // TODO Instead of 's' use: facetConfig.getBaseConcept().getVar().getName()

        taggerMap.table = new facete.ItemTaggerMembership(tableConfigFacet.getPaths());


        var essentialDataElementStr =
            '\
              Optional {\
                ?instanceUri a ?typeUri .\
                Optional {\
                  ?typeUri2 <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?typeUri\
                }\
                Filter(!Bound(?typeUri2))\
              }\
              Optional { ?instanceUri <http://www.w3.org/2000/01/rdf-schema#label> ?instanceLabel . Filter(langMatches(lang(?instanceLabel), "de"))}\
              Optional { ?instanceUri <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?lon }\
              Optional { ?instanceUri <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat }\
              Optional { ?instanceUri <http://www.w3.org/2000/01/rdf-schema#seeAlso> ?instancePage }\
              Optional { ?typeUri <http://www.w3.org/2000/01/rdf-schema#label> ?typeLabel .Filter(langMatches(lang(?typeLabel), "en")) }\
              Optional { ?typeUri <http://www.w3.org/2000/01/rdf-schema#seeAlso> ?typePage }\
            ';

        var essentialDataElement = sparql.ElementString.create(essentialDataElementStr);
        var essentialDataElementFactory = new sparql.ElementFactoryConst(essentialDataElement);


        var essentialTableMod = new facete.TableMod();

        {
            var varNames = ['instanceLabel', 'typeLabel', 'instancePage', 'typePage', 'instanceUri', 'typeUri', 'lon', 'lat'];
            _(varNames).each(function(varName) {
                essentialTableMod.addColumn(varName);
            });
        }


        var geoConceptFactory = new facete.ConceptFactoryFacetTreeConfig(facetTreeConfig);


        var conceptFalse = new facete.Concept(sparql.ElementString.create('?s a <http://foo.bar>'), vs);

        var filterConceptFactory = new facete.ConceptFactoryConst(conceptFalse)



        var createBaseConcept = function(filterString, baseVar) {
            var result;
            var vs = baseVar || rdf.NodeFactory.createVar('s');
            if(filterString == null || filterString === '') {
                result = facete.ConceptUtils.createSubjectConcept(vs);
            }
            else {
                var vo = rdf.NodeFactory.createVar('bcl'); // bif contains label
                var evo = new sparql.ExprVar(vo);

                var no = rdf.NodeFactory.createPlainLiteral(filterString);
                var eno = sparql.NodeValue.makeNode(no);

                //var es = new sparql.ExprVar(vs);
                var element =
                    new sparql.ElementGroup([
                        new sparql.ElementTriplesBlock([
                            new rdf.Triple(vs, vocab.rdfs.label, vo)
                        ]),
                        new sparql.ElementFilter(
                            new sparql.E_Function('<bif:contains>', [evo, eno])
                        )
                    ]);

                //debugger;
                //console.log('element', element.copySubstitute(function(x) {return x; }));
                //alert('element ' + element);
                //alert('element ' + element.copy());
                result = new facete.Concept(element, vs);
            }

            return result;
        };

        $scope.setBaseConcept = function(filterString) {

            var baseConcept = createBaseConcept(filterString);

            facetTreeConfig.getFacetConfig().setBaseConcept(baseConcept);

            if(filterString == null || filterString === '') {
                $scope.app.baseConceptFilterString = null;
            } else {
                $scope.app.baseConceptFilterString = filterString;
            }
        }


        $scope.tableContext = {};

//         var argh = $scope;

        // TODO This method should go to a different tableContext
        $scope.tableContext.setGeoPath = function(path) {
            $scope.active.geoConceptFactory.setPath(path);
        };



        $scope.tableContext.menuOptions = function($scope) {
            var result = [];

            var item = $scope.cell;
            var node = item ? item.node : null;
            if(node && node.isUri && node.isUri()) {
                result.push({
                    //html: '<a href="' + node.getUri() + '">Show resource in new Browser Tab<a/>',
                    text: 'Show resource in new browser tab',
                    linkAttrs: {
                        href: node.getUri(),
                        target: '_blank'
                    }
                });
            }

            result.push({
                text: 'Copy to clip board...',
                callback: function($itemScope) {
                    var text;
                    if(node.isUri()) {
                        text = node.getUri();
                    } else {
                        text = '' + node;
                    }
                    prompt('Copy the text below to the clip board', '' + text);
                }
            });


            var path = $scope.colDef.path;

            result.push({
                text: 'Toggle constraint from this value',
                callback: function($itemScope) {
                    var constraint = new facete.ConstraintEquals(path, node);
                    facetTreeConfig.getFacetConfig().getConstraintManager().toggleConstraint(constraint);
                }
            });

            return result;
        };

        var visibleControls = new util.HashSet();
        taggerMap.controls = new facete.ItemTaggerMembership(visibleControls);

        $scope.facetTreePluginContext = {
            toggleControls: function(path) {
                if(path) {
                    util.CollectionUtils.toggleItem(visibleControls, path);
                }
            },

            toggleTableLink: function(path) {
                //var active = $scope.active;
                //var active = $scope;
                if(tableConfigFacet) {
                    tableConfigFacet.togglePath(path);
                }

//                  if(active.allTableConfigFacet) {
//                      active.allTableConfigFacet.togglePath(path);
//                  }
            }
        };


        $scope.facetTreePlugins = [
            '<a style="margin-left: 5px; margin-right: 5px;" ng-show="data.isExpanded && (data.isHovered || data.item.getTags().controls.isContained)" href="" ng-click="context.toggleControls(data.item.getPath())"><span class="glyphicon glyphicon-cog"></span></a>',
            '<a style="margin-left: 5px; margin-right: 5px;" ng-show="data.isHovered || data.item.getTags().table.isContained" href="" ng-click="context.toggleTableLink(data.item.getPath())"><span class="glyphicon glyphicon-list-alt"></span></a>'
        ];



//         var tableMod = new facete.TableMod();
//         //tableMod.addColumn('s');
//         tableMod.addColumn('_p_');
//         tableMod.addColumn('_o_');


        $scope.active.services.sparqlService = new service.SparqlServiceDummy();
        $scope.active.geoConceptFactory = geoConceptFactory;



        refreshDataSources();

        $scope.active.serviceConfigs = [];

        var deleteThisWhenDbIsDone =
        [
            {
                name: 'FP7 ICT Project Partners (local)',
                dataService: {
                    serviceIri: 'http://localhost/data/fp7-pp/sparql',
                    defaultGraphIris: ['http://fp7-pp.publicdata.eu/']
                },
                joinSummaryService: {
                    serviceIri: null,
                    defaultGraphIris: []
                },
                conceptPathFinderApiUrl: 'api/path-finding',
                facetTreeConfig: facetTreeConfig,
                mapConfig: {
                    mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                    geoConcept: geo.GeoConcepts.conceptWgs84,
                    quadTreeConfig: {
                        maxItemsPerTileCount: 1000,
                        maxGlobalItemCount: 2000
                    }
                }
            },
            {
            name: 'Freebase Germany (local)',
            dataService: {
                serviceIri: 'http://localhost/data/freebase/germany/sparql',
                defaultGraphIris: ['http://freebase.com/2013-09-22/data/']
            },
            joinSummaryService: {
                serviceIri: null,
                defaultGraphIris: []
            },
            conceptPathFinderApiUrl: 'api/path-finding',
            facetTreeConfig: facetTreeConfig,
            mapConfig: {
                mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                geoConcept: geo.GeoConcepts.conceptWgs84,
                quadTreeConfig: {
                    maxItemsPerTileCount: 1000,
                    maxGlobalItemCount: 2000
                }
            }
        },
        {
            name: 'GeoStats (local)',
            dataService: {
                serviceIri: 'http://localhost/data/geostats/sparql',
                defaultGraphIris: ['http://localhost/geostats.nt']
            },
            joinSummaryService: {
                serviceIri: null,
                defaultGraphIris: []
            },
            conceptPathFinderApiUrl: 'api/path-finding',
            facetTreeConfig: facetTreeConfig,
            mapConfig: {
                mapFactory: geo.GeoMapFactoryUtils.ogcVirtMapFactory,
                geoConcept: geo.GeoConcepts.conceptGeoVocab,
                quadTreeConfig: {
                    maxItemsPerTileCount: 1000,
                    maxGlobalItemCount: 2000
                }
            }
        },
        {
            name: 'DBpedia, geo & types (local)',
            dataService: {
                serviceIri: 'http://localhost/data/dbpedia/3.9/sparql',
                defaultGraphIris: ['http://dbpedia.org/3.9/']
            },
            joinSummaryService: {
                serviceIri: null,
                defaultGraphIris: []
            },
            conceptPathFinderApiUrl: 'api/path-finding',
            facetTreeConfig: facetTreeConfig,
            mapConfig: {
                mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                geoConcept: geo.GeoConcepts.conceptWgs84,
                quadTreeConfig: {
                    maxItemsPerTileCount: 1000,
                    maxGlobalItemCount: 2000
                }
            }
        },
        {
            name: 'GeoKnow Y1 Demo Dataset (local)',
            dataService: {
                serviceIri: 'http://localhost/data/geoknow/demo/y1/sparql',
                defaultGraphIris: []
            },
            joinSummaryService: {
                serviceIri: null,
                defaultGraphIris: []
            },
            conceptPathFinderApiUrl: 'api/path-finding',
            facetTreeConfig: facetTreeConfig,
            mapConfig: {
                mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                geoConcept: geo.GeoConcepts.conceptWgs84,
                quadTreeConfig: {
                    maxItemsPerTileCount: 1000,
                    maxGlobalItemCount: 2000
                }
            }
        },
        {
            name: 'FP7 ICT Project Partners (remote)',
            dataService: {
                serviceIri: 'http://fp7-pp.publicdata.eu/sparql',
                defaultGraphIris: ['http://fp7-pp.publicdata.eu/']
            },
            joinSummaryService: {
                serviceIri: null,
                defaultGraphIris: []
            },
            conceptPathFinderApiUrl: 'api/path-finding',
            facetTreeConfig: facetTreeConfig,
            mapConfig: {
                mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                geoConcept: geo.GeoConcepts.conceptWgs84,
                quadTreeConfig: {
                    maxItemsPerTileCount: 1000,
                    maxGlobalItemCount: 2000
                }
            }
        },
//         {
//             name: 'GeoKnow Demo Dataset (remote)',
//             dataService: {
//                 serviceIri: 'http://cstadler.aksw.org/geoknow/sparql',
//                 defaultGraphIris: []
//             },
//             joinSummaryService: {
//                 serviceIri: null,
//                 defaultGraphIris: []
//             },
//             conceptPathFinderApiUrl: 'api/path-finding',
//             facetTreeConfig: facetTreeConfig,
//             mapConfig: {
//                 mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
//                 geoConcept: geo.GeoConcepts.conceptWgs84,
//              quadTreeConfig: {
//                  maxItemsPerTileCount: 1000,
//                  maxGlobalItemCount: 2000
//              }
//             }
//         },
        {
            name: 'DBpedia, official (remote)',
            dataService: {
                serviceIri: 'http://dbpedia.org/sparql',
                defaultGraphIris: ['http://dbpedia.org']
            },
            joinSummaryService: {
                serviceIri: 'http://cstadler.aksw.org/service/join-summary/sparql',
                defaultGraphIris: ['http://dbpedia.org/2013-12-22/join-summary-essential/']
            },
            conceptPathFinderApiUrl: 'api/path-finding',
            facetTreeConfig: facetTreeConfig,
            mapConfig: {
                mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                geoConcept: geo.GeoConcepts.conceptWgs84,
                quadTreeConfig: {
                    maxItemsPerTileCount: 1000,
                    maxGlobalItemCount: 2000
                }
            }
        },
        {
            name: 'LinkedGeoData (remote)',
            dataService: {
                serviceIri: 'http://linkedgeodata.org/sparql',
                defaultGraphIris: ['http://linkedgeodata.org']
            },
            joinSummaryService: {
                serviceIri: 'http://linkedgeodata.org/join-summary/sparql',
                defaultGraphIris: ['http://linkedgeodata.org/join-summary']
            },
            conceptPathFinderApiUrl: 'api/path-finding',
            facetTreeConfig: facetTreeConfig,
            mapConfig: {
                mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
                geoConcept: geo.GeoConcepts.conceptWgs84,
                quadTreeConfig: {
                    maxItemsPerTileCount: 1000,
                    maxGlobalItemCount: 2000
                }
            }
        }
//         {
//             name: 'GeoStats (remote)',
//             dataService: {
//                 serviceIri: 'http://cstadler.aksw.org/service/geostats/sparql',
//                 defaultGraphIris: ['http://geostats.aksw.org/']
//             },
//             joinSummaryService: {
//                 serviceIri: null,
//                 defaultGraphIris: []
//             },
//             conceptPathFinderApiUrl: 'api/path-finding',
//             facetTreeConfig: facetTreeConfig,
//             mapConfig: {
//                 mapFactory: geo.GeoMapFactoryUtils.ogcVirtMapFactory,
//                 geoConcept: geo.GeoConcepts.conceptGeoVocab,
//              quadTreeConfig: {
//                  maxItemsPerTileCount: 1000,
//                  maxGlobalItemCount: 2000
//              }
//             }
//         },
//         {
//             name: 'LGD Sparqlify Localhost',
//             dataService: {
//                 serviceIri: 'http://localhost:7531/sparql',
//                 defaultGraphIris: []
//             },
//             joinSummaryService: {
//                 serviceIri: 'http://linkedgeodata.org/join-summary/sparql',
//                 defaultGraphIris: ['http://linkedgeodata.org/join-summary']
//             },
//             conceptPathFinderApiUrl: 'api/path-finding',
//             facetTreeConfig: facetTreeConfig,
//             mapConfig: {
//                 mapFactory: geo.GeoMapFactoryUtils.wgs84MapFactory,
//                 geoConcept: geo.GeoConcepts.conceptWgs84,
//              quadTreeConfig: {
//                  maxItemsPerTileCount: 1000,
//                  maxGlobalItemCount: 2000
//              }
//             }
        ];

        // TODO: Whenever the facet selection changes, we need to recreate the map data source service for the modified concept
        var createMapDataSource = function(sparqlService, geoMapFactory, concept, fillColor) {

            // The 'core' service from which to retrieve the initial data
            var bboxListService = new service.ListServiceBbox(sparqlService, geoMapFactory, concept);

            // Wrap this service for augmenting (enriching) it with labels
            var lookupServiceLabels = sponate.LookupServiceUtils.createLookupServiceNodeLabels(sparqlService);
            lookupServiceLabels = new service.LookupServiceTransform(lookupServiceLabels, function(doc, id) {
                var result = {
                    shortLabel: doc
                };
                return result;
            });

            var augmenterLabels = new service.AugmenterLookup(lookupServiceLabels);
            bboxListService = new service.ListServiceAugmenter(bboxListService, augmenterLabels);

            // Also add style information
            var lookupServiceStyle = new service.LookupServiceConst({
                fillColor: fillColor,
                fontColor: fillColor,
                   strokeColor: fillColor,

                stroke: true,
                strokeLinecap: 'round',
                strokeWidth: 100,
                pointRadius: 12,
                labelAlign: 'cm',

                config: {
                    conceptFactory: geoConceptFactory
                }
            });

            var augmenterStyle = new service.AugmenterLookup(lookupServiceStyle);
            bboxListService = new service.ListServiceAugmenter(bboxListService, augmenterStyle);

            // Wrap the list service with clustering support
            var result = new service.DataServiceBboxCache(bboxListService, 1500, 500, 2);

            return result;
        };


        /**
         * Init of derived attributes
         *
         */

//        _($scope.active.serviceConfigs).each(function(serviceConfig) {
            // Create the tableConfigFacet
//          var facetTreeConfig = serviceConfig.facetTreeConfig;
//             var facetConfig = facetTreeConfig.getFacetConfig()


//            serviceConfig.tableConfigFacet = tableConfigFacet;

            // Init the taggerMap
//          var pathTaggerManager = facetConfig.getPathTaggerManager()
//          var taggerMap = pathTaggerManager.getTaggerMap();

//          taggerMap.table = new facete.ItemTaggerMembership(tableConfigFacet.getPaths());

            // Init the tableMod
//          var tableMod = tableConfigFacet.getTableMod();
//          tableMod.addColumn('s');
//        });


        // On startup, show the list of types
        $scope.active.path = facete.Path.parse(vocab.rdf.type.getUri());
        $scope.active.targetPath = facete.Path.parse(vocab.rdf.type.getUri());


        var findConceptPaths = function(sourceConcept, targetConcept) {
            var conceptPathFinder = $scope.active.conceptPathFinder;
            if(!conceptPathFinder) {
                var deferred = jQuery.Deferred();
                deferred.resolve([]);
                return deferred.promise();
            }

            var promise = conceptPathFinder.findPaths(sourceConcept, targetConcept);
            var result = sponate.angular.bridgePromise(promise, $q.defer(), $rootScope, function(paths) {
                var tmp = _(paths).map(function(path) {

                    var pathName = path.toString();
                    if(pathName === '') {
                        pathName = '(empty path)';
                    }

                    var r = {
                        name: pathName,
                        path: path
                    };
                    return r;
                });

                return tmp;
            });

            return result;
        };

        /*
         * Concept Path Finding
         */
        var refresh = function(config) {

            var conceptPathFinderApiUrl = config.conceptPathFinderApiUrl;
            var sparqlServiceIri = config.dataService.serviceIri;
            var defaultGraphIris = config.dataService.defaultGraphIris;
            var joinSummaryServiceIri = config.joinSummaryService.serviceIri;
            var joinSummaryDefaultGraphIris = config.joinSummaryService.defaultGraphIris;


            var geoConcept = config.mapConfig.geoConcept;

            var conceptPathFinder = new client.ConceptPathFinderApi(conceptPathFinderApiUrl, sparqlServiceIri, defaultGraphIris, joinSummaryServiceIri, joinSummaryDefaultGraphIris);
            $scope.active.conceptPathFinder = conceptPathFinder;

            var facetTreeConfig = config.facetTreeConfig;
            var conceptFactory = new facete.ConceptFactoryFacetTreeConfig(facetTreeConfig);


            var sourceConcept = conceptFactory.createConcept();
            var targetConcept = geoConcept;


            var lookupServicePathLabels = $scope.active.services.lookupServicePathLabels;



            var createTableConfigGeoLink = function(tableConfig, conceptPathFinder, sourceConcept, targetConcept) {
                return {
                    tableServiceSupplier: function(config) {

                        var services = $scope.active.services;

                        // TODO We should wrap a cache here?
                        var sparqlService = conceptPathFinder.createSparqlService(config.sourceConcept, config.targetConcept)

                        var tableService = new service.TableServiceQuery(sparqlService, config.query);
                        tableService = new service.TableServiceFacet(tableService, config.tableConfig, services.lookupServiceNodeLabels, services.lookupServicePathLabels);

                        var pathColId = config.tableConfig.getColIdForPath(new facete.Path());
                        var labelColId = config.tableConfig.getColIdForPath(facete.Path.parse(vocab.rdfs.label.getUri()));

                        tableService = new service.TableServiceGeoLink(tableService, services.lookupServicePathLabels, pathColId, labelColId);

                        return tableService;
                    },
                    configSupplier: function() {

                        var tableMod = tableConfig.getTableMod();
                        var conceptFactory = new ConceptFactoryTableConfigFacet(tableConfig);
                        var elementFactory = new facete.ElementFactoryConceptFactory(conceptFactory);
                        var queryFactory = new facete.QueryFactoryTableMod(elementFactory, tableMod);

                        var r = {
                            query: queryFactory.createQuery(),
                            tableConfig: tableConfig,

                            conceptPathFinder: conceptPathFinder,
                            sourceConcept: sourceConcept,
                            targetConcept: targetConcept
                        };
                        return r;
                    },
                    tableMod: tableConfig.getTableMod(),
                    cellRendererSupplier: function() {
                        var html;

                        if(this.cell.path) {
                            html = '<a href="" ng-click="context.setGeoPath(cell.path)" title="{{cell.node.toString()}}" ng-bind-html="cell.displayLabel"></a>';
                        }
                        else {
                            html = '<span ng-bind-html="cell.displayLabel"></span>';
                        }

                        return html;
                    }
                }
            };

            $scope.active.tableGeoLink = createTableConfigGeoLink(tableConfigGeoLink, conceptPathFinder, sourceConcept, targetConcept);


//          var cpfSparqlService = conceptPathFinder.createSparqlService(sourceConcept, targetConcept);
//          var qe = cpfSparqlService.createQueryExecution('Select * { ?s ?p ?o } Limit 10');
//          qe.execSelect().done(function(rs) {
//              alert(JSON.stringify(rs.getBindings()));
//          }).fail(function() {
//              alert('fail');
//          });

/*
            $scope.findConceptPaths(sourceConcept, targetConcept).then(function(tmp) {

                //console.log('GEOPATHS', tmp);
                var paths = _(tmp).pluck('path');

                lookupServicePathLabels.lookup(paths).pipe(function(map) {
                    var items = (paths).map(function(path) {
                        var label = map.get(path) || '' + path;
                        var item = {
                            path: path,
                            name: label
                        };
                        return item;
                    });
                    return items;
                }).pipe(function(items) {
                    $scope.active.geoPaths = items;

                    applyScope($scope);
                }).fail(function() {
                    alert('Failed to fetch geopath labels: ' + JSON.stringify(arguments));
                });
            });
*/








            /*
            var promise = conceptPathFinder.findPaths(sourceConcept, targetConcept);
            var result = sponate.angular.bridgePromise(promise, $q.defer(), $rootScope, function(paths) {
                var tmp = _(paths).map(function(path) {

                    var pathName = path.toString();
                    if(pathName === '') {
                        pathName = '(empty path)';
                    }

                    var r = {
                        name: pathName,
                        path: path
                    };
                    return r;
                });

                $scope.active.geoPaths = tmp;
            });
            /*
            , function(err) {
                alert(err.responseText);
            });
    */
        };

        var hashToServices = {};

        var refreshServices = function(config) {
            if(!config) {
                return;
            }

            var dataCnf = config.dataService;

            var facetTreeConfig = config.facetTreeConfig;

            var serviceState = {
                url: 'cache/sparql',
                defaultGraphIris: dataCnf.defaultGraphIris,
                ajaxOptions: {},
                httpOptions: {
                    'service-uri': dataCnf.serviceIri
                }
            };

            var serviceHash = util.ObjectUtils.hashCode(serviceState);
            var services = hashToServices[serviceHash];

            if(!services) {

                services = hashToServices[serviceHash] = {};

                //alert('Service: ' + serviceHash);

                // Init Sparql Service

                sparqlService = new service.SparqlServiceHttp('cache/sparql', dataCnf.defaultGraphIris, {}, {'service-uri': dataCnf.serviceIri});
                //var sparqlService = new service.SparqlServiceHttp(dataCnf.serviceIri, dataCnf.defaultGraphIris);

                sparqlService = new service.SparqlServiceCache(sparqlService);
                sparqlService = new service.SparqlServiceVirtFix(sparqlService);
                sparqlService = new service.SparqlServicePaginate(sparqlService, 1000);
                sparqlService = new service.SparqlServicePageExpand(sparqlService, 100);

                services.sparqlService = sparqlService;


                // Init Lookup Service
                // TODO: The label map must remain dynamic
                var store = new sponate.StoreFacade(sparqlService);

                var labelMap = sponate.SponateUtils.createDefaultLabelMap();
                store.addMap(labelMap, 'labels');
                var labelsStore = store.labels;

                var lookupServiceNodeLabels = new service.LookupServiceSponate(labelsStore);
                lookupServiceNodeLabels = new service.LookupServiceChunker(lookupServiceNodeLabels, 20);
                lookupServiceNodeLabels = new service.LookupServiceIdFilter(lookupServiceNodeLabels, function(node) {
                    // TODO Using a proper URI validator would increase quality
                    var r = node && node.isUri();
                    if(r) {
                        var uri = node.getUri();
                        r = r && !_(uri).include(' ');
                        r = r && !_(uri).include('<');
                        r = r && !_(uri).include('>');
                    }
                    return r;
                });
                lookupServiceNodeLabels = new service.LookupServiceTimeout(lookupServiceNodeLabels, 20);
                lookupServiceNodeLabels = new service.LookupServiceTransform(lookupServiceNodeLabels, function(doc, id) {
                    var result = doc ? doc.displayLabel : null;

                    if(!result) {
                        if(!id) {
                            result = null; //'(null id)';
                        }
                        else if(id.isUri()) {
                            result = sponate.extractLabelFromUri(id.getUri());
                        }
                        else if(id.isLiteral()) {
                            result = '' + id.getLiteralValue();
                        }
                        else {
                            result = '' + id;
                        }
                    }

                    return result;
                });
                var lookupServiceNodeLabels = new service.LookupServiceCache(lookupServiceNodeLabels);

                services.lookupServiceNodeLabels = lookupServiceNodeLabels;


                // Init Lookup Service for Path Labels
                var lookupServicePathLabels = new service.LookupServicePathLabels(lookupServiceNodeLabels);

                services.lookupServicePathLabels = lookupServicePathLabels;

                services.lookupServiceConstraintLabels = new service.LookupServiceConstraintLabels(lookupServiceNodeLabels, lookupServicePathLabels);


                //services.tableService = new service.TableServiceFacet(services.sparqlService, tableConfigFacet, services.lookupServiceNodeLabels, services.lookupServicePathLabels, 3000, 1000);
            }
            else {
                console.log('Service reused: ', serviceHash);
            }



            $scope.active.services = services;//.sparqlService;
            //$scope.active.lookupServiceNodeLabels = lookupServiceNodeLabels;
            $scope.active.facetTreeConfig = facetTreeConfig;
            $scope.active.targetFacetTreeConfig = targetFacetTreeConfig;


            refreshFacetTables(config);
            //refreshEssentialTables();



            var mapConfig = config.mapConfig;
            //var mapFactory = config.mapFactory;



            $scope.active.dataSources = [
                createMapDataSource(sparqlService, mapConfig.mapFactory, geoConceptFactory.createConcept(), '#CC0020')
            ];
//             $scope.active.dataSources = [{
//              sparqlService: sparqlService,
//              mapFactory: mapConfig.mapFactory,
//              conceptFactory: geoConceptFactory,
//              quadTreeConfig: mapConfig.quadTreeConfig
//          }];


            updateFacetValuePath();

        };

        $scope.active.dataSources = [];

        $scope.$watch('ObjectUtils.hashCode(active.geoConceptFactory.createConcept())', function() {
            var geoConcept = $scope.active.geoConceptFactory.createConcept();
            //alert('' + geoConcept);
            var mapFactory = $scope.active.service.mapConfig.mapFactory; //$scope.active.mapFactory;
            var sparqlService = $scope.active.services.sparqlService;

            console.log('GEO CONCEPT: ', geoConcept, mapFactory, sparqlService);

            var dataSources = [];

            if(sparqlService && mapFactory && geoConcept) {
                var dataSource = createMapDataSource(sparqlService, mapFactory, geoConcept, '#CC0020')
                dataSources.push(dataSource);

                console.log('MapDataSource updated');
            }

            $scope.active.dataSources = dataSources;
        });


        $scope.setDataSource = function(item) {
            alert(JSON.stringify(item));
        };

//         $scope.$watch('dataSourceSelection.active', function(val) {
//          alert(JSON.stringify(val));
//         });

        $scope.ObjectUtils = util.ObjectUtils;


        //$scope.$watch('ObjectUtils.hashCode(facetTreeConfig)', function() {
        //$scope.$watch('ObjectUtils.hashCode(active.service)', function() {

        // Important: We should only refresh the services if the *reference* to
        // the config object changes - it doesn't make sense to refresh if an internal config
        // parameter changes, as we would keep refreshing
        $scope.$watch('active.service', function() {
            var config = $scope.active.service;
            if(config) {
                refreshServices(config);
                refresh(config);
            }
        });



        $scope.$watch('ObjectUtils.hashCode(active.targetFacetTreeConfig)', function() {
            var sourceConceptFactory = new facete.ConceptFactoryFacetTreeConfig(facetTreeConfig);
            var sourceConcept = sourceConceptFactory.createConcept();

            var targetConceptFactory = new facete.ConceptFactoryFacetTreeConfig(targetFacetTreeConfig);
            var targetConcept = targetConceptFactory.createConcept();

            findConceptPaths(sourceConcept, targetConcept).then(function(tmp) {
                $scope.active.targetGeoPaths = tmp;
            });

        });

        //active.allTableConfigFacet
        //active.services.sparqlService
        //$scope.$watch('ObjectUtils.hashCode(active.allTableConfigFacet)', function(n, o) {
//      $scope.$watch('active.allTableConfigFacet', function(n, o) {
//          //console.log('Service changed [old]', o);
//          console.log('Service changed [now]', n);
//          debugger;
//      });

        $scope.$watch('ObjectUtils.hashCode(active.facetTreeConfig)', function() {
            var config = $scope.active.service;
            if(config) {
                refresh(config);
            }
        }, true);




        var serviceConfigs = $scope.active.serviceConfigs
        $scope.active.service = serviceConfigs.length === 0 ? null : serviceConfigs[0];




        $scope.selectFacet = function(path) {
            $scope.active.path = path;
        };


        var updateFacetValuePath = function() {
            var active = $scope.active;
            var services = active ? active.services : null;

            var path = active.path;

            if(!path || !services || !services.lookupServicePathLabels) {
                return;
            }


            var promise = services.lookupServicePathLabels.lookup([path]);

            sponate.angular.bridgePromise(promise, $q.defer(), $scope, function(map) {
                active.pathLabel = map.get(path);
            });
        };

        $scope.$watch('active.path', function() {
            updateFacetValuePath();
        });


        $scope.selectTargetFacet = function(path) {
            $scope.active.targetPath = path;
        };

        $scope.selectGeom = function(data) {
            console.log('Data selected: ', data);

            var geoConceptFactory = data.config.conceptFactory;

            var geoConcept = geoConceptFactory.createConcept();
            var vs = geoConcept.getVar();
            var rootVar = geoConceptFactory.getFacetTreeConfig().getFacetConfig().getBaseConcept().getVar();


            //alert('Select: ' + JSON.stringify(data));
            var node = data.id;
            var ev = new sparql.ExprVar(vs);
            var nodeValue = sparql.NodeValue.makeNode(node);
            var expr = new sparql.E_Equals(ev, nodeValue);
            var elementFilter = new sparql.ElementFilter(expr);

            var elements = geoConcept.getElements().slice(0);
            elements.push(elementFilter);


            var concept = facete.Concept.createFromElements(elements, rootVar);

            //alert('SelectConcept: ' + concept);

            filterConceptFactory.setConcept(concept);

            if(!$scope.$$phase) {
                $scope.$apply();
            }
        }

        $scope.unselectGeom = function(data) {
            //alert('Unselect: ' + JSON.stringify(data));
            filterConceptFactory.setConcept(conceptFalse);
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        }



        $scope.nextConceptSpaceId = 1;
        $scope.conceptSpaces = [];


        $scope.addConceptSpace = function() {
            var conceptSpaceId = '' + ($scope.nextConceptSpaceId++);

            var conceptSpaceName = 'concept-' + conceptSpaceId;

            if(conceptSpaceId === '1') {
                conceptSpaceName = 'Hotels @ DBpedia';
            }

            if(conceptSpaceId === '2') {
                conceptSpaceName = 'Hotels @ Wikimapia';
            }

            if(conceptSpaceId === '3') {
                conceptSpaceName = 'Airports @ Freebase';
            }

            var config = {
                id: conceptSpaceId,
                name: conceptSpaceName
            };

            $scope.conceptSpaces.push(config);
        };

        $scope.selectConceptSpace = function(index) {
            _($scope.conceptSpaces).each(function(conceptSpace) {
                conceptSpace.active = false;
            });

            $scope.conceptSpaces[index].active = true;
        };

        $scope.removeConceptSpace = function(index) {
            $scope.conceptSpaces.splice(index, 1);
        };


        $scope.searchResults = [];

        $scope.doSearch = function(searchString) {
            $scope.app.search.show = true;
            $scope.app.search.isOpen = true;

            var ajaxSpec = {
                crossDomain: true,
                url: 'http://nominatim.openstreetmap.org/search/',
                dataType: 'json',
                traditional: 'true',
                data: {
                    format: 'json',
                    q: searchString
                }
            };

            var promise = jQuery.ajax(ajaxSpec).pipe(function(items) {
                _(items).each(function(item) {
                    var nameParts = item.display_name.split(',');

                    item.primaryName = nameParts[0];
                    item.description = nameParts[1];
                });

                return items;
            });

            sponate.angular.bridgePromise(promise, $q.defer(), $rootScope, function(data) {
                $scope.searchResults = data;
            });
        };

        $scope.active.mapConfig = {};

        $scope.selectSearchResult = function(item) {
            $scope.active.mapConfig.center = {lon: item.lon, lat: item.lat},
            $scope.active.mapConfig.zoom = 13;
        };


        $scope.notifications = [];



        var applyRootScope = function(scope) {
            var rootScope = scope.$root;

            if(!rootScope.$$phase) {
                rootScope.$apply()
            }
        };



        var metaPrefixes = {
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'batch': 'http://ns.aksw.org/spring/batch/'
        };
        var metaSparqlService = new service.SparqlServiceHttp('api/export-status/sparql', []);
        var metaStore = new sponate.StoreFacade(metaSparqlService, metaPrefixes);

        metaStore.addMap({
            name: 'sparqlExports',
            template: [{
                id: '?je',
                context: '?jec',
                exitCode: '?jeec',
                status: '?jes',
                steps: [{
                    id: '?se',
                    label: '?sel',
                    context: '?sec'
                }]
            }],
            from:
'{ Select ?je ?jeec ?jes ?jec ?se ?sel ?sec {\
  ?je\
    a batch:JobExecution ;\
    batch:exitCode ?jeec ;\
    batch:status ?jes ;\
    batch:shortContext ?jec ;\
    batch:stepExecution ?se .\
\
  ?se\
    rdfs:label ?sel ;\
    batch:shortContext ?sec .\
} }'
        });


        /**
         * Index the map of a spring batch object
         */
        var indexBatchMap = function(map) {
            var result;
            var entry = map ? map.entry : null;

            if(!entry) {
                result = {};
            }
            else if(_(entry).isArray()) {
                result = _(entry).indexBy('string');
            }
            else {
                result = {};
                var key = entry['string'];
                result[key] = entry;
            }

            return result;
        }


        var processJobStatus = function(item) {
            var jobContext = JSON.parse(item.context);

            var jobMap = indexBatchMap(jobContext.map);
            console.log(jobMap);

            var tmp = jobMap['DataCountTasklet.count'];
            var countStr = tmp ? tmp['long'] : null;


            var maxItemCount = countStr != null ? parseInt(countStr) : null;
            var itemCount = 0;

            _(item.steps).each(function(step) {
                if(step.label === 'dataFetchStep') {
                    var stepContext = JSON.parse(step.context);
                    var stepMap = indexBatchMap(stepContext.map);

                    itemCount = parseInt(stepMap['FlatFileItemWriter.written']['long']);
                }
            });

            var isRunning = item.status !== 'STOPPED' && item.status !== 'COMPLETED' && item.status !== 'FAILED';

            var result = {
                id: item.id.slice(1, -1),
                isRunning: isRunning,
                isCounting: isRunning && maxItemCount == null,
                isRetrieving: isRunning && maxItemCount != null,
                isFinished: !isRunning,
                isFailed: !isRunning && item.exitCode !== 'COMPLETED',
                isSucceeded: !isRunning && item.exitCode === 'COMPLETED',
                progress: {
                    current: itemCount,
                    max: maxItemCount,
                    percentage: (maxItemCount != null) ? Math.floor(itemCount / maxItemCount * 100) : 0
                }
            };

            //alert(JSON.stringify(result));


            return result;
        };


        var watchExport = function(jobExecutionUri, status) {
            var v = rdf.NodeFactory.createVar('je');
            var elementFilter = new sparql.ElementFilter(new sparql.E_Equals(new sparql.ExprVar(v), sparql.NodeValue.makeNode(rdf.NodeFactory.createUri(jobExecutionUri))));

            var element = new sparql.ElementGroup([
                new sparql.ElementTriplesBlock([
                    new rdf.Triple(v, rdf.NodeFactory.createVar('ppp'), rdf.NodeFactory.createVar('ooo'))
                ]),
                elementFilter
            ]);

            var concept = new facete.Concept(element, v);

            var promise = metaStore.sparqlExports.find().concept(concept).asList();
            promise.done(function(data) {

                var item = data[0];

                //alert('yay' + JSON.stringify(item));

                var jobStatus = processJobStatus(item);

                status.jobStatus = jobStatus;
                applyRootScope($scope);

                console.log('Still alive: ', jobStatus.isRunning);

                if(jobStatus.isRunning) {
                    setTimeout(function() {
                        watchExport(jobExecutionUri, status);
                    }, 3000);
                }

            }).fail(function() {
                alert('fail');
            });
        };

        $scope.exportQuery = function(query) {
            //var queryFactory = $scope.active.allTableConfigFacet.queryFactory;
            //var query = queryFactory.createQuery();
            //alert('' + query);

            var status = {
                msg: 'Export started.'
            };

            $scope.notifications.push(status);
                //applyRootScope($scope);


            var config = $scope.active.service;

            var promise = jQuery.ajax({
                url: 'api/export/start',
                traditional: true,
                data: {
                    'service-uri': config.dataService.serviceIri,
                    'default-graph-uri': config.dataService.defaultGraphIris,
                    query: '' + query
                }
            });

            promise.done(function(data) {
                //$scope.notifications.push({msg: 'Export successfully started: ' + data.id});
                status.msg = 'Export successfully started: ' + data.id;
                applyRootScope($scope);

                watchExport(data.id, status);

            }).fail(function() {
                status.msg = 'Export failed: '; // + data.id;
                applyRootScope($scope);
            });
        };


        var refreshFacetTables = function(config) {
            // Input: facetTreeConfig, config.tableConfigFacet,


            /*
             * <- Facet Tree 'Link-Facet-To-Table' Plugin
             */

            // TODO This could be written with function composition rather than objects
            // But for this we would first have to convert the factories to operations on functions
            var facetTreeConfig = $scope.active.facetTreeConfig;
            var conceptFactory = new facete.ConceptFactoryFacetTreeConfig(facetTreeConfig);

            var facetConfig = facetTreeConfig.getFacetConfig();

            var facetConceptFactory = new facete.ConceptFactoryFacetTreeConfig(facetTreeConfig);
            var facetElementFactory = new facete.ElementFactoryConceptFactory(facetConceptFactory);


            var tableConfigFacet = config.tableConfigFacet;
            var tableMod = tableConfigFacet.getTableMod();

            /*
            var testFunction = function() {
                var dataConcept = this.tableConfigFacet.createDataConcept();
                var dataElement = dataConcept.getElement();
                var filter
            }
            */

            var dataConceptFactory = new ConceptFactoryTableConfigFacet(tableConfigFacet);
            var dataElementFactory = new facete.ElementFactoryConceptFactory(dataConceptFactory);
            var filterElementFactory = new facete.ElementFactoryConceptFactory(filterConceptFactory);

            var services = $scope.active.services;





            var createTableConfig = function(queryFactory, tableConfigFacet, tableMod) {
                return {
                    tableServiceSupplier: function(config) {
                        var query = config.query;
                        var tableService = new service.TableServiceQuery(sparqlService, query);
                        var result = new service.TableServiceFacet(tableService, tableConfigFacet, services.lookupServiceNodeLabels, services.lookupServicePathLabels);

                        return result;
                    },
                    configSupplier: function() {
                        var r = {
                            query: queryFactory.createQuery(),
                            tableConfigFacet: tableConfigFacet
                        };
                        return r;
                    },
                    tableMod: tableMod,
                    cellRendererSupplier: function() {
                        console.log('ARGH', this);

                        var html =
                            '<span title="{{cell.node.toString()}}" ng-bind-html="cell.displayLabel"></span>' +
                            '<span style="cursor: pointer;" ng-context-menu="context.menuOptions" class="show-on-hover-child glyphicon glyphicon-asterisk"></span>';

                        return html;
                    }
                }
            };

            var allElementFactory = new sparql.ElementFactoryCombine(true, [dataElementFactory, facetElementFactory]);
            var allQueryFactory = new facete.QueryFactoryTableMod(allElementFactory, tableMod);






            $scope.active.tableFacetAll = createTableConfig(allQueryFactory, tableConfigFacet, tableMod);


            // NOTE We assume the data and filter concept share the same variables
            var selectionElementFactory = new sparql.ElementFactoryCombine(true, [dataElementFactory, filterElementFactory]);
            var selectionQueryFactory = new facete.QueryFactoryTableMod(selectionElementFactory, tableMod);

            $scope.active.tableFacetSelection = createTableConfig(selectionQueryFactory, tableConfigFacet, tableMod);




            var createEssentialTableConfig = function(dataElementFactory, filterConceptFactory, tableMod) {

                var filterElementFactory = new facete.ElementFactoryConceptFactory(filterConceptFactory);

                var elementFactory = new sparql.ElementFactoryCombine(true, [dataElementFactory, filterElementFactory]);
                var queryFactory = new facete.QueryFactoryTableMod(elementFactory, tableMod);


                var result = {
                    tableServiceSupplier: function(config) {
                        var query = config.query;
                        var tableService = new service.TableServiceQuery(sparqlService, query);
                        tableService = new service.TableServiceNodeLabels(tableService, services.lookupServiceNodeLabels);

                        //var result = new service.TableServiceFacet(tableService, tableConfigFacet, services.lookupServiceNodeLabels, services.lookupServicePathLabels);

                        return tableService;
                    },
                    configSupplier: function() {
                        var r = {
                            query: queryFactory.createQuery(),
                        };

                        console.log('ESSENTIAL QUERY' + r.query);
                        //alert('' + r.query);

                        return r;
                    },
                    tableMod: tableMod,
                    cellRendererSupplier: function() {

                        var html =
                            '<span title="{{cell.node.toString()}}" ng-bind-html="cell.displayLabel"></span>' +
                            '<span style="cursor: pointer;" ng-context-menu="context.menuOptions" class="show-on-hover-child glyphicon glyphicon-asterisk"></span>';

                        return html;
                    }
                };

                return result;
            };

         var varMap = new util.HashMap();
         var vs = rdf.NodeFactory.createVar('s');
         var viu = rdf.NodeFactory.createVar('instanceUri');
         varMap.put(vs, viu);

         var tmpFilterConceptFactory = new facete.ConceptFactoryRename(filterConceptFactory, varMap);
         var tmpFacetConceptFactory = new facete.ConceptFactoryRename(facetConceptFactory, varMap);


         //var facetElementFactory = new facete.ElementFactoryConceptFactory(facetConceptFactory);

            $scope.active.tableEssentialAll = createEssentialTableConfig(essentialDataElementFactory, tmpFacetConceptFactory, essentialTableMod);
            $scope.active.tableEssentialSelection = createEssentialTableConfig(essentialDataElementFactory, tmpFilterConceptFactory, essentialTableMod);

            //console.log('DAMMIT', $scope.active.tableEssentialAll);
        };





//                var facetTreeConfig = $scope.active.facetTreeConfig;
//                var baseFacetConceptFactory = new facete.ConceptFactoryFacetTreeConfig(facetTreeConfig);

//                var facetElementFactory = new facete.ElementFactoryConceptFactory(facetConceptFactory);



        //var refreshEssentialTables = function(facetConceptFactory, filterConceptFactory) {

        /*
        var dataConcept = new facete.Concept(dataElement, rdf.NodeFactory.createVar('instanceUri'));

        //var vs = essentialElement.getVarsMentioned();
        //var varNames = sparql.VarUtils.getVarNames(vs);

//         var varMap = new util.HashMap();
//         var vs = rdf.NodeFactory.createVar('s');
//         var viu = rdf.NodeFactory.createVar('instanceUri');
//         varMap.put(vs, viu);

        var elementFactory = new sparql.ElementFactoryCombine(true, [dataElementFactory, filterElementFactory]);


        var queryFactory = new facete.QueryFactoryTableMod(elementFactory, tableMod);


        $scope.active.essentialtableConfigFacet = {
            queryFactory: queryFactory,
            tableMod: tableMod
        };


        var allElementFactory = new sparql.ElementFactoryCombine(true, [dataElementFactory, facetElementFactory]);
        var allQueryFactory = new facete.QueryFactoryTableMod(allElementFactory, tableMod);
        $scope.active.allEssentialtableConfigFacet = {
            queryFactory: allQueryFactory,
            tableMod: tableMod
        };
    };
    */


    }]);