package org.aksw.facete2.web.api;

import javax.persistence.EntityManager;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;

@Service
public class JsonStoreServlet {

    
    //@Resource(name="facete2.entityManager")
    @Autowired
    private EntityManager em;
    
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/put")
    public String createInstance(
            @FormParam("class") String clazzName,
            @FormParam("data") String json
        )
    {
        // TODO Make sure that the class is writeable
        // TODO How can we inject attributes (e.g. from the session) into the JSON mapping? 
        
        //EntityManager em = emf.createEntityManager();
        em.getTransaction().begin();

        Gson gson = new Gson();
        
        Class<?> clazz = null;
        Object obj = gson.fromJson(json, clazz);
        
        System.out.println(json);
        //System.out.println(rdb2rdfConfig);

        em.persist(obj);

        em.flush();
        em.getTransaction().commit();
        em.close();

        //serviceManager.registerService(rdb2rdfConfig);
        //serviceRepo.startByConfigId(rdb2rdfConfig.getId());
        //serviceManager.startService(rdb2rdfConfig.getId());
        
        return "{}";
    }

    
}
