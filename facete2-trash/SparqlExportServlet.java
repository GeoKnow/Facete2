package org.aksw.facete2.web.api;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.StreamingOutput;

import org.aksw.commons.util.StreamUtils;
import org.aksw.jassa.sparql_path.core.SparqlServiceFactory;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.core.utils.QueryExecutionAndType;
import org.aksw.jena_sparql_api.utils.SparqlFormatterUtils;
import org.aksw.jena_sparql_api.web.ProcessQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.google.gson.Gson;
import org.apache.jena.graph.Node;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.ResultSet;
import org.apache.jena.query.Syntax;
import org.apache.jena.sparql.core.Var;
import org.apache.jena.sparql.engine.binding.Binding;
import org.apache.jena.sparql.syntax.Element;


class StreamingOutputInputStream
    implements StreamingOutput {

    private InputStream in;
    
    public StreamingOutputInputStream(InputStream in) {
        this.in = in;
    }
    
    @Override
    public void write(OutputStream out) throws IOException,
            WebApplicationException
    {
        StreamUtils.copy(in, out, 4096);    
    }
}


interface ExportManager {
    void start(String id);
    void stop(String id);
    void retrieve(String id, OutputStream out);
}



/*
class ExportManagerImpl
    implements ExportManager
{
    private StreamSink streamSink;

    public ExportManagerImpl(StreamSink streamSink) {
        this.streamSink = streamSink;
    }
    
    @Override
    public void start(String id, String queryString, QueryExecutionFactory sparqlService) {
        Query query = QueryFactory.create(queryString, Syntax.syntaxSPARQL_11);
        Template template = null;
        
        // Transform construct queries to SELECT queries
        if(query.isConstructType()) {
            template = query.getConstructTemplate();

            Element element = query.getQueryPattern();
            query = new Query();
            query.setQuerySelectType();
            query.setQueryResultStar(true);
            query.setQueryPattern(element);
        }

        
    }

    @Override
    public void stop(String id) {
        // TODO Auto-generated method stub
        
    }

    @Override
    public void retrieve(String id, OutputStream out) {
        // TODO Auto-generated method stub
        
    }
    
}
*/


@Service
@javax.ws.rs.Path("/export/")
public class SparqlExportServlet {

    @Resource(name = "sparqlServiceFactory")
    private SparqlServiceFactory sparqlServiceFactory;

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
        //Assert.notNull(defaultGraphUris);
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

        // Count the result rows
        Query dataQuery = QueryFactory.create(queryString, Syntax.syntaxSPARQL_11);

        QueryExecutionFactory qef = sparqlServiceFactory.createSparqlService(serviceUri, defaultGraphUris);

        try {
            long count = countQuery(dataQuery, qef);
            logger.debug(count + " in export result set for " + dataQuery);
        } catch(Exception e) {
            throw new RuntimeException("Export failed because result set size could not be determined", e);
        }
        
        
        
        /*
         * Turn the query into a count query.
         * If counting fails, it indicates that a dump is most likely not going to work anyway, so we can cancel it
         * If counting succeeds, it is possible that a dump will eventually fail, e.g.
         * due to a connection loss or because of pagination that causes query execution to incrementally become more expensive
         */
        
        String format;
        if(dataQuery.isSelectType()) {
            format = SparqlFormatterUtils.FORMAT_XML;
        } else if(dataQuery.isConstructType()) {
            format = SparqlFormatterUtils.FORMAT_Text;
        } else {
            throw new RuntimeException("Unsupported query type - only select and construct supported");
        }
        
        QueryExecution qe = qef.createQueryExecution(dataQuery);
        QueryExecutionAndType qeAndType = new QueryExecutionAndType(qe, dataQuery.getQueryType());
        StreamingOutput tmp = ProcessQuery.processQuery(qeAndType, format);
        
        OutputStream out = null;
        try {
            out = streamSink.getOutputStream(tmpId);
            tmp.write(out);
            
            streamSink.rename(tmpId, id);
        } catch(Exception e) {
            if(out != null) {
                out.close();
            }
        }
        
        
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("id", id);
        
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
     */
    @javax.ws.rs.Path("/retrieve")
    @GET
    public StreamingOutput retrieveExport(@QueryParam("id") String id) {
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
    }
    
    

    /*
    @javax.ws.rs.Path("/pause")
    @GET
    public void cancelExport(@QueryParam("query") String queryString, @QueryParam("id") id) {
        
    }
    // resume
    */
}
