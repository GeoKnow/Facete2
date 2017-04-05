var NodeUtils = NodeUtils || {};
NodeUtils.asNullableUri = function(uri) {
    var result = uri == null ? null : jassa.rdf.NodeFactory.createUri(uri);
    return result;
};




var ChangeSetUtils = {

    createFilterConcept: function(subjectUri, serviceUri, graphUri) {
        var subject = NodeUtils.asNullableUri(subjectUri);
        var service = NodeUtils.asNullableUri(serviceUri);
        var graph = NodeUtils.asNullableUri(graphUri);

        var triples = [];
        var vs = jassa.sparql.VarUtils.s;

        if(subject != null) {
            triples.push(new jassa.rdf.Triple(vs, jassa.vocab.cs.subjectOfChange, subject));
        }

        if(service != null) {
            triples.push(new jassa.rdf.Triple(vs, jassa.vocab.cs.service, service));
        }

        if(graph != null) {
            triples.push(new jassa.rdf.Triple(vs, jassa.vocab.cs.graph, graph));
        }

        var element = new jassa.sparql.ElementTriplesBlock(triples);
        var result = new jassa.sparql.Concept(element, vs);
        return result;
    },

    createListService: function(sparqlService) {

        var store = new jassa.sponate.StoreFacade(sparqlService, {
            cs: 'http://purl.org/vocab/changeset/schema#',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
        });

        store.addMap({
            name: 'changeSetAdditions',
            template: [{
                id: '?x',
                triples: [{
                    id: '?y',
                    s: '?s | node',
                    p: '?p | node',
                    o: '?o | node'
                }]
            }],
            from: '?x cs:addition ?y . ?y rdf:subject ?s ; rdf:predicate ?p ; rdf:object ?o'
        });

        // TODO If we had support for a 'via' attribute, we could ditch the addition/removal queries
        // via would take a relation specification as its argument
        //additionGraph: [{ $ref: { target: 'triples', on: '?s', via: 'cs:addition' } }, tripleContainerToGraph],

        store.addMap({
            name: 'changeSetRemovals',
            template: [{
                id: '?x',
                triples: [{
                    id: '?y',
                    s: '?s | node',
                    p: '?p | node',
                    o: '?o | node'
                }]
            }],
            from: '?x cs:removal ?y . ?y rdf:subject ?s ; rdf:predicate ?p ; rdf:object ?o'
        });

        var queryStr = 'SELECT * { '
            + '?s a cs:ChangeSet '
            + 'OPTIONAL { ?s cs:subjectOfChange ?sub } '
            + 'OPTIONAL { ?s cs:changeReason ?r } '
            + 'OPTIONAL { ?s cs:createdDate ?cd } '
            + 'OPTIONAL { ?s cs:creatorName ?cn } '
            + 'OPTIONAL { ?s cs:service ?cs } '
            + 'OPTIONAL { ?s cs:graph ?cg } '
            + 'OPTIONAL { ?s cs:precedingChangeset ?pre } '
            + '} ORDER BY DESC(?cd)'
            //+ 'Optional { ?s cs:addition ?add } '
            //+ 'Optional { ?s cs:removal ?rem } '
            ;

        var tripleContainerToGraph = function(obj) {
            var result = new jassa.rdf.GraphImpl();
            if(obj != null) {
                obj.triples.forEach(function(item) {
                    var triple = new jassa.rdf.Triple(item.s, item.p, item.o);
                    result.add(triple);
                });
            }
            return result;
        };


        store.addMap({
            name: 'changeset',
            template: [{
                id: '?s',
                subjectOfChange: '?sub', //>cs:subjectOfChange
                precedingChangeset: '?pre',
                changeReason: '?r',
                createdDate: '?cd',
                age: ['?cd', function(str) { return moment(str).fromNow(); }],
                creatorName: '?cn',
                service: '?cs',
                graph: '?cg',
                additionGraph: [{ $ref: { target: 'changeSetAdditions', on: '?s' } }, tripleContainerToGraph],
                removalGraph: [{ $ref: { target: 'changeSetRemovals', on: '?s' } }, tripleContainerToGraph]
            }],
            from: queryStr
        });

        var result = store.changeset.getListService();
        return result;
    },

    //createCo

    /**
     * If the graph is null, an empty array is returned.
     */
    graphToChangesetTriples: function(graph) {
        var result;
        if(!graph) {
            result = [];
        } else {
            result = graph.map(function(triple) {
                var r = {
                    subject: '' + triple.getSubject(),
                    predicate: '' + triple.getPredicate(),
                    'object': '' + triple.getObject()
                };
                return r;
            });
        }
        return result;
    },

    diffToChangesets: function(diff) {
        var subjectToAdditions = jassa.rdf.GraphUtils.indexBySubject(diff.added);
        var subjectToRemovals = jassa.rdf.GraphUtils.indexBySubject(diff.removed);

        var subjects = new jassa.util.HashSet();
        subjects.addAll(subjectToAdditions.keys());
        subjects.addAll(subjectToRemovals.keys());

        var result = subjects.map(function(subject) {
            var r = {
                'subject': '' + subject,
                'additions': ChangesetUtils.graphToChangesetTriples(subjectToAdditions.get(subject)),
                'removals': ChangesetUtils.graphToChangesetTriples(subjectToAdditions.get(subject)),
            };
            return r;
        });

        return result;
    }
};
