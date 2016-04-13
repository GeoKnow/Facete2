package org.aksw.facete2.web.api;

import org.apache.jena.sparql.engine.binding.Binding;

public class BindingMapperPassThrough
    implements BindingMapper<Binding>
{
    public Binding map(Binding binding, long rowNum) {
        return binding;
    }
}