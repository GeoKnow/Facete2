package org.aksw.facete2.web.api;

import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import javax.annotation.Resource;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.aksw.facete2.web.main.SparqlExportManager;
import org.aksw.jassa.sparql_path.core.SparqlServiceFactory;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.sparqlify.algebra.sql.exprs2.S_ColumnRef;
import org.aksw.sparqlify.core.cast.SqlValue;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMap;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.JobExecution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.google.gson.Gson;
import com.hp.hpl.jena.graph.Node;
import com.hp.hpl.jena.graph.NodeFactory;
import com.hp.hpl.jena.graph.Triple;
import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;
import com.hp.hpl.jena.query.QueryFactory;
import com.hp.hpl.jena.query.ResultSet;
import com.hp.hpl.jena.query.Syntax;
import com.hp.hpl.jena.sparql.core.Quad;
import com.hp.hpl.jena.sparql.core.Var;
import com.hp.hpl.jena.sparql.engine.binding.Binding;
import com.hp.hpl.jena.sparql.syntax.Element;
import com.hp.hpl.jena.vocabulary.RDF;
import com.sun.jersey.core.header.ContentDisposition;


@Service
@javax.ws.rs.Path("/export/")
public class SparqlExportServlet {

    @Resource(name = "sparqlServiceFactory")
    private SparqlServiceFactory sparqlServiceFactory;

    @Resource(name = "sparqlSqlInverseMapper")
    private SparqlSqlInverseMapper sparqlSqlInverseMapper;

    
    @Resource(name = "sparqlExportManager")
    private SparqlExportManager sparqlExportManager;
    
    @Resource(name = "sparqlExportSink")
    private StreamSink streamSink;

    
    @Autowired
    private HttpServletRequest req;

    @Context
    private ServletContext servletContext;

    
    private static final Logger logger = LoggerFactory.getLogger(SparqlExportServlet.class);
    
    public SparqlExportServlet() {

    }
    
    public static long countQuery(Query query, QueryExecutionFactory qef) {
        Var outputVar = Var.alloc("c");
        
        if(query.isConstructType()) {
            
            Element element = query.getQueryPattern();
            query = new Query();
            query.setQuerySelectType();
            query.setQueryResultStar(true);
            query.setQueryPattern(element);
        }
        
        Query countQuery = QueryFactory.create("Select (Count(*) As ?c) { {" + query + "} }", Syntax.syntaxSPARQL_11);
        
        
        QueryExecution qe = qef.createQueryExecution(countQuery);
        ResultSet rs = qe.execSelect();
        Binding binding = rs.nextBinding();
        Node node = binding.get(outputVar);
        Number numeric = (Number)node.getLiteralValue();
        long result = numeric.longValue();
        

        return result;
    }
    
    /**
     * Starts an export of the given query
     * 
     * @param queryString
     * @param id
     * @throws Exception 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @javax.ws.rs.Path("start")
    public String startExport(@QueryParam("service-uri") String serviceUri, @QueryParam("default-graph-uri") List<String> defaultGraphUris, @QueryParam("query") String queryString, @QueryParam("id") String id) throws Exception {
        
        Assert.notNull(serviceUri);
        if(defaultGraphUris == null) {
            defaultGraphUris = Collections.emptyList();
        }
        
        String tmpId;

        // Generate a new id if none is specified
        if(id == null) {
            int i = 1;
            do {
                id = "export-" + (i++) + ".xml";
                tmpId = id + ".tmp";
            } while (streamSink.doesExist(id) || streamSink.doesExist(tmpId));
        }
        else {
            tmpId = id + ".tmp";
        }

        String targetResource = "/tmp/export";
        JobExecution jobExecution = sparqlExportManager.launchSparqlExport(serviceUri, defaultGraphUris, queryString, targetResource);
        long jobExecutionId = jobExecution.getId();
        
        String jobExeuctionUri = "http://example.org/resource/jobExecution" + jobExecutionId;
        
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("id", jobExeuctionUri);
        
        Gson gson = new Gson();
        String result = gson.toJson(data);
        
        return result;
    }

    
    /**
     * Aborts an export
     * 
     * @param id
     */
    @javax.ws.rs.Path("/cancel")
    @GET
    public void cancelExport(@QueryParam("id") String id) {
        
    }

    /**
     * Return a data stream if the resource exist.
     *
     * Otherwise, returns the following errors
     * - 'resource is being created' if the export is still in progress
     * - 'resource does not exists' regardless of the reason. Use status to request resource state.
     * 
     * @param id
     * @throws FileNotFoundException 
     */
    @javax.ws.rs.Path("/retrieve")
    @GET
    @Produces({ MediaType.APPLICATION_OCTET_STREAM })
    public Response retrieveExport(@QueryParam("id") String id) throws FileNotFoundException {
        
        Triple t = new Triple(NodeFactory.createURI(id), RDF.type.asNode(), NodeFactory.createURI("http://ns.aksw.org/spring/batch/JobExecution"));
        Quad quad = new Quad(Quad.defaultGraphNodeGenerated, t);
        
        List<SparqlSqlInverseMap> candidates = sparqlSqlInverseMapper.map(quad);
        
        if(candidates.isEmpty()) {
            throw new RuntimeException("No candidate found");
        }
        else if(candidates.size() > 1) {
            throw new RuntimeException("Too many candidates found");
        }
        
        SparqlSqlInverseMap map = candidates.get(0);
        Map<String, Object> nameToValue = makeSimple(map.getColumnToValue());
        Long jobExecutionId = Long.parseLong("" + nameToValue.get("job_execution_id"));

        InputStream in = sparqlExportManager.getTargetInputStream(jobExecutionId);

        StreamingOutput out = new StreamingOutputInputStream(in);

        ContentDisposition contentDisposition = ContentDisposition.type("attachment")
                .fileName("export.xml").creationDate(new Date()).build();
        
        Response result = Response.ok(out).header("Content-Disposition", contentDisposition).build();

        
        return result;
        //jobRepository.get
        

        //return null;
        
        /*
        boolean doesExist = streamSink.doesExist(id);
        if(!doesExist) {
            boolean isBeingCreated = streamSink.doesExist(id + ".tmp");
            if(isBeingCreated) {
                throw new RuntimeException("The resource is being created but not ready yet. Please try again later.");
            }
            
            throw new RuntimeException("This resource does not exist");
        }
        
        
        InputStream in = streamSink.getInputStream(id);
        StreamingOutput result = new StreamingOutputInputStream(in);

        return result;
        */
    }
    
    
    // TODO Duplicate code from org.aksw.sparqlify.jpa - clean this up
    public static Map<String, Object> makeSimple(Map<S_ColumnRef, SqlValue> map) {
        Map<String, Object> result = new HashMap<String, Object>();
        
        for(Entry<S_ColumnRef, SqlValue> entry : map.entrySet()) {
            S_ColumnRef colRef = entry.getKey();
            SqlValue sqlValue = entry.getValue();
            
            String columnName = colRef.getColumnName();
            Object value = sqlValue.getValue();
            
            result.put(columnName, value);
        }
        
        return result;
    }

    /*
    @javax.ws.rs.Path("/pause")
    @GET
    public void cancelExport(@QueryParam("query") String queryString, @QueryParam("id") id) {
        
    }
    // resume
    */
}
