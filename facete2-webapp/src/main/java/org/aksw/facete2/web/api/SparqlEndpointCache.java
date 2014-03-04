package org.aksw.facete2.web.api;

import java.util.Collection;

import javax.annotation.Resource;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;

import org.aksw.jassa.sparql_path.core.SparqlServiceFactory;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.utils.UriUtils;
import org.aksw.jena_sparql_api.web.SparqlEndpointBase;
import org.springframework.stereotype.Service;

import com.google.common.collect.Multimap;
import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;

@Service
@javax.ws.rs.Path("/sparql")
public class SparqlEndpointCache extends SparqlEndpointBase {

    //@Autowired
    @Resource(name="sparqlServiceFactory")
    private SparqlServiceFactory sparqlServiceFactory;
    
    private String defaultServiceUri;
    private boolean allowOverrideServiceUri = false;

    @Context
    private HttpServletRequest req;
    
    public SparqlEndpointCache(@Context ServletContext context) {

        this.defaultServiceUri = (String) context
                .getAttribute("defaultServiceUri");

        Boolean tmp = (Boolean) context.getAttribute("allowOverrideServiceUri");
        this.allowOverrideServiceUri = tmp == null ? true : tmp;

        if (!allowOverrideServiceUri
                && (defaultServiceUri == null || defaultServiceUri.isEmpty())) {
            throw new RuntimeException(
                    "Overriding of service URI disabled, but no default URI set.");
        }
    }

    @Override
    public QueryExecution createQueryExecution(final Query query) {

        if(sparqlServiceFactory == null) {
            throw new RuntimeException("Cannot serve request because sparqlServiceFactory is null");
        }
        
        Multimap<String, String> qs = UriUtils.parseQueryString(req.getQueryString());

        Collection<String> serviceUris = qs.get("service-uri");
        String serviceUri;
        if (serviceUris == null || serviceUris.isEmpty()) {
            serviceUri = defaultServiceUri;
        } else {
            serviceUri = serviceUris.iterator().next();

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

        
        Collection<String> defaultGraphUris = qs.get("default-graph-uri");
        
        QueryExecutionFactory qef = sparqlServiceFactory.createSparqlService(serviceUri, defaultGraphUris);//new QueryExecutionFactoryHttp(serviceUri, defaultGraphUris);
        QueryExecution result = qef.createQueryExecution(query);

        return result;
    }
}
