var ChangeSetUtils = {

    createListService: function(sparqlService) {

        var store = new jassa.sponate.Store({
            cs: 'http://purl.org/vocab/changeset/schema#',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
        });


        store.addMap({
            name: 'triple',
            template: [{
                id: '?x',
                subject: '?s | node',
                predicate: '?p | node',
                'object': '?o | node'
            }],
            from: '?x rdf:subject ?s ; rdf:predicate ?p ; rdf:object ?o'
        });

        var queryStr = '?s a cs:ChangeSet '
            + 'Optional { ?s cs:subjectOfChange ?sub } '
            + 'Optional { ?s cs:changeReason ?r } '
            + 'Optional { ?s cs:createdDate ?r } '
            + 'Optional { ?s cs:creatorName ?n } '
            + 'Optional { ?s cs:precedingChangeset ?pre } '
            + 'Optional { ?s cs:addition ?add } '
            + 'Optional { ?s cs:removal ?rem } '
            ;

        store.addMap({
            name: 'changeset',
            template: [{
                id: '?s',
                subjectOfChange: '?sub', //>cs:subjectOfChange
                precedingChangeset: '?pre',
                changeReason: '?r',
                createdDate: '',
                creatorName: '',
                addition: { $ref: { target: 'triple', on: '?add' } },
                removal: { $ref: { target: 'triple', on: '?rem' } }
            }],
            from: queryStr
        });

        var result = store.changeset.getListService();
        return result;
    },

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
