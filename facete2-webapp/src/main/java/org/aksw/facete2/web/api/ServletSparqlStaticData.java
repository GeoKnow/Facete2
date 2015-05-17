package org.aksw.facete2.web.api;

import javax.annotation.Resource;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.web.servlets.SparqlEndpointBase;
import org.springframework.stereotype.Service;

import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;
import com.hp.hpl.jena.sparql.algebra.Algebra;
import com.hp.hpl.jena.sparql.algebra.Op;
import com.hp.hpl.jena.sparql.algebra.OpAsQuery;

@Service
//@Component
@javax.ws.rs.Path("/sparql")
public class ServletSparqlStaticData
    extends SparqlEndpointBase
{

    //@Autowired
    @Resource(name="queryExecutionFactoryStaticData")
    private QueryExecutionFactory queryExecutionFactory;


//
//    @Context
//    private ServletContext servletContext;

//    @Context
//    private UriInfo uriInfo;

    public ServletSparqlStaticData() {
    }

    @Override
    public QueryExecution createQueryExecution(Query rawQuery) {
        if(queryExecutionFactory == null) {
            throw new RuntimeException("Cannot serve request because queryExecutionFactory is null");
        }

        // Better clone the query to not corrupt anything
        //query = (Query)query.clone();
        boolean enableUnionDefaultGraph = true;
        //boolean enableUnionDefaultGraph = rawQuery.getGraphURIs().isEmpty();


        Query query;
        if(enableUnionDefaultGraph) {
            Op op = Algebra.compile(rawQuery);
            op = Algebra.unionDefaultGraph(op);
            query = OpAsQuery.asQuery(op);
        } else {
            query = rawQuery;
        }


        // TODO Take default graphs into account
        // TODO This is a hack which will break use of named graphs
//        Element el = query.getQueryPattern();
//        Element replacement = new ElementNamedGraph(Var.alloc("hack_123"), el);
//        query.setQueryPattern(replacement);

//        Map<String, String[]> paramMap = req.getParameterMap();
//
//        String[] tmpDgu = paramMap.get("default-graph-uri");
//        List<String> defaultGraphUris = tmpDgu == null ? Collections.<String>emptyList() : Arrays.asList(tmpDgu);

        QueryExecution result = queryExecutionFactory.createQueryExecution(query);

        return result;
    }
}
