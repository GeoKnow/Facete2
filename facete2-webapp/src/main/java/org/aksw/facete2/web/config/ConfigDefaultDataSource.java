package org.aksw.facete2.web.config;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;



//class SimpleEndpointConfig {
//	protected String serviceUri;
//	protected 
//}

/**
 * Configuration for the datasource which to use when launching facete
 * 
 * @author Claus Stadler, Jan 30, 2019
 *
 */
@Configuration
public class ConfigDefaultDataSource {
	@Autowired
	protected SimpleStore store;

	
	@Value("${SERVICE_URI}") String serviceUri;
	@Value("${DEFAULT_GRAPH_URI}") String defaultGraphUri;


    @PostConstruct
    public void init() throws Exception {
    	// Create an entry for the default sparql endpoint
    	// in the store if the necessary attributes are provided
    	if(serviceUri != null) {
    		Map<String, Object> data = new HashMap<>();
    		data.put("dataServiceIri", serviceUri);
    		//data.put("dataGraphIris", );
    		
    		store.store(0, "defaultSparqlEndpoint", "local", data);
    	}
    }
}
