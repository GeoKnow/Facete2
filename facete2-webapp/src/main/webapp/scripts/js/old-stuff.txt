/*
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
        var conceptFactory = new sparql.ConceptFactoryFacetTreeConfig(facetTreeConfig);


        var sourceConcept = conceptFactory.createConcept();
        var targetConcept = geoConcept;


        var look            upServicePathLabels = $scope.active.services.lookupServicePathLabels;



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
        */

    /**
     * Provider
     * Default behaviour:
     * none: Watch this attribute using deep equality
     * @: Watch this attribute using reference equality (or maybe use @ to denote array)
     * =: Watch this attribute using deep equality
     * []: Watch this attribute using $watchCollection
     *
     * References can override this behaviour
     *
     */
//
//    function initDdi($scope) {
//        var ddi = $ddi($scope);
//
//
//        $scope.serviceIri = 'http://dbpedia.org/sparql';
//        $scope.defaultGraphIris = ['http://dbpedia.org/sparql'];
//        //$scope.cacheProxyUrl = ''
//
//        $scope.sparqlCacheSupplier = new jassa.service.SparqlCacheSupplier();
//
//        // A function without dependencies will always be rechecked
//        ddi.register('cacheProxyUrl', function() {
//            return AppConfig.cacheProxyUrl;
//        });
//
//        // Create a cache object for the given service and graphs
//        /*
//        ddi.register('sparqlCache', [ '=serviceIri', '=defaultGraphIris',
//            function() {
//                var r = sparqlCacheSupplier.getCache(serviceIri, defaultGraphIris);
//                return r;
//            }]);
//        */
//
//        ddi.register('sparqlCache', [ '=serviceIri', '=defaultGraphIris',
//            function(serviceIri, defaultGraphIris) {
//                var r = $scope.sparqlCacheSupplier.getCache(serviceIri, defaultGraphIris);
//                return r;
//            }]);
//
//
//        // We could add a refresh function to force refresh of attributes, such as a reaction
//        // to cache invalidation
//        // Or we make a lastModified stamp for the cache and watch it
//        //ddi.refresh('sparqlService');
//
//
//        // Note: We use deep watch so that ddi will group the change listening
//        ddi.register('sparqlService', [ '=serviceIri', '=defaultGraphIris', '?=cacheProxyUrl', '?sparqlCache', 'updateTimestame',
//            function(serviceIri, defaultGraphIris, cacheProxyUrl, sparqlCache) {
//                //var cache = sparqlCacheSupplier ? sparqlCacheSupplier.getCache(serviceIri, defaultGraphIris) : null;
//
//                var base = cacheProxyUrl == null
//                    ? jassa.service.SparqlServiceBuilder.http(serviceIri, defaultGraphIris, {type: 'POST'})
//                    : jassa.service.SparqlServiceBuilder.http(cacheProxyUrl, defaultGraphIris, {type: 'POST'}, {'service-uri': serviceIri})
//                    ;
//
//                if(sparqlCache) {
//                    // TODO Reuse prior request cache?
//                    var requestCache = new jassa.service.RequestCache(null, sparqlCache);
//                    base = base.cache(requestCache);
//                }
//
//                var r = base.virtFix().paginate(1000).pageExpand(100).create();
//
//                //console.log('Sparql service', serviceIri, defaultGraphIris);
//                return r;
//            }]);
//
//
//        ddi.register('services.lookupServiceNodeLabels', [ 'services.sparqlService',
//            function(sparqlService) {
//                var r = sponate.LookupServiceUtils.createLookupServiceNodeLabels(sparqlService, 20, $scope.langs /* predicates */);
//                r = new service.LookupServiceCache(lookupServiceNodeLabels);
//                return r;
//            }]);
//
//        ddi.register('services.lookupServicePathLabels', [ 'services.lookupServiceNodeLabels',
//            function(sparqlService) {
//                var r = new facete.LookupServicePathLabels(lookupServiceNodeLabels);
//                return r;
//            }]);
//
//        // Init Lookup Service for Path Labels
//        ddi.register('services.lookupServiceConstraintLabels', [ 'services.lookupServicePathLabels',
//            function(sparqlService, lookupServicePathLabels) {
//                var r = new facete.LookupServiceConstraintLabels(lookupServiceNodeLabels, lookupServicePathLabels);
//                return r;
//            }]);
//
//
//        // Map DataSource
//        ddi.register('mapDataSource', [ 'sparqlService', 'mapFactory', 'geoConceptFactory', '?fillColor',
//            function(sparqlService, mapFactory, geoConceptFactory, fillColor) {
//            console.log('MAP DATASOURCE!');
//
//            fillColor = fillColor || '#CC0020';
//
//            var r = createMapDataSource(sparqlService, mapFactory, geoConceptFactory.createConcept(), fillColor);
//                return r;
//            }]);
//
////        // TODO How to deal with the cache
////        ddi.register('lookupServiceNodeLabels', ['=sparqlService', '=lookupChunkSize', '=langs',
////            function(sparqlService, lookupChunkSize, langs) {
////                var r = sponate.LookupServiceUtils.createLookupServiceNodeLabels(sparqlService, 20, $scope.langs /* predicates */);
////                r = new service.LookupServiceCache(r);
////
////                return r;
////            }]);
////
////        // PathLabels
////        ddi.register('pathLabels', ['lookupServiceNodeLabels',
////            function(lookupServiceNodeLabels) {
////                var r = lookupServicePathLabels = new facete.LookupServicePathLabels(lookupServiceNodeLabels);
////                r = new facete.LookupServiceConstraintLabels(lookupServiceNodeLabels, lookupServicePathLabels);
////                return r;
////            }]);
//
//
//
//        $scope.serviceIri = 'http://linkedgeodata.org/sparql';
//        $scope.defaultGraphIris = 'http://linkedgeodata.org';
//
//
//        $scope.mapFactory =jassa.geo.GeoMapFactoryUtils.wgs84MapFactory;
//        $scope.geoConceptFactory = new sparql.ConceptFactoryFacetTreeConfig(facetTreeConfig);
//
//        $timeout(function() {
//            //$scope.fillColor = '#aaaaaa';
//            //$scope.serviceIri = 'http://dbpedia.org/sparql';
//            $scope.serviceIri = 'http://linked';
//
//        }, 3000);
//    };
//
//    var testScope = $scope.$new();
//
//    initDdi(testScope);
//



    // TODO This mapping of config objects to their services sucks; a different concept such as a IoC container might help: We would then have a context of beans, and services that are instanciated against the beans
    //
    var hashToServices = {};

    var refreshServices = function(config) {
        if(!config) {
            return;
        }

        var dataCnf = config.dataService;

        var facetTreeConfig = config.facetTreeConfig;

        var serviceState = {
            url: AppConfig.cacheProxyUrl,
            defaultGraphIris: dataCnf.defaultGraphIris,
            ajaxOptions: {
                type: 'POST'
            },
            httpOptions: {
                'service-uri': dataCnf.serviceIri
            }
        };

        var serviceHash = util.ObjectUtils.hashCode(serviceState);
        var services = hashToServices[serviceHash];

        if(!services) {

            services = hashToServices[serviceHash] = {};

            // Init Sparql Service
            var sparqlService = service.SparqlServiceBuilder.http(AppConfig.cacheProxyUrl, dataCnf.defaultGraphIris, {type: 'POST'}, {'service-uri': dataCnf.serviceIri})
                .cache().virtFix().paginate(1000).pageExpand(100).create();

//            sparqlService = new service.SparqlServiceHttp('cache/sparql', dataCnf.defaultGraphIris, {}, {'service-uri': dataCnf.serviceIri});

            services.sparqlService = sparqlService;


            // Init Lookup Service
            var lookupServiceNodeLabels = sponate.LookupServiceUtils.createLookupServiceNodeLabels(sparqlService, 20, $scope.langs /* predicates */);
            lookupServiceNodeLabels = new service.LookupServiceCache(lookupServiceNodeLabels);

            services.lookupServiceNodeLabels = lookupServiceNodeLabels;


            // Init Lookup Service for Path Labels
            var lookupServicePathLabels = new facete.LookupServicePathLabels(lookupServiceNodeLabels);

            services.lookupServicePathLabels = lookupServicePathLabels;

            services.lookupServiceConstraintLabels = new facete.LookupServiceConstraintLabels(lookupServiceNodeLabels, lookupServicePathLabels);


            //services.tableService = new service.TableServiceFacet(services.sparqlService, tableConfigFacet, services.lookupServiceNodeLabels, services.lookupServicePathLabels, 3000, 1000);
        }
        else {
            console.log('Service reused: ', serviceHash);
        }


        // TODO Refactor the refreshServices function

        /*
        var refreshServices = function(config) {

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
//                 $scope.active.dataSources = [{
//                  sparqlService: sparqlService,
//                  mapFactory: mapConfig.mapFactory,
//                  conceptFactory: geoConceptFactory,
//                  quadTreeConfig: mapConfig.quadTreeConfig
//              }];


            updateFacetValuePath();

        };
    */



        // Map DataSource
        /*
        ddi.register('mapDataSource', [ 'sparqlService', 'mapFactory', 'geoConceptFactory', '?fillColor',
            function(sparqlService, mapFactory, geoConceptFactory, fillColor) {
            console.log('MAP DATASOURCE!');

            fillColor = fillColor || '#CC0020';

            var r = createMapDataSource(sparqlService, mapFactory, geoConceptFactory.createConcept(), fillColor);
                return r;
            }]);
        */




        /*


        $scope.$watch('ObjectUtils.hashCode(active.geoConceptFactory.createConcept())', function() {
            var geoConcept = $scope.active.geoConceptFactory.createConcept();
            //alert('' + geoConcept);
            var service = $scope.active.config;
            var mapConfig = service ? service.mapConfig : null;

            if(mapConfig) {
                var mapFactory = mapConfig.mapFactory; //$scope.active.mapFactory;
                var sparqlService = $scope.active.services.sparqlService;

                console.log('GEO CONCEPT: ', geoConcept, mapFactory, sparqlService);

                var dataSources = [];

                if(sparqlService && mapFactory && geoConcept) {
                    var dataSource = createMapDataSource(sparqlService, mapFactory, geoConcept, '#CC0020')
                    dataSources.push(dataSource);

                    console.log('MapDataSource updated');
                }

                $scope.active.dataSources = dataSources;
            }
        });
        */





        // TODO Below statement does not hold anymore; e.g. the active geo-vocabulary may change dynamically
        // Important: We should only refresh the services if the *reference* to
        // the config object changes - it doesn't make sense to refresh if an internal config
        // parameter changes, as we would keep refreshing
//        $scope.$watch('active.config', function() {
//            var config = $scope.active.config;
//            if(config) {
//                refreshServices(config);
//                refresh(config);
//            }
//        });
    //
//        $scope.$watch('ObjectUtils.hashCode(active.facetTreeConfig)', function() {
//            var config = $scope.active.config;
//            if(config) {
//                refresh(config);
//            }
//        }, true);


//        $scope.$watch('ObjectUtils.hashCode(active.targetFacetTreeConfig)', function() {
//            var sourceConceptFactory = new sparql.ConceptFactoryFacetTreeConfig(facetTreeConfig);
//            var sourceConcept = sourceConceptFactory.createConcept();
    //
//            var targetConceptFactory = new sparql.ConceptFactoryFacetTreeConfig(targetFacetTreeConfig);
//            var targetConcept = targetConceptFactory.createConcept();
    //
//            findConceptPaths(sourceConcept, targetConcept).then(function(tmp) {
//                $scope.active.targetGeoPaths = tmp;
//            });
    //
//        });


        /*
        $scope.$watch('active.path', function() {
            updateFacetValuePath();
        });
        */



    /*
        $scope.$watchCollection('[active.service.mapConfig.mapFactory, active.service.mapConfig.geoConcept]', function() {
            var config = $scope.active.service;
            if(config) {
                refreshServices(config);
                refresh(config);
            }
        });
    */



        /*
        var updateFacetValuePath = function() {
            var active = $scope.active;
            var services = active ? active.services : null;

            var path = active.path;

            if(!path || !services || !services.lookupServicePathLabels) {
                return;
            }


            var promise = services.lookupServicePathLabels.lookup([path]);

            $q.when(promise).then(function(map) {//sponate.angular.bridgePromise(promise, $q.defer(), $scope, function(map) {
                active.pathLabel = map.get(path);
            });
        };
        */


        //
//            var geoConcept = config.mapConfig.geoConcept;
        //
//            var conceptPathFinder = new client.ConceptPathFinderApi(conceptPathFinderApiUrl, sparqlServiceIri, defaultGraphIris, joinSummaryServiceIri, joinSummaryDefaultGraphIris);
//            $scope.active.conceptPathFinder = conceptPathFinder;
        //
//            var facetTreeConfig = config.facetTreeConfig;
//            var facetTreeConfig = config.facetTreeConfig;
//            var conceptFactory = new sparql.ConceptFactoryFacetTreeConfig(facetTreeConfig);
        //
        //
//            var sourceConcept = conceptFactory.createConcept();
//            var targetConcept = geoConcept;
        //

