package org.aksw.facete2.web.api.geocode;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

public class FunctionMapList<V, W>
    implements Function<Iterable<? extends V>, List<W>>
{
    private Function<V, W> fn;

    public FunctionMapList(Function<V, W> fn) {
        this.fn = fn;
    }

    @Override
    public List<W> apply(Iterable<? extends V> vs) {

        List<W> result = new ArrayList<W>();
        for (V v : vs) {
            W w = fn.apply(v);
            result.add(w);
        }
        return result;
    }

    public static <K, V, W> FunctionMapList<V, W> map(Function<V, W> fn) {
        FunctionMapList<V, W> result = new FunctionMapList<V, W>(fn);
        return result;
    }
}

/*
 * public class FunctionMapList<K, V, W> implements Function<K, List<W>> {
 * private Function<K, List<V>> baseFn; private Function<V, W> transformFn;
 *
 * public FunctionMapList(Function<K, List<V>> baseFn, Function<V, W>
 * transformFn) { this.baseFn = baseFn; this.transformFn = transformFn; }
 *
 * @Override public List<W> apply(K arg) { List<V> tmp = baseFn.apply(arg);
 *
 * List<W> result = new ArrayList<W>(); for(V v : tmp) { W w =
 * transformFn.apply(v); result.add(w); } return result; }
 *
 *
 * public static <K, V, W> FunctionMapList<K, V, W> map(Function<K, List<V>>
 * baseFn, Function<V, W> transformFn) { FunctionMapList<K, V, W> result = new
 * FunctionMapList<K, V, W>(baseFn, transformFn); return result; } }
 */