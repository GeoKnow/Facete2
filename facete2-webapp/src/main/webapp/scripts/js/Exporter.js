var Exporter = Class.create({
    initialize: function(apiUrl, sparqlServiceIri, defaultGraphIris) {
        this.apiUrl = apiUrl;
        this.sparqlServiceIri = sparqlServiceIri;
        this.defaultGraphIris = defaultGraphIris;
    },

    exportQuery: function(query) {//, varNameToHeading) {

        var ajaxSpec = {
            url: this.apiUrl,
            type: 'POST',
            traditional: true,
            data: {
                'service-uri': this.sparqlServiceIri,
                'default-graph-uri': this.defaultGraphIris,
                query: '' + query
                //varNameToHeading: varNameToHeading
            }
        };

//        if(varMapStr) {
//            ajaxSpec.data.rename = JSON.stringify(varMapStr);
//        }

        var result = jQuery.ajax(ajaxSpec);

        return result;
    },

});
