package org.aksw.facete2.web.main;

import java.net.URL;
import java.net.URLClassLoader;

import org.aksw.commons.util.slf4j.LoggerCount;
import org.aksw.jena_sparql_api.web.server.ServerUtils;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.GnuParser;
import org.apache.commons.cli.Options;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 *
 *
 * http://stackoverflow.com/questions/10738816/deploying-a-servlet-
 * programmatically-with-jetty
 * http://stackoverflow.com/questions/3718221/add-resources
 * -to-jetty-programmatically
 *
 * @author raven
 *
 * http://kielczewski.eu/2013/11/using-embedded-jetty-spring-mvc/
 */
public class MainFacete2Server {

    private static final Logger logger = LoggerFactory.getLogger(MainFacete2Server.class);


    private static final Options cliOptions = new Options();

    static {
        cliOptions.addOption("P", "port", true, "");
    }

    public static void printClassPath() {
        ClassLoader cl = ClassLoader.getSystemClassLoader();

        URL[] urls = ((URLClassLoader)cl).getURLs();

        for(URL url: urls){
            System.out.println(url.getFile());
        }
    }

    // Source:
    // http://eclipsesource.com/blogs/2009/10/02/executable-wars-with-jetty/
    public static void main(String[] args) throws Exception {

        LoggerCount loggerCount = new LoggerCount(logger);

        //Class.forName("org.postgresql.Driver");

        CommandLineParser cliParser = new GnuParser();

        CommandLine commandLine = cliParser.parse(cliOptions, args);


//		AppConfig.cliDataSource = dataSource;


        //SparqlifyCliHelper.parseDataSource(commandLine, loggerCount);
//		DataSource dataSource = SparqlifyCliHelper.parseDataSource(commandLine, logger);
//		Integer port = SparqlifyCliHelper.parseInt(commandLine, "P", false, loggerCount);

        Integer port = null; // TODO parse
        port = (port == null) ? 7532 : port;


        ServerUtils.startServer(MainFacete2Server.class, port, new WebAppInitializer());
    }
}

