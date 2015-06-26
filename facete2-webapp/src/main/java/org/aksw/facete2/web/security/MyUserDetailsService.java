package org.aksw.facete2.web.security;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("authService")
public class MyUserDetailsService
    implements UserDetailsService
{
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username){

        UserDetails result =
                entityManager
                    .createQuery("FROM UserInfo WHERE username = :username", UserInfo.class)
                    .setParameter("username", username)
                    .getSingleResult();

        return result;
    }
}
