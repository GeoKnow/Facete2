package org.aksw.facete2.web.api.geocode;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.aksw.jena_sparql_api.lookup.LookupService;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.DefaultHttpClient;

import com.vividsolutions.jts.geom.Geometry;

import fr.dudie.nominatim.client.JsonNominatimClient;
import fr.dudie.nominatim.client.NominatimClient;
import fr.dudie.nominatim.client.NominatimOptions;
import fr.dudie.nominatim.client.request.NominatimSearchRequest;
import fr.dudie.nominatim.client.request.paramhelper.PolygonFormat;
import fr.dudie.nominatim.model.Address;
import io.reactivex.Flowable;

public class LookupServiceNominatim
    implements LookupService<String, List<Address>>
{
    private NominatimClient nominatimClient;

    public LookupServiceNominatim(NominatimClient nominatimClient) {
        this.nominatimClient = nominatimClient;
    }

    @Override
    public Flowable<Entry<String, List<Address>>> apply(Iterable<String> keys) {
        Map<String, List<Address>> result = new HashMap<String, List<Address>>();

        for(String key : keys) {
            List<Address> addresses;
            try {
                NominatimSearchRequest r = new NominatimSearchRequest();
                r.setPolygonFormat(PolygonFormat.TEXT);
                r.setQuery("italy");

                addresses = nominatimClient.search(r);

                //addresses = nominatimClient.search("italy");
            } catch (IOException e) {
                throw new RuntimeException();
            }
            result.put(key, addresses);
        }
        return Flowable.fromIterable(result.entrySet());
    }

    public static LookupServiceNominatim createDefault(String email) {
        HttpClient httpClient = new DefaultHttpClient();
        NominatimOptions options = new NominatimOptions();
        options.setPolygonFormat(PolygonFormat.TEXT);
        NominatimClient nominatimClient = new JsonNominatimClient("http://nominatim.openstreetmap.org/", httpClient, email, options);
        LookupServiceNominatim result = new LookupServiceNominatim(nominatimClient);

        return result;
    }

    public static void geocode(Iterable<String> iris, LookupService<String, String> iriToLocator) {

    }

    public static void main(String[] args) {
        LookupService<String, List<Geometry>> ls = FluentLookupService
                .from(LookupServiceNominatim.createDefault("cstadler@informatik.uni-leipzig.de"))
                .transformValue(FunctionMapList.map(FunctionNominatimAddressToGeometry.fn))
                .create();

        Map<String, List<Geometry>> map = ls.fetchMap(Arrays.asList("salerno, italy"));


        //Map<String, List<Address>> map = ls.lookup(Arrays.asList("italy"));


        System.out.println(map);
    }
}
