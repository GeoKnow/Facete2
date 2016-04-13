package org.aksw.facete2.web.api.geocode;

import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;


public class ServletGeocoder {

    @Path("/geocode")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public void startTask(
        @QueryParam("s") String serviceStr,
        @QueryParam("g") List<String> defaultGraphs,
        @QueryParam("e") String elementStr,
        @QueryParam("v") String varName,
        @QueryParam("c") String geoCoderService
    ) {
        // Step 1: Resolve IRIs from the SPARQL concept
        // Step 2: Create the JSON according to the mapping
        // Step 3: Create lookup strings from the json
        // Step 4: Perform the lookups


    }
}
