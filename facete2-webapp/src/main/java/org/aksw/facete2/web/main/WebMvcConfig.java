package org.aksw.facete2.web.main;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;



@Configuration
@EnableWebMvc
@ComponentScan(basePackages = "org.aksw.facete2.web.api")
public class WebMvcConfig
	extends WebMvcConfigurerAdapter
{
}
