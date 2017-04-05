package org.aksw.facete2.web.api.geocode;

import org.aksw.jena_sparql_api.lookup.LookupService;
import org.aksw.jena_sparql_api.lookup.LookupServiceTransformValue;

import com.google.common.base.Function;


public class FluentLookupService<K, V> {
    private LookupService<K, V> ls;

    public FluentLookupService(LookupService<K, V> ls) {
        this.ls = ls;
    }

    public <W> FluentLookupService<K, W> transformValue(Function<? super V, W> fn) {
        return FluentLookupService.from(
                LookupServiceTransformValue.create(ls, fn));
    }

    public LookupService<K, V> create() {
        return ls;
    }

    public static <K, V> FluentLookupService<K, V> from(LookupService<K, V> ls) {
        FluentLookupService<K, V> result = new FluentLookupService<K, V>(ls);
        return result;
    }
}
