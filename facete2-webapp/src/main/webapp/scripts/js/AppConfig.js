var AppConfig = {

    storeApiUrl: 'api/store',
    exportApiUrl: 'api/export/start',
    pathFindingApiUrl: 'api/path-finding',
    sparqlProxyUrl: 'cache/sparql',

    batch: {
        prefixes: {
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'batch': 'http://ns.aksw.org/spring/batch/'
        }
    },

    geoModes: [{
            label: 'WGS84 with numeric coordinates',
            value: {
                mapFactory: jassa.geo.GeoMapFactoryUtils.wgs84CastMapFactory,
                geoConcept: jassa.geo.GeoConceptUtils.conceptWgs84
            }
        }, {
            label: 'WGS84 with string and/or numeric coordinates',
            value: {
                mapFactory: jassa.geo.GeoMapFactoryUtils.wgs84MapFactory,
                geoConcept: jassa.geo.GeoConceptUtils.conceptWgs84
            }
        }, {
            label: 'Standard GeoSPARQL vocabulary',
            value: {
                mapFactory: jassa.geo.GeoMapFactoryUtils.geosparqlMapFactory,
                geoConcept: jassa.geo.GeoConceptUtils.conceptGeoVocab
            }
        }, {
            label: 'Virtuoso GeoSPARQL dialect',
            value: {
                mapFactory: jassa.geo.GeoMapFactoryUtils.ogcVirtMapFactory,
                geoConcept: jassa.geo.GeoConceptUtils.conceptGeoVocab
            }
        }, {
            label: 'Schema.org lat/long with numeric coordinates',
            value: {
                mapFactory: jassa.geo.GeoMapFactoryUtils.createXyMapFactory('http://schema.org/longitude', 'http://schema.org/latitude', false),
            }
        }, {
            label: 'Schema.org lat/long with string and/or numeric coordinates',
            value: {
                mapFactory: jassa.geo.GeoMapFactoryUtils.createXyMapFactory('http://schema.org/longitude', 'http://schema.org/latitude', true),
            }
        }],

    resizableConfig: {
        enabled: {
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
        },

        disabled: {
            handles: 'none', disabled: true
        },
    },

    ui: {
        processes: {
            isOpen: false
        },
        problems: {
            isOpen: false
        },
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
    },

    edit: {
        createDefaults: function() {
            var r = {
                id: null,
                name: '',
                dataServiceIri: '',
                dataGraphIris: [],
                jsServiceIri: '',
                jsGraphIris: [],
                auth: {
                    type: 'AUTH_NONE'
                }
            };

            return r;
        }
    },

    tableConfig: {
        createMenuOptions: function($ctrlScope) {

            var s = function($scope) {

                var r = [];

                var item = $scope.cell;
                var node = item ? item.node : null;

                var isUri = node && node.isUri && node.isUri();
                if(isUri) {
                    r.push({
                        //html: '<a href="' + node.getUri() + '">Show resource in new Browser Tab<a/>',
                        text: 'Show resource in new browser tab',
                        linkAttrs: {
                            href: node.getUri(),
                            target: '_blank'
                        }
                    });
                }

                r.push({
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

                r.push({
                    text: 'Toggle constraint from this value',
                    callback: function($itemScope) {
                        var facetTreeConfig = $ctrlScope.active.config.facetTreeConfig;

                        var constraint = new facete.ConstraintEquals(path, node);
                        facetTreeConfig.getFacetConfig().getConstraintManager().toggleConstraint(constraint);
                    }
                });

                if(isUri && $ctrlScope.experimental) {
                    r.push({
                        text: 'Show in editor',
                        callback: function($itemScope) {
                            $ctrlScope.editResource = node.getUri();
                            $ctrlScope.$location.path('/edit');
                        }
                    });
                }

                return r;
            };

            return s;
        }
    }

};

/**
 * Initialize authenticators of the AppConfig
 */

angular.module('Facete2')
.run(['$base64', function($base64) {
    AppConfig.authenticators = {
        ids: ['AUTH_NONE', 'AUTH_HTTP_BASIC'],
        defs: {
            'AUTH_NONE': {
            },
            'AUTH_HTTP_BASIC': {
                template: 'partials/auth/http-basic.html',
                createAjaxSpecModifier: function(auth) {
                    var r = function(ajaxSpec) {

                        ajaxSpec.headers = ajaxSpec.headers || {};
                        // might switch to plain btoa at some point
                        var rawStr = auth.username + ':' + auth.password;
                        var base64 = $base64.encode(rawStr);

                        ajaxSpec.headers.Authorization = 'Basic ' + base64;
                    };
                    return r;
                }
            }
        }
    };
}])

;

