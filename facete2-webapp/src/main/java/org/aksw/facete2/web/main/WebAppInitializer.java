package org.aksw.facete2.web.main;

import javax.servlet.FilterRegistration;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRegistration;

import org.aksw.facete2.web.api.FilterPost;
import org.aksw.jena_sparql_api.web.filters.CorsFilter;
import org.glassfish.jersey.servlet.ServletContainer;
import org.springframework.web.WebApplicationInitializer;
import org.springframework.web.context.ContextLoaderListener;
import org.springframework.web.context.request.RequestContextListener;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;
import org.tuckey.web.filters.urlrewrite.UrlRewriteFilter;


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
//
//        // Manage the lifecycle of the root application context
        servletContext.addListener(new ContextLoaderListener(rootContext));
        servletContext.addListener(new RequestContextListener());


        {
            FilterRegistration.Dynamic fr = servletContext.addFilter("CorsFilter", new CorsFilter());
            fr.addMappingForUrlPatterns(null, true, "/*");
            fr.setAsyncSupported(true);
        //  fr.setInitParameter("dispatcher", "REQUEST");
        }

        {
            FilterRegistration.Dynamic fr = servletContext.addFilter("FilterPost", new FilterPost());
            fr.addMappingForUrlPatterns(null, true, "/*");
            fr.setAsyncSupported(true);
        //  fr.setInitParameter("dispatcher", "REQUEST");
        }

//        {
            FilterRegistration.Dynamic fr = servletContext.addFilter("UrlRewriteFilter", new UrlRewriteFilter());
            fr.setInitParameter("dispatcher", "REQUEST");
            fr.setInitParameter("dispatcher", "FORWARD");
            fr.addMappingForUrlPatterns(null, true, "/*");
            fr.setAsyncSupported(true);
//        }


        // Create the dispatcher servlet's Spring application context
        AnnotationConfigWebApplicationContext dispatcherContext = new AnnotationConfigWebApplicationContext();
        dispatcherContext.register(WebMvcConfig.class);

        ServletRegistration.Dynamic jassaServlet = servletContext.addServlet("jassa-servlet", new ServletContainer());
        jassaServlet.setInitParameter("jersey.config.server.provider.classnames", "org.aksw.jena_sparql_api.web.servlets.PathFindingApi org.aksw.facete2.web.api.ServletDataStore org.aksw.facete2.web.api.ServletExportSparql org.aksw.facete2.web.api.ServletSparqlSpringBatchStatus");
        jassaServlet.addMapping("/api/*");
        jassaServlet.setAsyncSupported(true);
        jassaServlet.setLoadOnStartup(1);

        ServletRegistration.Dynamic facete2Servlet = servletContext.addServlet("facete2-servlet", new ServletContainer());
        facete2Servlet.setInitParameter("jersey.config.server.provider.classnames", "org.aksw.facete2.web.api.ServletSparqlProxyCache");
        facete2Servlet.addMapping("/cache/*");
        facete2Servlet.setAsyncSupported(true);
        facete2Servlet.setLoadOnStartup(1);


        ServletRegistration.Dynamic staticServlet = servletContext.addServlet("static-servlet", new ServletContainer());
        staticServlet.setInitParameter("jersey.config.server.provider.classnames", "org.aksw.facete2.web.api.ServletSparqlStaticData");
        staticServlet.addMapping("/static/*");
        staticServlet.setAsyncSupported(true);
        staticServlet.setLoadOnStartup(1);


        //staticServlet.setInitParameter("jersey.config.server.provider.packages", "org.aksw.facete2.web.api.ServletSparqlStaticData");
//        ServletRegistration.Dynamic defaultServlet = servletContext.addServlet("default-servlet", new DefaultServlet());
//        defaultServlet.addMapping("/resources/*");
//        defaultServlet.setLoadOnStartup(1);

        ServletRegistration.Dynamic defaultServlet = servletContext.addServlet("default-servlet", new DispatcherServlet(dispatcherContext));
        defaultServlet.addMapping("*.do");
        defaultServlet.setLoadOnStartup(1);
        //dispatcherServlet.addMapping("/**");
        //dispatcherServlet.addMapping("");
    }
}
