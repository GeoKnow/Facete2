package org.aksw.facete2.tests;


import java.util.List;

import org.aksw.jena_sparql_api.concepts.Concept;
import org.aksw.jena_sparql_api.concepts.Path;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.core.SparqlServiceBuilder;
import org.aksw.jena_sparql_api.sparql_path.core.algorithm.ConceptPathFinder;


public class PathFindingIssueRenePietzsch {
    public static void mainfoo(String[] args) {
        QueryExecutionFactory qef = SparqlServiceBuilder.http("http://odple-virtuoso.eccenca.com/", "https://ckan.eccenca.com/").create();

        Concept sourceConcept = Concept.create("?s ?p ?o", "s");
        Concept targetConcept = Concept.create("?s <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?x ; <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?y", "s");

        // Resolution: A bug in virtuoso 07.10.3207 which causes the join summary query to fail if a default graph was provided
        List<Path> paths = ConceptPathFinder.findPaths(qef, sourceConcept, targetConcept, 10, 10);
        System.out.println(paths);
    }

    public static void main(String[] args) {
        QueryExecutionFactory qef = SparqlServiceBuilder.http("http://odple-virtuoso.eccenca.com/", "https://odple-ckan.eccenca.com/").create();

        Concept sourceConcept = Concept.create("?s ?p ?o", "s");
        Concept targetConcept = Concept.create("?s <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?x ; <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?y", "s");

        // Resolution: A bug in virtuoso 07.10.3207 which causes the join summary query to fail if a default graph was provided
        List<Path> paths = ConceptPathFinder.findPaths(qef, sourceConcept, targetConcept, 10, 10);
        System.out.println(paths);
    }

}
