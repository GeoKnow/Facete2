package org.aksw.facete2.web.servlets;

import java.util.Properties;

import javax.annotation.Resource;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;

@Service
@Path("/version")
public class ServletVersionInfo {
    @Autowired
    private Gson gson;

    @Resource(name="versionInfo")
    private Properties versionInfo;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    //@Path("get")
    public String getVersion() {
        String result = gson.toJson(versionInfo);
        return result;
    }
}
