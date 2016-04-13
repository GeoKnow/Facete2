package org.aksw.facete2.web.api;

import javax.annotation.Resource;
import javax.ws.rs.Path;

import org.aksw.jena_sparql_api.web.servlets.SparqlEndpointBase;
import org.aksw.sparqlify.core.sparql.QueryExecutionFactoryEx;
import org.springframework.stereotype.Service;

import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;

@Service
@Path("/export-status/sparql/")
public class ServletSparqlSpringBatchStatus
    extends SparqlEndpointBase
{
    //@Autowired
    @Resource(name = "batchSparqlService")
    private QueryExecutionFactoryEx sparqlServiceEx;

    @Override
    public QueryExecution createQueryExecution(Query query) {
        QueryExecution result = sparqlServiceEx.createQueryExecution(query);
        return result;
    }
}
