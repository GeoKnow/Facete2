package org.aksw.facete2.web.main;

import java.sql.Connection;
import java.sql.SQLException;

import javax.annotation.Resource;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import org.aksw.jdbc_utils.core.Schema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import com.jolbox.bonecp.BoneCPConfig;
import com.jolbox.bonecp.BoneCPDataSource;


@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory
            .getLogger(DataSourceConfig.class);

    private static final String JDBC_DRIVER = "jdbc.driver";
    private static final String JDBC_PASSWORD = "jdbc.password";
    private static final String JDBC_URL = "jdbc.url";
    private static final String JDBC_USERNAME = "jdbc.username";

//    private static final String HIBERNATE_DIALECT = "hibernate.dialect";
//    private static final String HIBERNATE_SHOW_SQL = "hibernate.showSql";
//    private static final String HIBERNATE_HBM2DDL_AUTO = "hibernate.hbm2ddl.auto";

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
            String jndiName = "java:comp/env/jdbc/facete2/dataSource";
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
            logger.info("Exception on retrieving initial JNDI context - trying a different method", e);
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

        DataSource result;

        boolean useBoneCpWrapper = false;
        if(useBoneCpWrapper) {

            BoneCPConfig cpConfig = new BoneCPConfig();
            cpConfig.setDatasourceBean(dsBean);

            cpConfig.setMinConnectionsPerPartition(1);
            cpConfig.setMaxConnectionsPerPartition(10);
            cpConfig.setPartitionCount(2);
            //cpConfig.setCloseConnectionWatch(true);

            try {
                result = new BoneCPDataSource(cpConfig);
            } catch(Exception e) {
                throw new RuntimeException(e);
            }
        } else {
            result = dsBean;
        }

        return result;
    }


    @Bean
    @Autowired
    public Schema schema(DataSource dataSource) throws SQLException {
        Schema result = null;
        Connection conn = dataSource.getConnection();
        try {
            result = Schema.create(conn);
        } finally {
            conn.close();
        }
        return result;
    }
}
