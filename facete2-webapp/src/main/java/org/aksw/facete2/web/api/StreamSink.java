package org.aksw.facete2.web.api;



public interface StreamSink
    extends OutputStreamProvider, InputStreamProvider
{
    boolean doesExist(String id);
    
    boolean rename(String oldId, String newId);
}