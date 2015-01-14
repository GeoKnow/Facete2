package org.aksw.facete2.web.api;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import javax.annotation.Resource;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.aksw.facete2.web.main.SparqlExportManager;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.core.SparqlServiceFactory;
import org.aksw.sparqlify.algebra.sql.exprs2.S_ColumnRef;
import org.aksw.sparqlify.core.cast.SqlValue;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMap;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMapper;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.JobExecution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import au.com.bytecode.opencsv.CSVWriter;

import com.google.common.base.Supplier;
import com.google.gson.Gson;
import com.hp.hpl.jena.graph.Node;
import com.hp.hpl.jena.graph.NodeFactory;
import com.hp.hpl.jena.graph.Triple;
import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;
import com.hp.hpl.jena.query.QueryFactory;
import com.hp.hpl.jena.query.ResultSet;
import com.hp.hpl.jena.query.ResultSetFactory;
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

    //@Resource(name = "sparqlExportSink")
    //private StreamSink streamSink;
    @Resource(name = "sparqlExportPath")
    private File sparqlExportPath;

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
     * @param varMapStr A json object that maps variable names to alternative strings, such as for use in headings
     * @throws Exception
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @javax.ws.rs.Path("start")
    public String startExport(@QueryParam("service-uri") String serviceUri, @QueryParam("default-graph-uri") List<String> defaultGraphUris, @QueryParam("query") String queryString, @QueryParam("id") String id) throws Exception {
        String result = startExportCore(serviceUri, defaultGraphUris, queryString, id);
        return result;
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @javax.ws.rs.Path("start")
    public String startExportPost(@FormParam("service-uri") String serviceUri, @FormParam("default-graph-uri") List<String> defaultGraphUris, @FormParam("query") String queryString, @FormParam("id") String id) throws Exception {
        String result = startExportCore(serviceUri, defaultGraphUris, queryString, id);
        return result;
    }


    public String startExportCore(String serviceUri, List<String> defaultGraphUris, String queryString, String id) throws Exception {
        Gson gson = new Gson();

        Assert.notNull(serviceUri);
        if(defaultGraphUris == null) {
            defaultGraphUris = Collections.emptyList();
        }

        String tmpId;

        File targetFile = null;;

        // Generate a new id if none is specified
        if(id == null) {
            int i = 1;
            do {
                id = "export-" + (i++) + ".xml";
                //tmpId = id + ".tmp";

                targetFile = new File(sparqlExportPath.getAbsolutePath() + "/" + id);

            } while(targetFile.exists());
            //while (streamSink.doesExist(id) || streamSink.doesExist(tmpId));
        }
        else {
            //tmpId = id + ".tmp";
            targetFile = new File(sparqlExportPath.getAbsolutePath() + "/" + id + ".xml");
        }

        //String targetResource = "/tmp/export";
        JobExecution jobExecution = sparqlExportManager.launchSparqlExport(serviceUri, defaultGraphUris, queryString, targetFile.getAbsolutePath());
        long jobExecutionId = jobExecution.getId();

        String jobExeuctionUri = "http://example.org/resource/jobExecution" + jobExecutionId;

        Map<String, Object> data = new HashMap<String, Object>();
        data.put("id", jobExeuctionUri);

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
    public String cancelExport(@QueryParam("id") String id) {
        return "{}";
    }

    public Long getExportJobExecutionId(String id) {
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

        return jobExecutionId;
    }


    public Response retrieveExportCsv(@QueryParam("id") String id) {
//        Gson gson = new Gson();
//        Type t = new TypeToken<Map<String, String>>(){}.getType();
//        varMapStr = varMapStr == null || varMapStr.isEmpty() ? "{}" : varMapStr;
//        final Map<String, String> varMap = gson.fromJson(varMapStr, t);

        final Long jobExecutionId = getExportJobExecutionId(id);
        StreamingOutput out;

        final Supplier<InputStream> inputStreamSupplier = new Supplier<InputStream>() {
            @Override
            public InputStream get() {
                InputStream result;
                try {
                    result = sparqlExportManager.getTargetInputStream(jobExecutionId);
                } catch (FileNotFoundException e) {
                    throw new RuntimeException("Failed to get input stream", e);
                }
                return result;
            }
        };

        out = new StreamingOutput() {
            @Override
            public void write(OutputStream output) throws IOException,
                    WebApplicationException {
                resultSetToCsv(inputStreamSupplier, output);
            }
        };

        ContentDisposition contentDisposition = ContentDisposition.type("attachment")
                .fileName("export.csv").creationDate(new Date()).build();

        Response result = Response.ok(out).header("Content-Disposition", contentDisposition).build();


        return result;

    }


    @javax.ws.rs.Path("/retrieve")
    @GET
    @Produces({ MediaType.APPLICATION_OCTET_STREAM })
    public Response retrieveExport(@QueryParam("id") String id, @QueryParam("format") String format) throws FileNotFoundException {
        format = format == null ? "xml" : format.trim().toLowerCase();

        Response result;
        if(format.equals("xml")) {
            result = retrieveExportXml(id);
        } else if(format.equals("csv")) {
            result = retrieveExportCsv(id);
        } else {
            throw new RuntimeException("Invalid format: " + format);
        }


        return result;
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
//    @javax.ws.rs.Path("/retrieveXml")
//    @GET
//    @Produces({ MediaType.APPLICATION_OCTET_STREAM })
    public Response retrieveExportXml(@QueryParam("id") String id) throws FileNotFoundException {

        final Long jobExecutionId = getExportJobExecutionId(id);

        StreamingOutput out;

        InputStream in = sparqlExportManager.getTargetInputStream(jobExecutionId);
        out = new StreamingOutputInputStream(in);

        ContentDisposition contentDisposition = ContentDisposition.type("attachment")
                .fileName("export.xml").creationDate(new Date()).build();

        Response result = Response.ok(out).header("Content-Disposition", contentDisposition).build();


        return result;
    }


//    @javax.ws.rs.Path("/retrieveCsv")
//    @GET
//    @Produces({ MediaType.APPLICATION_OCTET_STREAM })
    public static void resultSetToCsv(Supplier<InputStream> xmlSparqlResultSetStreamSupplier, OutputStream out) {
        // Map<String, String> varMap
        // varMap = varMap == null ? new HashMap<String, String>() : varMap;


        InputStream firstPass = xmlSparqlResultSetStreamSupplier.get();

        ResultSet rs = ResultSetFactory.fromXML(firstPass);
        List<Var> vars = new ArrayList<Var>(rs.getResultVars().size());

        for(String varName : rs.getResultVars()) {
            vars.add(Var.alloc(varName));
        }

        // Figure out which variables use a language tag so we can create columns for them in the CSV
        //Set<Var> usesLangTag = new HashSet<Var>();
        boolean usesLangTag[] = new boolean[vars.size()];

        while(rs.hasNext()) {
            Binding binding = rs.nextBinding();

            int i = 0;
            for(Var var : vars) {
                Node node = binding.get(var);
                if(node != null && node.isLiteral()) {
                    String lang = node.getLiteralLanguage();
                    boolean isLangEmpty = StringUtils.isEmpty(lang);
                    if(!isLangEmpty) {
                        usesLangTag[i] = true;
                    }
                }

                ++i;
            }
        }

        int langTagColCount = 0;
        for(Boolean item : usesLangTag) {
            if(item == true) {
                ++langTagColCount;
            }
        }


        Writer writer = new OutputStreamWriter(out);
        CSVWriter csvWriter = new CSVWriter(writer);

        String row[] = new String[vars.size() + langTagColCount];

        // Write headers
        {
            int i = 0;
            int o = 0;
            for(Var var : vars) {

                String baseName = var.getName();
                //String mappedName = varMap.get(baseName);
                //String varName = mappedName == null ? baseName : mappedName;
                String varName = baseName;

                row[o++] = varName;

                if(usesLangTag[i]) {
                    row[o++] = varName + "_lang";
                }

                ++i;
            }
            csvWriter.writeNext(row);
        }

        InputStream secondPass = xmlSparqlResultSetStreamSupplier.get();
        rs = ResultSetFactory.fromXML(secondPass);
        while(rs.hasNext()) {
            Binding binding = rs.nextBinding();

            int i = 0;
            int o = 0;
            for(Var var : vars) {
                Node node = binding.get(var);

                row[o++] = "" + toCsvString(node);

                if(usesLangTag[i]) {
                    String lang = node.isLiteral() ? node.getLiteralLanguage() : "";
                    if(lang == null) {
                        lang = "";
                    }

                    row[o++] = lang;
                }

                ++i;
            }

            csvWriter.writeNext(row);
        }


        try {
            csvWriter.flush();
        } catch (IOException e) {
            logger.error("Failed to flush a stream", e);
        }


        try {
            csvWriter.close();
        } catch (IOException e) {
            logger.error("Failed to close a stream", e);
        }
    }

    public static String toCsvString(Node node) {
        String result;
        if(node == null) {
            result = "";
        }
        else if(node.isURI()) {
            result = node.getURI();
        }
        else if(node.isLiteral()) {
            result = "" + node.getLiteralValue();
        }
        else if(node.isBlank()) {
            result = node.getBlankNodeLabel();
        }
        else {
            throw new RuntimeException("Unknow node type encountered: " + node);
        }

        return result;
    }
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
