package org.aksw.facete2.web.main;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@Configuration
@Import(SparqlExportJobConfig.class)
public class SpringBatchConfig {

    @Bean
    public Integer springBatchCleanupDummyBean() {
        SparqlExportJobLauncher.cleanUp();
        return 1;
    }
}
