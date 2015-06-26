package org.aksw.facete2.web.config;

import javax.annotation.Resource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
public class ConfigWebSecurity
    extends WebSecurityConfigurerAdapter
{
    @Resource(name="authService")
    private UserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        return passwordEncoder;
    }


    @Override
    //@Autowired
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

//    @Autowired
//    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
//        auth
//            .inMemoryAuthentication()
//                .withUser("user").password("password").roles("USER");
//    }

//    @Override
//    public void configure(WebSecurity webSecurity) throws Exception
//    {
//        webSecurity.ignoring().antMatchers("/resources/**");
//    }

    @Bean(name="authenticationManager")
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        AuthenticationManager authenticationManager = super.authenticationManagerBean();
        return authenticationManager;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable() // At some point maybe enable this... (protects cross site request forgery)
            .authorizeRequests()
                .antMatchers("/what/ever/**").hasRole("ADMIN")
//                .antMatchers("/mvc/blog").permitAll()
//                .antMatchers("/mvc/rest/*").permitAll()
//                .antMatchers("/mvc/status", "/mvc/status.txt").permitAll()
                .and()
                    .formLogin()
                    .permitAll()
//                        .loginPage("/mvc/auth/login")
//                        .defaultSuccessUrl("/mvc/blog/posts")
//                        .failureUrl("/mvc/auth/login")
//                        .usernameParameter("user")
//                        .passwordParameter("pwd")
//                        .permitAll()
//                .and()
//                    .logout()
//                        .logoutUrl("/mvc/auth/logout")
//                        .logoutSuccessUrl("/mvc/blog")
//                        .permitAll()
                ;
    }
}