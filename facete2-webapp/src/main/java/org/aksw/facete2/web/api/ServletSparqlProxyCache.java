package org.aksw.facete2.web.api;

import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

import javax.annotation.Resource;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.core.SparqlService;
import org.aksw.jena_sparql_api.core.SparqlServiceFactory;
import org.aksw.jena_sparql_api.web.servlets.SparqlEndpointBase;
import org.aksw.jena_sparql_api.web.utils.AuthenticatorUtils;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.HttpClient;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.sparql.core.DatasetDescription;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
//@Component
@javax.ws.rs.Path("/sparql")
public class ServletSparqlProxyCache
    extends SparqlEndpointBase
{

    //@Autowired
    @Resource(name="sparqlServiceFactory")
    private SparqlServiceFactory sparqlServiceFactory;

    private String defaultServiceUri;
    private boolean allowOverrideServiceUri = false;

    @Autowired
    private HttpServletRequest req;

    @Context
    private ServletContext servletContext;

//    @Context
//    private UriInfo uriInfo;

    public ServletSparqlProxyCache() {

    }

    //@PostConstruct
    public void init() {

        //ServletContext context = req.getServletContext();

        this.defaultServiceUri = (String) servletContext
                .getAttribute("defaultServiceUri");

        Boolean tmp = (Boolean) servletContext.getAttribute("allowOverrideServiceUri");
        this.allowOverrideServiceUri = tmp == null ? true : tmp;

        if (!allowOverrideServiceUri
                && (defaultServiceUri == null || defaultServiceUri.isEmpty())) {
            throw new RuntimeException(
                    "Overriding of service URI disabled, but no default URI set.");
        }
    }

    @Override
    public QueryExecution createQueryExecution(Query query) {

        init();

        if(sparqlServiceFactory == null) {
            throw new RuntimeException("Cannot serve request because sparqlServiceFactory is null");
        }

        Map<String, String[]> paramMap = req.getParameterMap();
        // TODO does not work for POST requests
        //Multimap<String, String> qs = UriUtils.parseQueryString(req.getQueryString());

        String[] serviceUris = paramMap.get("service-uri");
        String serviceUri;
        if (serviceUris == null || serviceUris.length == 0) {
            serviceUri = defaultServiceUri;
        } else {
            serviceUri = serviceUris[0];//.iterator().next();

            // If overriding is disabled, a given uri must match the default one
            if (!allowOverrideServiceUri
                    && !defaultServiceUri.equals(serviceUri)) {
                throw new RuntimeException("Access to any service other than "
                        + defaultServiceUri + " is blocked.");
            }
        }

        if (serviceUri == null) {
            throw new RuntimeException(
                    "No SPARQL service URI sent with the request and no default one is configured");
        }


        String[] dgus = paramMap.get("default-graph-uri");
        String[] ngus = paramMap.get("named-graph-uri");

        DatasetDescription datasetDescription = new DatasetDescription(
                dgus == null ? Collections.<String>emptyList() : Arrays.asList(dgus),
                ngus == null ? Collections.<String>emptyList() : Arrays.asList(ngus));



        UsernamePasswordCredentials credentials = AuthenticatorUtils.parseCredentials(req);
        HttpClient httpClient = AuthenticatorUtils.prepareHttpClientBuilder(credentials).build();


        // TODO: What is the best way to pass the authenticator to the sparql service?
        SparqlService sparqlService = sparqlServiceFactory.createSparqlService(serviceUri, datasetDescription, httpClient);//new QueryExecutionFactoryHttp(serviceUri, defaultGraphUris);
        QueryExecutionFactory qef = sparqlService.getQueryExecutionFactory();
        QueryExecution result = qef.createQueryExecution(query);

        return result;
    }
}
