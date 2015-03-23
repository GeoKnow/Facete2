var CannedQueryUtils = {

    createQueryMaterializeProperties: function() {
        //'From <http://geoknow.eu/wp5/avi_fbr/>'
        var intoPart = '';
        var fromPart = '';

        var result
            = 'Sparql Insert ' + intoPart + '{'
            + '?p a <http://www.w3.org/1999/02/22-rdf-syntax-ns#Property> .'
            + '}'
            + fromPart
            + '{'
            + '  { Select Distinct ?p {'
            + '    ?s ?p ?o'
            + '  }  }'
            + '}'
            ;

        return result;
    }

        /*
        Sparql Insert Into <http://geoknow.eu/wp5/avi_fbr/> {
            ?p a <http://www.w3.org/1999/02/22-rdf-syntax-ns#Property> .
        }
        From <http://geoknow.eu/wp5/avi_fbr/>
        {
          { Select Distinct ?p {
            ?s ?p ?o
          } }
        }
        */
};