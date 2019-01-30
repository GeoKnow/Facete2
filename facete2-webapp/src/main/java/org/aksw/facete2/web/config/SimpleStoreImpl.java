package org.aksw.facete2.web.config;

import java.lang.reflect.Type;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.aksw.jdbc_utils.core.ColumnsReference;
import org.aksw.jdbc_utils.core.Inserter;
import org.aksw.jdbc_utils.core.Schema;
import org.springframework.jdbc.core.JdbcTemplate;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;


public class SimpleStoreImpl
	implements SimpleStore
{

    protected DataSource dataSource;
    protected Schema schema;

    protected Gson gson = new Gson();
    
    public static Type mapType = new TypeToken<Map<String, Object>>() {}.getType();


    public SimpleStoreImpl(DataSource dataSource, Schema schema) {
		super();
		this.dataSource = dataSource;
		this.schema = schema;
	}


	/**
     *
     *
     *
     * @param json
     * @return An ID for successive lookups of the stored object
     * @throws ClassNotFoundException
     * @throws SQLException
     */
    @Override
    public Integer store(Integer nextId,
            String type,
            String provenance,
            Map<String, Object> payload) throws SQLException
    {
        if(org.springframework.util.StringUtils.isEmpty(type)) {
            throw new RuntimeException("No type provided");
        }

        //        // Normalize the json
//        Map<String, Object> map = gson.fromJson(payload, mapType);
        String json = gson.toJson(payload);



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
        inserter.add(type, nextId, json, provenance);

        Connection conn = dataSource.getConnection();
        try {
            inserter.flush(conn);
        } finally {
            conn.close();
        }

        //String result = "{\"id\": \"" + nextId + "\" }";
        //return result;
        return nextId;
    }


    @Override
    public boolean delete(String type, Long id)
    {
        if(type == null || id == null) {
            throw new RuntimeException("Type and id must be given");
        }

        String sql = "DELETE FROM \"data_store\" WHERE \"type\" = ? AND \"instance_id\" = ?";
        JdbcTemplate t = new JdbcTemplate(dataSource);

        int numAffectedRows = t.update(sql, type, id);
        boolean result = numAffectedRows > 0;
//
//        Map<String, Object> map = new HashMap<String, Object>();
//        map.put("deleted", true);
//        map.put("id", id);
//        map.put("type", type);
//        Gson gson = new Gson();
//        String result = gson.toJson(map);
        return result;
    }


    public List<Map<String, Object>> load(String type, Long id) throws SQLException {

        String sql = "SELECT \"type\", \"instance_id\" As \"id\", \"data\", \"ip_addr\" FROM \"data_store\" WHERE \"type\" = ?";

        if(id != null) {
            sql += " AND \"instance_id\" = ?";
        }


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

        //String result = gson.toJson(rows);
        return rows; //result;
    }

}
