package org.aksw.facete2.web.main;

import javax.annotation.Resource;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import org.aksw.jassa.sparql_path.core.SparqlServiceFactory;
import org.aksw.jassa.sparql_path.core.SparqlServiceFactoryImpl;
import org.aksw.jena_sparql_api.cache.extra.CacheBackend;
import org.aksw.jena_sparql_api.cache.extra.CacheFrontend;
import org.aksw.jena_sparql_api.cache.extra.CacheFrontendImpl;
import org.aksw.jena_sparql_api.cache.staging.CacheBackendDao;
import org.aksw.jena_sparql_api.cache.staging.CacheBackendDaoPostgres;
import org.aksw.jena_sparql_api.cache.staging.CacheBackendDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

@Configuration
@ComponentScan({"org.aksw.jassa.web", "org.aksw.facete2.web"})
// @EnableTransactionManagement
public class AppConfig {
    private static final Logger logger = LoggerFactory
            .getLogger(AppConfig.class);

    private static final String JDBC_DRIVER = "jdbc.driver";
    private static final String JDBC_PASSWORD = "jdbc.password";
    private static final String JDBC_URL = "jdbc.url";
    private static final String JDBC_USERNAME = "jdbc.username";

    @Resource
    private Environment env;

    /**
     * When starting the server from the command line, this attribute can be set
     * to override any other means of creating a data source
     */
    public static DataSource cliDataSource = null;

    @Bean
    public DataSource dataSource() throws IllegalArgumentException,
            ClassNotFoundException {

        // TODO Somehow allow loading drivers dynamically
        Class.forName("org.postgresql.Driver");

        DataSource result = null;

        try {
            String jndiName = "java:comp/env/jdbc/facete2Ds";
            Context ctx = new InitialContext();
            result = (DataSource) ctx.lookup(jndiName);
        } catch (NamingException e) {
            logger.info("Exception on retrieving initial JNDI context - trying a different method");
        }

        if (result != null) {
            return result;
        }

        DriverManagerDataSource dataSource = new DriverManagerDataSource();

        dataSource.setDriverClassName(env.getRequiredProperty(JDBC_DRIVER));
        dataSource.setUrl(env.getRequiredProperty(JDBC_URL));
        dataSource.setUsername(env.getRequiredProperty(JDBC_USERNAME));
        dataSource.setPassword(env.getRequiredProperty(JDBC_PASSWORD));

        return dataSource;
    }

    @Bean
    @Autowired
    public SparqlServiceFactory sparqlServiceFactory(DataSource dataSource) {
        CacheBackendDao dao = new CacheBackendDaoPostgres();
        CacheBackend cacheBackend = new CacheBackendDataSource(dataSource, dao); 
        CacheFrontend cacheFrontend = new CacheFrontendImpl(cacheBackend);      

        SparqlServiceFactory result = new SparqlServiceFactoryImpl(cacheFrontend);
        return result;
    }

}
