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

import com.jolbox.bonecp.BoneCPConfig;
import com.jolbox.bonecp.BoneCPDataSource;

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

        DataSource dsBean = null;

        try {
            String jndiName = "java:comp/env/jdbc/facete2Ds";
            Context ctx = new InitialContext();
            dsBean = (DataSource) ctx.lookup(jndiName);
            
            /*
            if(jdbcUrl.isEmpty()) {
                cpConfig.setDatasourceBean(dataSourceBean);         
            } else {
                cpConfig.setJdbcUrl(jdbcUrl);
                cpConfig.setUsername(userName);
                cpConfig.setPassword(passWord);
            }
            
            /*
            cpConfig.setJdbcUrl(dbconf.getDbConnString()); // jdbc url specific to your database, eg jdbc:mysql://127.0.0.1/yourdb
            cpConfig.setUsername(dbconf.getUsername()); 
            cpConfig.setPassword(dbconf.getPassword());
            */
            
        } catch (NamingException e) {
            logger.info("Exception on retrieving initial JNDI context - trying a different method");
        }

        if(dsBean == null) {
            DriverManagerDataSource dataSource = new DriverManagerDataSource();

            dataSource.setDriverClassName(env.getRequiredProperty(JDBC_DRIVER));
            dataSource.setUrl(env.getRequiredProperty(JDBC_URL));
            dataSource.setUsername(env.getRequiredProperty(JDBC_USERNAME));
            dataSource.setPassword(env.getRequiredProperty(JDBC_PASSWORD));

            dsBean = dataSource;
            
//            BoneCPConfig cpConfig = new BoneCPConfig();
//            cpConfig.setDatasourceBean(dsBean);
//            
//            //cpConfig.sesetDriverClassName(env.getRequiredProperty(JDBC_DRIVER));
//            cpConfig.setJdbcUrl(env.getRequiredProperty(JDBC_URL));
//            cpConfig.setUsername(env.getRequiredProperty(JDBC_USERNAME));
//            cpConfig.setPassword(env.getRequiredProperty(JDBC_PASSWORD));
//            
//            cpConfig.setMinConnectionsPerPartition(1);
//            cpConfig.setMaxConnectionsPerPartition(10);
//            cpConfig.setPartitionCount(2);
//            //cpConfig.setConnectionTimeoutInMs(30000);
//            //cpConfig.setStatisticsEnabled(true);
//            cpConfig.setCloseConnectionWatch(true);
            
            //BoneCP connectionPool = new BoneCP(cpConfig); // setup the connection pool    
        }
        
        //DataSource result = dsBean;

        BoneCPConfig cpConfig = new BoneCPConfig();
        cpConfig.setDatasourceBean(dsBean);

        cpConfig.setMinConnectionsPerPartition(1);
        cpConfig.setMaxConnectionsPerPartition(10);
        cpConfig.setPartitionCount(2);
        //cpConfig.setCloseConnectionWatch(true);
        
        DataSource result = new BoneCPDataSource(cpConfig);

        return result;
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
