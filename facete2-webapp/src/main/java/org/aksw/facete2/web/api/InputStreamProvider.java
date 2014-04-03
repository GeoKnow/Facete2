package org.aksw.facete2.web.api;

import java.io.InputStream;

public interface InputStreamProvider
{
    InputStream getInputStream(String id);
}