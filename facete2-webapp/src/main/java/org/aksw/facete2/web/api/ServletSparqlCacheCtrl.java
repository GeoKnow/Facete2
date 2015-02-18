package org.aksw.facete2.web.api;

import java.sql.Connection;
import java.sql.SQLException;

import javax.annotation.Resource;
import javax.sql.DataSource;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.aksw.commons.util.jdbc.SqlUtils;
import org.springframework.stereotype.Service;

/**
 * A servlet for controlling the sparql cache
 *
 * Supported actions
 * - /core/clearCache
 *
 * @author raven
 *
 */
@Service
@javax.ws.rs.Path("/ctrl")
public class ServletSparqlCacheCtrl {

    @Resource(name = "dataSource")
    private DataSource dataSource;

    @Path("/clear")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public String clearCachePost() throws SQLException {
        return clearCache();
    }

    @Path("/clear")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public String clearCacheGet() throws SQLException {
        return clearCache();
    }


    public String clearCache() throws SQLException {

        Connection conn = dataSource.getConnection();
        try {
            SqlUtils.execute(conn, "DELETE FROM query_cache", Void.class);
        }
        finally {
            conn.close();
        }

        return "{}";
    }
}
