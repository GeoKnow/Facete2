
var setDataSourceDefaults = function(record) {
    var item = record.data;
    item.id = record.id;

    var spec = {};
    spec.id = item.id;
    spec.name = item.name;
    spec.dataService = spec.dataService || {};
    spec.dataService.serviceIri = item.dataServiceIri;
    spec.dataService.defaultGraphIris = item.dataGraphIris;

    spec.dataService.auth = item.auth;

    spec.joinSummaryService = spec.joinSummaryService || {};
    spec.joinSummaryService.serviceIri = item.jsServiceIri;
    spec.joinSummaryService. defaultGraphIris = item.jsGraphIris;

    return spec;
}

var DataSourceManager = Class.create({

    initialize: function(storeApiUrl) {
        this.storeApiUrl = storeApiUrl;
    },

    loadDataSources: function() {

        var spec = {
            url: this.storeApiUrl + '/loadState',
            traditional: true,
            data: {
                type: 'dataSource'
            },
            dataType: 'json'
        };

        var result = jQuery.ajax(spec).pipe(function(response) {

            var configs = _(response).map(function(record) {
            	var spec = setDataSourceDefaults(record);
/*
            	var item = record.data;
                item.id = record.id;

                var spec = {};
                spec.id = item.id;
                spec.name = item.name;
                spec.dataService = spec.dataService || {};
                spec.dataService.serviceIri = item.dataServiceIri;
                spec.dataService.defaultGraphIris = item.dataGraphIris;

                spec.dataService.auth = item.auth;

                spec.joinSummaryService = spec.joinSummaryService || {};
                spec.joinSummaryService.serviceIri = item.jsServiceIri;
                spec.joinSummaryService. defaultGraphIris = item.jsGraphIris;
*/
                return spec;
            });
            //console.log('CONFIGS', configs);
            return configs;
        });

        return result;
    },


    deleteDataSource: function(id) {

        var spec = {
                url: this.storeApiUrl + '/deleteState',
                type: 'POST',
                traditional: true,
                data: {
                    type: 'dataSource',
                    id: id
                },
                dataType: 'json'
        };

        var result = jQuery.ajax(spec);
        return result;
    },

    addDataSource: function(spec) {
        var data = JSON.stringify(spec);

        var ajaxSpec = {
            url: this.storeApiUrl + '/saveState',
            type: 'POST',
            traditional: true,
            data: {
                type: 'dataSource',
                data: data
            },
            dataType: 'json'
        };

        var result = jQuery.ajax(ajaxSpec);
        return result;
    },

});
