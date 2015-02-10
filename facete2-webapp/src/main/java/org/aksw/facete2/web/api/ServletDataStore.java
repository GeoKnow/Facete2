package org.aksw.facete2.web.api;

import java.lang.reflect.Type;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.sql.DataSource;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.aksw.jdbc_utils.core.ColumnsReference;
import org.aksw.jdbc_utils.core.Inserter;
import org.aksw.jdbc_utils.core.Schema;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

@Service
//@Component
@javax.ws.rs.Path("/store")
public class ServletDataStore {

    @Resource(name="dataSource")
    private DataSource dataSource;

    @Resource(name="schema")
    private Schema schema;

    public static Type mapType = new TypeToken<Map<String, Object>>() {}.getType();


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
            @Context HttpServletRequest req) throws SQLException
    {
        String ipAddr = req.getRemoteAddr();

        // Normalize the json
        Gson gson = new Gson();
        Map<String, Object> map = gson.fromJson(rawJson, mapType);
        String json = gson.toJson(map);

        if(org.springframework.util.StringUtils.isEmpty(type)) {
            throw new RuntimeException("No type provided");
        }


        // If no ID is provided, allocate the next one for the given type
        //if(i)
        JdbcTemplate t = new JdbcTemplate(dataSource);


        if(nextId == null) {
            // Check if the JSON object provides an ID
            //Object idObj = map.get("id");
            //if(idObj == null) {
                String maxIdSql = "SELECT MAX(\"instance_id\") FROM \"data_store\" WHERE \"type\" = ?";
                Integer maxId = t.queryForObject(maxIdSql, Integer.class, type);
                nextId = maxId == null ? 1 : maxId + 1;
//            }
//            else if(idObj instanceof Number) {
//                Number number = (Number)idObj;
//                nextId = number.intValue();
//            }
        }


        Inserter inserter = new Inserter(new ColumnsReference("data_store", "type", "instance_id", "data", "ip_addr"), schema);
        inserter.add(type, nextId, json, ipAddr);

        Connection conn = dataSource.getConnection();
        try {
            inserter.flush(conn);
        } finally {
            conn.close();
        }

        String result = "{\"id\": \"" + nextId + "\" }";
        return result;
    }


    @Path("/deleteState")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public String load(@FormParam("type") String type, @FormParam("id") Long id)
    {
        if(type == null || id == null) {
            throw new RuntimeException("Type and id must be given");
        }

        String sql = "DELETE FROM \"data_store\" WHERE \"type\" = ? AND \"instance_id\" = ?";
        JdbcTemplate t = new JdbcTemplate(dataSource);

        t.update(sql, type, id);

        Map<String, Object> map = new HashMap<String, Object>();
        map.put("deleted", true);
        map.put("id", id);
        map.put("type", type);
        Gson gson = new Gson();
        String result = gson.toJson(map);
        return result;
    }


    @Path("/loadState")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String load(@QueryParam("type") String type, @QueryParam("id") Long id,
            @Context HttpServletRequest req) throws SQLException {

        String sql = "SELECT \"type\", \"instance_id\" As \"id\", \"data\", \"ip_addr\" FROM \"data_store\" WHERE \"type\" = ?";

        if(id != null) {
            sql += " AND \"instance_id\" = ?";
        }

        Gson gson = new Gson();

        JdbcTemplate t = new JdbcTemplate(dataSource);
        List<Map<String, Object>> rows;
        if(id != null) {
             rows = t.queryForList(sql, type, id);
        }
        else {
            rows = t.queryForList(sql, type);
        }

        for(Map<String, Object> row : rows) {
            String rawJson = (String)row.get("data");
            Map<String, Object> data = gson.fromJson(rawJson, mapType);
            row.put("data", data);
        }

        String result = gson.toJson(rows);
        return result;
    }

}

