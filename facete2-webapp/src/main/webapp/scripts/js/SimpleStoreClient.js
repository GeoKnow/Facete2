var SimpleStoreClient = Class.create({

    initialize: function(storeApiUrl) {
        this.storeApiUrl = storeApiUrl;
    },

    load: function(type, id) {

        var spec = {
            url: this.storeApiUrl + '/loadState',
            traditional: true,
            data: {
                type: type,
                id: id
            },
            dataType: 'json'
        };

//        if(id) {
//        	spec.data.id = id;
//        }
        
        var result = jQuery.ajax(spec);
//        .pipe(function(response) {
//
//            var configs = _(response).map(function(record) {
//                var item = record.data;
//                item.id = record.id;
//
//                var spec = {};
//                spec.id = item.id;
//                spec.name = item.name;
//                spec.dataService = spec.dataService || {};
//                spec.dataService.serviceIri = item.dataServiceIri;
//                spec.dataService.defaultGraphIris = item.dataGraphIris;
//
//                spec.dataService.auth = item.auth;
//
//                spec.joinSummaryService = spec.joinSummaryService || {};
//                spec.joinSummaryService.serviceIri = item.jsServiceIri;
//                spec.joinSummaryService. defaultGraphIris = item.jsGraphIris;
//
//                return spec;
//            });
            //console.log('CONFIGS', configs);
//            return configs;
//        });

        return result;
    },


    remove: function(type, id) {

        var spec = {
                url: this.storeApiUrl + '/deleteState',
                type: 'POST',
                traditional: true,
                data: {
                    type: type,
                    id: id
                },
                dataType: 'json'
        };

        var result = jQuery.ajax(spec);
        return result;
    },

    store: function(type, spec) {
        var data = JSON.stringify(spec);

        var ajaxSpec = {
            url: this.storeApiUrl + '/saveState',
            type: 'POST',
            traditional: true,
            data: {
                type: type,
                data: data
            },
            dataType: 'json'
        };

        var result = jQuery.ajax(ajaxSpec);
        return result;
    },

});