package org.aksw.facete2.web.config;

import java.io.InputStream;
import java.util.Properties;

import javax.annotation.Resource;
import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;

import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.sparqlify.config.syntax.Config;
import org.aksw.sparqlify.core.algorithms.CandidateViewSelectorImpl;
import org.aksw.sparqlify.core.interfaces.SparqlSqlOpRewriterImpl;
import org.aksw.sparqlify.core.interfaces.SqlTranslator;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMapper;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMapperImpl;
import org.aksw.sparqlify.jpa.EntityInverseMapper;
import org.aksw.sparqlify.jpa.EntityInverseMapperImplHibernate;
import org.aksw.sparqlify.util.SparqlifyUtils;
import org.aksw.sparqlify.validation.LoggerCount;
import org.hibernate.SessionFactory;
import org.hibernate.ejb.HibernateEntityManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.orm.hibernate4.HibernateExceptionTranslator;
import org.springframework.orm.jpa.JpaDialect;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.Database;
import org.springframework.orm.jpa.vendor.HibernateJpaDialect;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@PropertySource("classpath:config/jdbc/jdbc.properties")
@ComponentScan("org.aksw.rdf_dataset_catalog.model")
@EnableTransactionManagement
public class ConfigHibernate
{
    private static final Logger logger = LoggerFactory.getLogger(ConfigHibernate.class);

    private static final String HIBERNATE_DIALECT = "hibernate.dialect";
    private static final String HIBERNATE_SHOW_SQL = "hibernate.showSql";
    private static final String HIBERNATE_HBM2DDL_AUTO = "hibernate.hbm2ddl.auto";
    //private static final String PROPERTY_NAME_ENTITYMANAGER_PACKAGES_TO_SCAN = "entitymanager.packages.to.scan";

    @Resource
    private Environment env;

    /**
     * When starting the server from the command line,
     * this attribute can be set to override any other means of creating a data source
     */
    /*
    public static DataSource cliDataSource = null;
    */

    private Properties getHibernateProperties() {
        Properties properties = new Properties();
        properties.put(HIBERNATE_DIALECT, env.getRequiredProperty(HIBERNATE_DIALECT));
        properties.put(HIBERNATE_SHOW_SQL, env.getRequiredProperty(HIBERNATE_SHOW_SQL));
        properties.put(HIBERNATE_HBM2DDL_AUTO, env.getRequiredProperty(HIBERNATE_HBM2DDL_AUTO));

        properties.put("hibernate.current_session_context_class", "thread");

        return properties;
    }


    @Bean
    public HibernateExceptionTranslator hibernateExceptionTranslator() {
        return new HibernateExceptionTranslator();
    }

    @Bean
    @Autowired
    //public EntityManagerFactory entityManagerFactory(DataSource dataSource) {
    public FactoryBean<EntityManagerFactory> entityManagerFactory(DataSource dataSource) {
        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setGenerateDdl(true);
        vendorAdapter.setShowSql(false);
        //vendorAdapter.setDatabasePlatform("org.hibernate.dialect.MySQL5InnoDBDialect");
        vendorAdapter.setDatabasePlatform("org.hibernate.dialect.PostgreSQLDialect");
        vendorAdapter.setDatabase(Database.POSTGRESQL);

        LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();
        factory.setJpaVendorAdapter(vendorAdapter);
        factory.setPackagesToScan("org.aksw.rdf_dataset_catalog.model");
        factory.setDataSource(dataSource);

        Properties properties = getHibernateProperties();
//        Properties properties = new Properties();
//        properties.setProperty("hibernate.cache.use_second_level_cache", "true");
//        properties.setProperty("hibernate.cache.region.factory_class", "org.hibernate.cache.ehcache.EhCacheRegionFactory");
//        properties.setProperty("hibernate.cache.use_query_cache", "true");
//        properties.setProperty("hibernate.generate_statistics", "true");

        factory.setJpaProperties(properties);

        //factory.afterPropertiesSet();

        //EntityManagerFactory result = factory.getObject();
        return factory;
        //return result;
    }

    @Bean
    @Autowired
    public JpaTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager txManager = new JpaTransactionManager();
        JpaDialect jpaDialect = new HibernateJpaDialect();
        txManager.setEntityManagerFactory(entityManagerFactory);
        txManager.setJpaDialect(jpaDialect);
        return txManager;
    }



    /**
     *
     * Note: We must ensure that the schema exists prior to mapping it - hence the dependency on the entityManagerFactory
     *
     * @return
     * @throws Exception
     */
//    @Bean
//    @DependsOn("entityManagerFactory")
//    public QueryExecutionFactory sparqlWrapper(DataSource dataSource)
//        throws Exception
//    {
//        LoggerCount loggerCount = new LoggerCount(logger);
//        InputStream in = this.getClass().getResourceAsStream("/rdf_dataset_catalog.sml");
//        Config config = SparqlifyUtils.readConfig(in, loggerCount);
//
//        if(loggerCount.getErrorCount() != 0 || loggerCount.getWarningCount() != 0) {
//            throw new RuntimeException("Errors reading mapping encountered");
//        }
//
//        QueryExecutionFactory result = SparqlifyUtils.createDefaultSparqlifyEngine(dataSource, config, 1000l, 60);
//        return result;
//    }
//
//
//    @Bean
//    public SparqlSqlInverseMapper sparqlSqlInverseMapper(CandidateViewSelectorImpl candidateViewSelector, SqlTranslator sqlTranslator) {
//        SparqlSqlInverseMapper result = new SparqlSqlInverseMapperImpl(candidateViewSelector, sqlTranslator);
//
//        return result;
//    }

/*
    @Bean
    public EntityInverseMapper entityInverseMapper(SessionFactory sessionFactory, SparqlSqlInverseMapper inverseMapper) {
        EntityInverseMapperImplHibernate result = EntityInverseMapperImplHibernate.create(inverseMapper, sessionFactory);
        return result;
    }

    @Bean
    public SessionFactory sessionFactory(JpaTransactionManager txManager) {
        EntityManagerFactory emf = txManager.getEntityManagerFactory();
        SessionFactory result = ((HibernateEntityManagerFactory)emf).getSessionFactory();
        return result;
    }


    // TODO Possibly replace this ugly unwrapping by creating the Sparqlify Query Execution
    // in spring bean style

    @Bean
    public SparqlSqlOpRewriterImpl sparqlSqlOpRewriter(QueryExecutionFactory qef) {
        SparqlSqlOpRewriterImpl result = SparqlifyUtils.unwrapOpRewriter(qef);
        return result;
    }

    @Bean
    public SqlTranslator sqlTranslator(SparqlSqlOpRewriterImpl opRewriter) {
        SqlTranslator result = SparqlifyUtils.unwrapSqlTransformer(opRewriter);
        return result;
    }

    @Bean
    public CandidateViewSelectorImpl candidateViewSelector(SparqlSqlOpRewriterImpl opRewriter) {
        CandidateViewSelectorImpl result = SparqlifyUtils.unwrapCandidateViewSelector(opRewriter);
        return result;
    }
*/

}


