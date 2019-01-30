package org.aksw.facete2.web.config;

import javax.sql.DataSource;

import org.aksw.jdbc_utils.core.Schema;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfigSimpleStore {

	@Bean
	@Autowired
	public SimpleStore simpleStore(DataSource dataSource, Schema schema) {
		SimpleStore result = new SimpleStoreImpl(dataSource, schema);
		return result;
	}
}
