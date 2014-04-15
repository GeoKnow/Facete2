package org.aksw.facete2.web.api;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.StreamingOutput;

import org.aksw.commons.util.StreamUtils;

public class StreamingOutputInputStream
    implements StreamingOutput {

    private InputStream in;
    
    public StreamingOutputInputStream(InputStream in) {
        this.in = in;
    }
    
    @Override
    public void write(OutputStream out) throws IOException,
            WebApplicationException
    {
        StreamUtils.copy(in, out, 4096);    
    }
}