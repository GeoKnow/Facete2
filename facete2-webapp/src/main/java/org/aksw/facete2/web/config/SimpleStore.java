package org.aksw.facete2.web.config;

import java.util.List;
import java.util.Map;

public interface SimpleStore {
	/**
	 * 
	 * @param nextId If null, an ID gets allocated
	 * @param type
	 * @param provenance
	 * @param payload
	 * @return
	 * @throws Exception
	 */
    Integer store(Integer nextId, String type, String provenance, Map<String, Object> payload) throws Exception;
    boolean delete(String type, Long id) throws Exception;
    List<Map<String, Object>> load(String type, Long id) throws Exception;
}
