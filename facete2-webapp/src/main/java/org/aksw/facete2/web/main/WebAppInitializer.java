package org.aksw.facete2.web.main;

import javax.servlet.FilterRegistration;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRegistration;

import org.aksw.jena_sparql_api.web.filters.CorsFilter;
import org.springframework.web.WebApplicationInitializer;
import org.springframework.web.context.ContextLoaderListener;
import org.springframework.web.context.request.RequestContextListener;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;
import org.tuckey.web.filters.urlrewrite.UrlRewriteFilter;

import com.sun.jersey.spi.spring.container.servlet.SpringServlet;


public class WebAppInitializer
	implements WebApplicationInitializer
{
	@Override
	public void onStartup(ServletContext servletContext)
		throws ServletException
	{		
		// Create the 'root' Spring application context
		AnnotationConfigWebApplicationContext rootContext = new AnnotationConfigWebApplicationContext();
		rootContext.register(AppConfig.class);
		
		// Manage the lifecycle of the root application context
		servletContext.addListener(new ContextLoaderListener(rootContext));
		servletContext.addListener(new RequestContextListener());

		{
		    FilterRegistration.Dynamic fr = servletContext.addFilter("CorsFilter", new CorsFilter());
		    fr.addMappingForUrlPatterns(null, true, "/*");
        //  fr.setInitParameter("dispatcher", "REQUEST");
		}
		
	    {
            FilterRegistration.Dynamic fr = servletContext.addFilter("UrlRewriteFilter", new UrlRewriteFilter());
            fr.setInitParameter("dispatcher", "REQUEST");
            fr.setInitParameter("dispatcher", "FORWARD");
            fr.addMappingForUrlPatterns(null, true, "/*");
	    }

		
		// Create the dispatcher servlet's Spring application context
		AnnotationConfigWebApplicationContext dispatcherContext = new AnnotationConfigWebApplicationContext();
		dispatcherContext.register(WebMvcConfig.class);
		
		ServletRegistration.Dynamic jassaServlet = servletContext.addServlet("jassa-servlet", new SpringServlet());
		jassaServlet.setInitParameter("com.sun.jersey.config.property.packages", "org.aksw.jassa.web.api");
		//ServletRegistration.Dynamic jassaServlet = servletContext.addServlet("jassa-servlet", new DispatcherServlet(dispatcherContext));
		jassaServlet.addMapping("/api/*");
		jassaServlet.setLoadOnStartup(1);

		ServletRegistration.Dynamic facete2Servlet = servletContext.addServlet("facete2-servlet", new SpringServlet());
        //ServletRegistration.Dynamic facete2Servlet = servletContext.addServlet("facete2-servlet", new DispatcherServlet(dispatcherContext));
        facete2Servlet.setInitParameter("com.sun.jersey.config.property.packages", "org.aksw.facete2.web.api");
        facete2Servlet.addMapping("/cache/*");
        facete2Servlet.setLoadOnStartup(1);

        
//        ServletRegistration.Dynamic defaultServlet = servletContext.addServlet("default-servlet", new DefaultServlet());
//        defaultServlet.addMapping("/resources/*");
//        defaultServlet.setLoadOnStartup(1);
        
        ServletRegistration.Dynamic defaultServlet = servletContext.addServlet("default-servlet", new DispatcherServlet(dispatcherContext));
        defaultServlet.addMapping("/resources/app/**");
        defaultServlet.addMapping("*.do");
        defaultServlet.setLoadOnStartup(1);
        //dispatcherServlet.addMapping("/**");
        //dispatcherServlet.addMapping("");
	}	
}
