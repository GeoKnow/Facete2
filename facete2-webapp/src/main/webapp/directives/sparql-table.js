angular.module('Facete2')

.controller('SparqlTableCtrl', ['$scope', '$rootScope', '$q', function($scope, $rootScope, $q) {

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
    };

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

}])

.directive('sparqlTable', [function() {
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
}])

;
