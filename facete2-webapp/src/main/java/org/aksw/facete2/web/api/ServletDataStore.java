package org.aksw.facete2.web.api;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.aksw.facete2.web.config.SimpleStore;
import org.aksw.facete2.web.config.SimpleStoreImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;

@Service
@javax.ws.rs.Path("/store")
public class ServletDataStore {

	//@Autowired
	protected Gson gson = new Gson();

    @Autowired
    protected SimpleStore simpleStore;

    /**
     *
     *
     *
     * @param json
     * @return An ID for successive lookups of the stored object
     * @throws ClassNotFoundException
     * @throws SQLException
     */
    @Path("/saveState")
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public String store(
            @FormParam("id") Integer nextId,
            @FormParam("type") String type,
            @FormParam("data") String rawJson,
            @Context HttpServletRequest req) throws Exception
    {
        String ipAddr = req.getRemoteAddr();
        Map<String, Object> map = gson.fromJson(rawJson, SimpleStoreImpl.mapType);

        Integer entryId = simpleStore.store(nextId, type, ipAddr, map);

        String result = "{\"id\": \"" + entryId + "\" }";
        return result;
    }


    @Path("/deleteState")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public String delete(@FormParam("type") String type, @FormParam("id") Long id) throws Exception
    {
    	boolean change = simpleStore.delete(type, id);

        Map<String, Object> map = new HashMap<String, Object>();
        map.put("deleted", change);
        map.put("id", id);
        map.put("type", type);
        String result = gson.toJson(map);
        return result;
    }


    @Path("/loadState")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String load(@QueryParam("type") String type, @QueryParam("id") Long id) throws Exception {
    	List<Map<String, Object>> items = simpleStore.load(type, id);
        String result = gson.toJson(items);
        return result;
    }

}

