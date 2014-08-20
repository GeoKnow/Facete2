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

var myModule = angular.module('Facete2');
myModule.controller('FaceteAppCtrl', ['$scope', '$q', '$rootScope', function($scope, $q, $rootScope) {

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

    $scope.$watch('app.data.isOpen', function(state) {
        $scope.resizableConfig = state ?
            AppConfig.resizableConfig.enabled :
            AppConfig.resizableConfig.disabled;
    });

    $scope.edit = {
        id: null,
        dataServiceIri: '',
        dataGraphIris: '',
        jsServiceIri: '',
        jsGraphIris: ''
    };

    var tableConfigFacet; // Initialized later - TODO Fix the order

    var applyScope = function() {
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    };

    /* Data Sources */

    var dataSourceManager = new DataSourceManager(AppConfig.storeApiUrl);
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

    var refreshDataSources = function() {
        dataSourceManager.loadDataSources().then(function(configs) {
            _(configs).each(function(config) {
                var defaults = createDefaultWorkspaceConfig();
                console.log('Config', config);
                _(config).defaults(defaults);
            });
            $scope.active.serviceConfigs = configs;
            applyScope();
        }).fail(function() {
            alert('Failed to retrieve data sources');
        });
    };

    $scope.deleteDataSource = function(id) {
        var c = confirm('Delete dataset with id ' + id + '?');
        if(!c) {
            return;
        }

        dataSourceManager.deleteDataSource(id)
            .then(function() {
                refreshDataSources();
            })
            .fail(function() {
                alert('Failed to delete data source with id ' + id);
            });
    };

    $scope.addDataSource = function() {
        var spec = _($scope.edit).clone();

        // Fix the spec by post processing the attributes
        spec.dataGraphIris = spec.dataGraphIris.match(/\S+/g);
        spec.jsGraphIris = spec.jsGraphIris.match(/\S+/g);

        dataSourceManager.addDataSource(spec)
            .then(function() {
                // Hide data source creation dialog
                $scope.app.dataSources.showAddDialog=false
                refreshDataSources();
            }).fail(function() {
                alert('Failed to store data');
            });
    };


    /* Geo Link Setup */

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


    var essentialDataElement = sparql.ElementString.create(CannedQueries.essentialDataElementStr);
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
            if(tableConfigFacet) {
                tableConfigFacet.togglePath(path);
            }

        }
    };


    $scope.facetTreePlugins = [
        '<a style="margin-left: 5px; margin-right: 5px;" ng-class="!data.isExpanded ? \'hide\' : { \'show-on-hover-child\': !data.item.getTags().controls.isContained }" href="" ng-click="context.toggleControls(data.item.getPath())"><span class="glyphicon glyphicon-cog"></span></a>',
        '<a style="margin-left: 5px; margin-right: 5px;" ng-class="{ \'show-on-hover-child\': !data.item.getTags().table.isContained }" href="" ng-click="context.toggleTableLink(data.item.getPath())"><span class="glyphicon glyphicon-list-alt"></span></a>'
    ];

//    $scope.facetTreePlugins = [
//                               '<a style="margin-left: 5px; margin-right: 5px;" ng-show="data.isExpanded && (data.isHovered || data.item.getTags().controls.isContained)" href="" ng-click="context.toggleControls(data.item.getPath())"><span class="glyphicon glyphicon-cog"></span></a>',
//                               '<a style="margin-left: 5px; margin-right: 5px;" ng-show="data.isHovered || data.item.getTags().table.isContained" href="" ng-click="context.toggleTableLink(data.item.getPath())"><span class="glyphicon glyphicon-list-alt"></span></a>'
//                           ];




    $scope.active.services.sparqlService = new service.SparqlServiceDummy();
    $scope.active.geoConceptFactory = geoConceptFactory;



    refreshDataSources();

    $scope.active.serviceConfigs = [];


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

            // Init Sparql Service
            sparqlService = new service.SparqlServiceHttp('cache/sparql', dataCnf.defaultGraphIris, {}, {'service-uri': dataCnf.serviceIri});
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


    $scope.ObjectUtils = util.ObjectUtils;



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
        from: '{' + CannedQueries.jobExecutionStatus + '}'
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
        var ds = $scope.active.service.dataService;

        var status = {
            msg: 'Export started.'
        };

        $scope.notifications.push(status);

        var exporter = new Exporter(AppConfig.exportApiUrl, ds.serviceIri, ds.defaultGraphIris);

        exporter.exportQuery(query).then(function(data) {
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

        $scope.active.tableEssentialAll = createEssentialTableConfig(essentialDataElementFactory, tmpFacetConceptFactory, essentialTableMod);
        $scope.active.tableEssentialSelection = createEssentialTableConfig(essentialDataElementFactory, tmpFilterConceptFactory, essentialTableMod);
    };

}]);
