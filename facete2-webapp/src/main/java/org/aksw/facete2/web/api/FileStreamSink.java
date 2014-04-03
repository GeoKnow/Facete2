package org.aksw.facete2.web.api;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

public class FileStreamSink
    implements StreamSink
{
    private String basePath;
    
    public FileStreamSink(String basePath) {
        this.basePath = basePath;
    }
    
    public String getPath() {
        return this.basePath;
    }
    
    public File getFile(String id) {
        if(basePath == null) {
            throw new RuntimeException("basePath file storage not set " + this);
        }
        
        File result = new File(basePath + "/" + id);
        return result;
    }
    
    
    public boolean doesExist(String id) {
        File file = getFile(id);
        boolean result = file.exists();
        return result;
    }
    
    public boolean delete(String id) {
        File file = getFile(id);
        boolean result = file.delete();
        return result;
    }

    @Override
    public InputStream getInputStream(String id) {
        File file = getFile(id);
        
        InputStream result;
        try {
            result = new FileInputStream(file);
        } catch (FileNotFoundException e) {
            throw new RuntimeException(e);
        }
        return result;
    }
    
    @Override
    public OutputStream getOutputStream(String id) {
        File file = getFile(id);
        
        File parentFile = file.getParentFile();
        if(parentFile != null) {
            parentFile.mkdirs();
        }
        
        
        OutputStream result;
        try {
            result = new FileOutputStream(file);
        } catch (FileNotFoundException e) {
            throw new RuntimeException(e);
        }
        return result;
    }
    
    @Override
    public boolean rename(String oldId, String newId) {
        File oldFile = getFile(oldId);
        File newFile = getFile(newId);
        boolean result = oldFile.renameTo(newFile);
        return result;
    }
}