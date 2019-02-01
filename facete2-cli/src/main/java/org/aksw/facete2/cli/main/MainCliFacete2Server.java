package org.aksw.facete2.cli.main;

import org.eclipse.jetty.annotations.AnnotationConfiguration;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.webapp.Configuration;
import org.eclipse.jetty.webapp.JettyWebXmlConfiguration;
import org.eclipse.jetty.webapp.MetaInfConfiguration;
import org.eclipse.jetty.webapp.WebAppContext;
import org.eclipse.jetty.webapp.WebInfConfiguration;
import org.eclipse.jetty.webapp.WebXmlConfiguration;

public class MainCliFacete2Server {

	// This actually just deploys a war file to jetty
	public static void main(String[] args) throws Exception {
        Server server = new Server(7532);
        final WebAppContext webAppContext = new WebAppContext();

        Configuration.ClassList classlist = Configuration.ClassList
                .setServerDefault( server );
        classlist.addBefore(
                "org.eclipse.jetty.webapp.JettyWebXmlConfiguration",
                "org.eclipse.jetty.annotations.AnnotationConfiguration" );
        
        webAppContext.setInitParameter("contextConfigLocation", "<NONE>");
        
//        
//        webAppContext.setConfigurations( new Configuration[] { 
//        		  new WebInfConfiguration(), 
//        		  new WebXmlConfiguration(),
//        		  new MetaInfConfiguration(),
//        		  new JettyWebXmlConfiguration(),
//        		  new AnnotationConfiguration()
//        		} );

        webAppContext.setServer(server);
        webAppContext.setContextPath("/");
        webAppContext.setWar(args[0]);

        server.setHandler(webAppContext);
        server.start();
        server.join();
        
	}
}


