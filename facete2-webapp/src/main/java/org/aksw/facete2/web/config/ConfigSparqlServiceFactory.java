package org.aksw.facete2.web.config;

import javax.sql.DataSource;

import org.aksw.jena_sparql_api.cache.extra.CacheBackend;
import org.aksw.jena_sparql_api.cache.extra.CacheFrontend;
import org.aksw.jena_sparql_api.cache.extra.CacheFrontendImpl;
import org.aksw.jena_sparql_api.cache.staging.CacheBackendDao;
import org.aksw.jena_sparql_api.cache.staging.CacheBackendDaoPostgres;
import org.aksw.jena_sparql_api.cache.staging.CacheBackendDataSource;
import org.aksw.jena_sparql_api.core.SparqlServiceFactory;
import org.aksw.jena_sparql_api.core.SparqlServiceFactoryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfigSparqlServiceFactory {

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
