package org.aksw.facete2.web.config;

import javax.annotation.PostConstruct;

import org.aksw.jena_sparql_api.batch.ConfigSparqlExportJob;
import org.aksw.jena_sparql_api.batch.SparqlBatchUtils;
import org.aksw.jena_sparql_api.batch.SparqlExportManager;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import(ConfigSparqlExportJob.class)
//@Import(ConfigSparqlExportJob.class )
public class ConfigSpringBatch
    implements ApplicationContextAware
{
    private ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext)
            throws BeansException {
        this.applicationContext = applicationContext;
    }

    @PostConstruct
    public void init() {
        SparqlBatchUtils.cleanUp(applicationContext);
    }

    /*
    @Bean
    public Integer springBatchCleanupDummyBean() {
        MainSparqlExportJobLauncher.cleanUp(applicationContext);
        return 1;
    }
    */

    @Bean
    public SparqlExportManager sparqlExportManager(JobExplorer jobExplorer, JobRepository jobRepository, JobLauncher jobLauncher, Job job) {
        SparqlExportManager result = new SparqlExportManager(jobExplorer, jobRepository, jobLauncher, job);
        return result;
    }
}
