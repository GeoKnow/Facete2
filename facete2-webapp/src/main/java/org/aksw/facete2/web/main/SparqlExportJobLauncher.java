package org.aksw.facete2.web.main;

import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobInstance;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.JobParametersInvalidException;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.batch.item.ExecutionContext;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import com.google.common.base.Joiner;

public class SparqlExportJobLauncher {

    /**
     * @param args
     * @throws JobParametersInvalidException
     * @throws JobInstanceAlreadyCompleteException
     * @throws JobRestartException
     * @throws JobExecutionAlreadyRunningException
     */
    public static void main(String[] args) throws Exception
    {
        cleanUp();
        System.out.println("Test");
        //launchSparqlExport("http://dbpedia.org/sparql", Arrays.asList("http://dbpedia.org"), "Select * { ?s ?p ?o } Limit 10", "/tmp/foobar.txt");
        //launchSparqlExport("http://fp7-pp.publicdata.eu/sparql", Arrays.asList("http://fp7-pp.publicdata.eu/"), "Select * { ?s ?p ?o }", "/tmp/fp7.txt");
        
        
        JobExecution je = launchSparqlExport("http://linkedgeodata.org/sparql", Arrays.asList("http://linkedgeodata.org"), "Select * { ?s a <http://linkedgeodata.org/ontology/Airport> . ?s ?p ?o }", "/tmp/lgd-airports.txt");

        
        
        for(;;) {
            for(StepExecution stepExecution : je.getStepExecutions()) {
                ExecutionContext sec = stepExecution.getExecutionContext();
                System.out.println(sec.entrySet());
            }
            
            
            //Set<Entry<String, Object>> entrySet = je.getExecutionContext().entrySet();
            //ExecutionContext ec = je.getExecutionContext();
            //ec.
            //System.out.println(entrySet);
        }
    }
    
    
    public static void cleanUp() {
        ApplicationContext context = new AnnotationConfigApplicationContext(SparqlExportJobConfig.class);
        JobExplorer jobExplorer = context.getBean(JobExplorer.class);
        JobRepository jobRepository = context.getBean(JobRepository.class);

        Date endTime = new Date();

        
        List<String> jobNames = jobExplorer.getJobNames();
        for(String jobName : jobNames) {
            List<JobInstance> jobInstances = jobExplorer.getJobInstances(jobName, 0, 1000000);
            
            for(JobInstance jobInstance : jobInstances) {
                List<JobExecution> jobExecutions = jobExplorer.getJobExecutions(jobInstance);
                
                for(JobExecution jobExecution : jobExecutions) {
                    
                    Collection<StepExecution> stepExecutions = jobExecution.getStepExecutions();
                    for(StepExecution stepExecution : stepExecutions) {
                        BatchStatus stepStatus = stepExecution.getStatus();
                        
                        if(stepStatus.equals(BatchStatus.STARTED)) {
                            stepExecution.setStatus(BatchStatus.STOPPED);
                            stepExecution.setEndTime(endTime);
                            jobRepository.update(stepExecution);
                        }
                    }
                    
                    BatchStatus jobStatus = jobExecution.getStatus();
                    if(jobStatus.equals(BatchStatus.STARTED)) {
                        jobExecution.setStatus(BatchStatus.STOPPED);
                        jobExecution.setEndTime(endTime);
                        jobRepository.update(jobExecution);
                    }
                }
            }
        }
    }
    
    public static JobExecution launchSparqlExport(String serviceUri, Collection<String> defaultGraphUris, String queryString, String targetResource) throws JobExecutionAlreadyRunningException, JobRestartException, JobInstanceAlreadyCompleteException, JobParametersInvalidException
    {
        ApplicationContext context = new AnnotationConfigApplicationContext(SparqlExportJobConfig.class);
        JobLauncher jobLauncher = context.getBean(JobLauncher.class);
        Job job = context.getBean(Job.class);

        Set<String> tmp = new TreeSet<String>(defaultGraphUris);
        String dgu = Joiner.on(' ').join(tmp);
        
        JobParameters jobParameters = new JobParametersBuilder()
            .addString(SparqlExportJobConfig.JOBPARAM_SERVICE_URI, serviceUri, true)
            .addString(SparqlExportJobConfig.JOBPARAM_DEFAULT_GRAPH_URIS, dgu, true)
            .addString(SparqlExportJobConfig.JOBPARAM_QUERY_STRING, queryString, true)
            .addString(SparqlExportJobConfig.JOBPARAM_TARGET_RESOURCE, targetResource, true)
            .toJobParameters();
        
       JobExecution result = jobLauncher.run(job, jobParameters);
       
       return result;
    }
}