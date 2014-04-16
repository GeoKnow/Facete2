package org.aksw.facete2.web.main;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import(SparqlExportJobConfig.class)
public class SpringBatchConfig {

    @Bean
    public Integer springBatchCleanupDummyBean() {
        MainSparqlExportJobLauncher.cleanUp();
        return 1;
    }
    
    @Bean
    public SparqlExportManager sparqlExportManager(JobExplorer jobExplorer, JobRepository jobRepository, JobLauncher jobLauncher, Job job) {
        SparqlExportManager result = new SparqlExportManager(jobExplorer, jobRepository, jobLauncher, job);
        return result;
    }
}
