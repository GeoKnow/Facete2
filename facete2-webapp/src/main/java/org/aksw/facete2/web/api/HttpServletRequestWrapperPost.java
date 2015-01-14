package org.aksw.facete2.web.api;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.ws.rs.core.MultivaluedMap;

// Class from
// https://issues.apache.org/jira/browse/OLTU-26
// Unfortunately it seems it does not help us - we need to refactor something
public class HttpServletRequestWrapperPost extends HttpServletRequestWrapper {

    private MultivaluedMap<String, String> form;

    public HttpServletRequestWrapperPost(HttpServletRequest request,
            MultivaluedMap<String, String> form) {
        super(request);
        this.form = form;
    }

    @Override
    public String getParameter(String name) {
        String value = super.getParameter(name);
        if (value == null) {
            value = form.getFirst(name);
        }

        return value;
    }
}
