var Exporter = Class.create({
    initialize: function(apiUrl, sparqlServiceIri, defaultGraphIris) {
        this.apiUrl = apiUrl;
        this.sparqlServiceIri = sparqlServiceIri;
        this.defaultGraphIris = defaultGraphIris;
    },

    exportQuery: function(query) {

        var result = jQuery.ajax({
            url: this.apiUrl,
            traditional: true,
            data: {
                'service-uri': this.sparqlServiceIri,
                'default-graph-uri': this.defaultGraphIris,
                query: '' + query
            }
        });

        return result;
    },

});
