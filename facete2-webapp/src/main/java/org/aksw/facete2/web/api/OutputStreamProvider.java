package org.aksw.facete2.web.api;

import java.io.OutputStream;

public interface OutputStreamProvider
{
    OutputStream getOutputStream(String id);
}