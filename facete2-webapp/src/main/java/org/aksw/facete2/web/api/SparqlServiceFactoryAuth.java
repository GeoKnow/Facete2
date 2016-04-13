package org.aksw.facete2.web.api;

import java.util.Collection;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.core.SparqlServiceFactory;
import org.aksw.jena_sparql_api.http.QueryExecutionFactoryHttp;
import org.apache.jena.atlas.web.auth.HttpAuthenticator;

/**
 * TODO Find a concept where we create an initial qef, and then support wrapping it
 *
 * @author raven
 *
 */
//public class SparqlServiceFactoryAuth
//    implements SparqlServiceFactory
//{
//    private HttpAuthenticator authenticator;
//
//    public SparqlServiceFactoryAuth(HttpAuthenticator authenticator) {
//        //this.delegate = delegate;
//        this.authenticator = authenticator;
//    }
//
//    @Override
//    public QueryExecutionFactory createSparqlService(String serviceUri,
//            Collection<String> defaultGraphUris) {
//
//        QueryExecutionFactoryHttp result = new QueryExecutionFactoryHttp(serviceUri, defaultGraphUris, authenticator);
//
//        //QueryExecutionFactory qef = delegate.createSparqlService(serviceUri, defaultGraphUris);
//
//        // TODO How to inject the authenticator now?
//
//        return result;
//    }
//
//}
