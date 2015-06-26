package org.aksw.facete2.web.config;

import java.io.File;

import javax.sql.DataSource;

import org.aksw.facete2.web.main.DatasetFromWatchedFolder;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.aksw.jena_sparql_api.core.QueryExecutionFactoryDataset;
import org.aksw.sparqlify.config.syntax.Config;
import org.aksw.sparqlify.core.algorithms.CandidateViewSelectorImpl;
import org.aksw.sparqlify.core.interfaces.SparqlSqlOpRewriterImpl;
import org.aksw.sparqlify.core.interfaces.SqlTranslator;
import org.aksw.sparqlify.core.sparql.QueryExecutionFactoryEx;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMapper;
import org.aksw.sparqlify.inverse.SparqlSqlInverseMapperImpl;
import org.aksw.sparqlify.util.SparqlifyUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;

import com.hp.hpl.jena.query.Dataset;

@Configuration
@EnableBatchProcessing
@Import({ConfigDataSource.class, ConfigHibernate.class, ConfigSparqlServiceFactory.class, ConfigSpringBatch.class})
@ComponentScan({"org.aksw.jassa.web", "org.aksw.facete2.web"}) // TODO I think we can drop jassa.web from scannig by now
public class ConfigApp {
    private static final Logger logger = LoggerFactory
            .getLogger(ConfigApp.class);

    @javax.annotation.Resource
    private Environment env;

    /*
    @Bean
    public StreamSink sparqlExportSink() {
        StreamSink result = new FileStreamSink("/tmp/facete2/");
        return result;
    }
    */

    @Bean
    public String contextConfigLocation() {
        return "foobar";
    }

    @Bean
    public QueryExecutionFactory queryExecutionFactoryStaticData() throws Exception {
        String folder = env.getProperty("fs.rdfDataPath");
        //folder = "/opt/facete2/rdf.d/";
        folder = StringUtils.trimWhitespace(folder);

        Dataset dataset;

        if(!StringUtils.isEmpty(folder)) {
            final DatasetFromWatchedFolder watcher = DatasetFromWatchedFolder.create(folder);
            watcher.init();

            new Thread(watcher, "Dataset Watcher on " + folder).start();

            dataset = watcher.getDataset();
        } else {
            dataset = null;
        }

        QueryExecutionFactory result = new QueryExecutionFactoryDataset(dataset);

        return result;
    }

    @Bean
    public File sparqlExportPath() {
        String exportPathName = env.getRequiredProperty("fs.exportPath");

        File result = new File(exportPathName);

        if(!result.exists()) {

            boolean isCreated = result.mkdirs();
            if(!isCreated) {
                String msg = "Failed to create export path [" + exportPathName + "]. Export feature will NOT be available!";
                throw new RuntimeException(msg);
            }
        }

        if(result.isFile()) {
            String msg = "Export path [" + exportPathName + "] is a file instead of a directory. Export feature will NOT be available!";
            throw new RuntimeException(msg);
        }

        if(!result.canWrite()) {
            String msg = "Cannot write to export path [" + exportPathName + "]; check file system permissions. Export feature will NOT be available!";
            throw new RuntimeException(msg);
        }


        return result;
    }


    @Bean
    @Autowired
    public QueryExecutionFactoryEx batchSparqlService(DataSource dataSource)
        throws Exception
    {

        Resource springBatchSml = new ClassPathResource("org/springframework/batch/rdb2rdf/rdf-mapping-h2.sml");
        Config config = SparqlifyUtils.parseSmlConfig(springBatchSml.getInputStream(), logger);

        QueryExecutionFactoryEx qef = SparqlifyUtils.createDefaultSparqlifyEngine(dataSource, config, 1000l, 30);

        return qef;
    }

    @Bean
    public SparqlSqlInverseMapper sparqlSqlInverseMapper(QueryExecutionFactoryEx sparqlService) {
        SparqlSqlOpRewriterImpl opRewriter = SparqlifyUtils.unwrapOpRewriter(sparqlService);
        CandidateViewSelectorImpl candidateViewSelector = SparqlifyUtils.unwrapCandidateViewSelector(opRewriter);
        SqlTranslator sqlTranslator = SparqlifyUtils.unwrapSqlTransformer(opRewriter);

        SparqlSqlInverseMapper result = new SparqlSqlInverseMapperImpl(candidateViewSelector, sqlTranslator);

        return result;
    }


    /*
     * JPA Layer config
     */
//
//    private Properties getHibernateProperties() {
//        Properties properties = new Properties();
//        properties.put(HIBERNATE_DIALECT, env.getRequiredProperty(HIBERNATE_DIALECT));
//        properties.put(HIBERNATE_SHOW_SQL, env.getRequiredProperty(HIBERNATE_SHOW_SQL));
//        properties.put(HIBERNATE_HBM2DDL_AUTO, env.getRequiredProperty(HIBERNATE_HBM2DDL_AUTO));
//
//        properties.put("hibernate.current_session_context_class", "thread");
//
//        return properties;
//    }
//
//    @Bean
//    public EntityManagerFactory entityManagerFactory(DataSource dataSource) {
//        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
//        vendorAdapter.setGenerateDdl(true);
//        vendorAdapter.setShowSql(false);
//        //vendorAdapter.setDatabasePlatform("org.hibernate.dialect.MySQL5InnoDBDialect");
//        vendorAdapter.setDatabasePlatform("org.hibernate.dialect.PostgreSQLDialect");
//        vendorAdapter.setDatabase(Database.POSTGRESQL);
//
//        LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();
//        factory.setJpaVendorAdapter(vendorAdapter);
//        factory.setPackagesToScan("org.aksw.service_framework.jpa.model", "org.aksw.sparqlify.admin.model");
//        factory.setDataSource(dataSource);
//
//        Properties properties = getHibernateProperties();
////        Properties properties = new Properties();
////        properties.setProperty("hibernate.cache.use_second_level_cache", "true");
////        properties.setProperty("hibernate.cache.region.factory_class", "org.hibernate.cache.ehcache.EhCacheRegionFactory");
////        properties.setProperty("hibernate.cache.use_query_cache", "true");
////        properties.setProperty("hibernate.generate_statistics", "true");
//
//        factory.setJpaProperties(properties);
//
//        factory.afterPropertiesSet();
//
//        return factory.getObject();
//    }
//
//    @Bean
//    public JpaTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
//        JpaTransactionManager txManager = new JpaTransactionManager();
//        JpaDialect jpaDialect = new HibernateJpaDialect();
//        txManager.setEntityManagerFactory(entityManagerFactory);
//        txManager.setJpaDialect(jpaDialect);
//        return txManager;
//    }
//
//
//
//    @Bean
//    public SparqlSqlInverseMapper sparqlSqlInverseMapper(CandidateViewSelectorImpl candidateViewSelector, SqlTranslator sqlTranslator) {
//        SparqlSqlInverseMapper result = new SparqlSqlInverseMapperImpl(candidateViewSelector, sqlTranslator);
//
//        return result;
//    }
//
//    @Bean
//    public EntityInverseMapper entityInverseMapper(SessionFactory sessionFactory, SparqlSqlInverseMapper inverseMapper) {
//        EntityInverseMapperImplHibernate result = EntityInverseMapperImplHibernate.create(inverseMapper, sessionFactory);
//        return result;
//    }
//
//    @Bean
//    public SessionFactory sessionFactory(JpaTransactionManager txManager) {
//        EntityManagerFactory emf = txManager.getEntityManagerFactory();
//        SessionFactory result = ((HibernateEntityManagerFactory)emf).getSessionFactory();
//        return result;
//    }
//
//
//    // TODO Possibly replace this ugly unwrapping by creating the Sparqlify Query Execution
//    // in spring bean style
//
//    @Bean
//    public SparqlSqlOpRewriterImpl sparqlSqlOpRewriter(QueryExecutionFactory qef) {
//        SparqlSqlOpRewriterImpl result = SparqlifyUtils.unwrapOpRewriter(qef);
//        return result;
//    }
//
//    @Bean
//    public SqlTranslator sqlTranslator(SparqlSqlOpRewriterImpl opRewriter) {
//        SqlTranslator result = SparqlifyUtils.unwrapSqlTransformer(opRewriter);
//        return result;
//    }
//
//    @Bean
//    public CandidateViewSelectorImpl candidateViewSelector(SparqlSqlOpRewriterImpl opRewriter) {
//        CandidateViewSelectorImpl result = SparqlifyUtils.unwrapCandidateViewSelector(opRewriter);
//        return result;
//    }
//
}
//@Import({ConfigSparqlServiceFactory.class, ConfigSpringBatch.class })
//@PropertySource("classpath:config/jdbc/jdbc.properties")
//@EnableTransactionManagement
//@Import(DataSourceConfig.class)
