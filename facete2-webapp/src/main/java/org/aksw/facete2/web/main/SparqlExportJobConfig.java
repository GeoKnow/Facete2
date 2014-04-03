package org.aksw.facete2.web.main;

import java.io.IOException;
import java.io.Writer;
import java.util.Arrays;
import java.util.Collection;

import javax.sql.DataSource;

import org.aksw.facete2.web.api.BindingMapperPassThrough;
import org.aksw.facete2.web.api.SparqlPagingItemReader;
import org.aksw.jassa.sparql_path.core.SparqlServiceFactory;
import org.aksw.jena_sparql_api.core.QueryExecutionFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.configuration.annotation.JobBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.explore.support.JobExplorerFactoryBean;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.launch.support.SimpleJobLauncher;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.file.FlatFileFooterCallback;
import org.springframework.batch.item.file.FlatFileHeaderCallback;
import org.springframework.batch.item.file.FlatFileItemWriter;
import org.springframework.batch.item.file.ResourceAwareItemWriterItemStream;
import org.springframework.batch.item.file.transform.LineAggregator;
import org.springframework.batch.item.support.PassThroughItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import com.hp.hpl.jena.sparql.engine.binding.Binding;


/*
class SparqlCountTasklet
    implements Tasklet
{
    
}
*/



/**
 * 
 * Source: http://robbypelssers.blogspot.de/2013/09/spring-batch-demo.html
 * 
 * NOTE DataSource must contain the spring batch schema
 * 
 * .addScript("classpath:org/springframework/batch/core/schema-drop-hsqldb.sql")
 * .addScript("classpath:org/springframework/batch/core/schema-hsqldb.sql")
 *
 * @author raven
 * 
 */
@Configuration
@EnableBatchProcessing
@Import(SparqlServiceFactoryConfig.class)
public class SparqlExportJobConfig {

    /**
     * Attention: You have to name these beans jobBuilders and stepbuilders
     * respectively. See
     * http://docs.spring.io/spring-batch/reference/html/configureJob.html
     */

    public static final String JOBPARAM_SERVICE_URI = "serviceUri";
    public static final String JOBPARAM_DEFAULT_GRAPH_URIS = "defaultGraphUris";
    public static final String JOBPARAM_QUERY_STRING = "queryString";
    
    public static final String JOBPARAM_TARGET_RESOURCE = "targetResource";

//    @Autowired
//    private JobExplorer jobExplorer;

    @Autowired
    private JobBuilderFactory jobBuilders;

    @Autowired
    private StepBuilderFactory stepBuilders;

    @Autowired
    private SparqlServiceFactory sparqlServiceFactory;
    
    
    private static final int chunkSize = 1000;
//    @Autowired
//    private DataSource dataSource;
    
    @Bean
    @Autowired
    public JobExplorerFactoryBean jobExplorer(DataSource dataSource) {
        JobExplorerFactoryBean result = new JobExplorerFactoryBean();
        result.setDataSource(dataSource);
        
        return result;
    }
    
    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
        taskExecutor.setCorePoolSize(5);
        taskExecutor.setMaxPoolSize(5);
        
        return taskExecutor;
    }

    
    @Bean
    @Autowired
    public JobLauncher jobLauncher(JobRepository jobRepository) {
        SimpleJobLauncher jobLauncher = new SimpleJobLauncher();
        jobLauncher.setJobRepository(jobRepository);
        jobLauncher.setTaskExecutor(taskExecutor());
        
        return jobLauncher;
    }

    @Bean
    public Job sparqlExportJob() {
        return jobBuilders.get("sparqlExportJob").start(step()).build();
    }

//    @Bean
//    public Step countStep {
//        stepBuilders.get("countStep").tasklet();
//    }
    
    @Bean
    public Step step() {
        return stepBuilders.get("step").<Binding, Binding> chunk(chunkSize)
                .reader(reader(null, null, null))
                .processor(processor())
                .writer(writer(null))
                .build();
    }

    @Bean
    @StepScope
    public SparqlPagingItemReader<Binding> reader(
            @Value("#{jobParameters[serviceUri]}") String serviceUri,
            @Value("#{jobParameters[defaultGraphUris]}") String defaultGraphUris,
            @Value("#{jobParameters[queryString]}") String queryString)
    {
        String[] tmp = defaultGraphUris.split(" ");
        Collection<String> dgus = Arrays.asList(tmp);
        
        SparqlPagingItemReader<Binding> itemReader = new SparqlPagingItemReader<Binding>();
        
        QueryExecutionFactory qef = sparqlServiceFactory.createSparqlService(serviceUri, dgus);
        
        itemReader.setSparqlService(qef);
        itemReader.setBindingMapper(new BindingMapperPassThrough());
        
        itemReader.setPageSize(chunkSize);
        itemReader.setSaveState(true);
        itemReader.setQueryString(queryString);
        itemReader.setServiceUri(serviceUri);
        itemReader.setDefaultGraphUris(dgus);
        
        
        return itemReader;
    }

    @Bean
    @StepScope
    public ResourceAwareItemWriterItemStream<Binding> writer(
            @Value("#{jobParameters[targetResource]}") String targetResource)
    {
        FlatFileItemWriter<Binding> itemWriter = new FlatFileItemWriter<Binding>();
        
        itemWriter.setResource(new FileSystemResource(targetResource));
        itemWriter.setLineAggregator(lineAggregator());
        itemWriter.setEncoding("UTF-8");
        itemWriter.setSaveState(true);

        itemWriter.setHeaderCallback(new FlatFileHeaderCallback() {            
            @Override
            public void writeHeader(Writer writer) throws IOException {
            }
        });

        itemWriter.setFooterCallback(new FlatFileFooterCallback() {
            @Override
            public void writeFooter(Writer writer) throws IOException {
            }
        });

        return itemWriter;
    }


    @Bean
    @StepScope
    public LineAggregator<Binding> lineAggregator() {
        return new LineAggregator<Binding>() {
            @Override
            public String aggregate(Binding item) {
                return item.toString();
            }
        };
    }

    @Bean
    @StepScope
    public ItemProcessor<Binding, Binding> processor() {
        return new PassThroughItemProcessor<Binding>();
    }
}
