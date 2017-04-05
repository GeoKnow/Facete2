package org.aksw.facete2.web.api.geocode;

import com.google.common.base.Function;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.io.ParseException;
import com.vividsolutions.jts.io.WKTReader;

import fr.dudie.nominatim.model.Address;

public class FunctionNominatimAddressToGeometry
    implements Function<Address, Geometry>
{
    private WKTReader wktReader = new WKTReader();

    @Override
    public Geometry apply(Address address) {
        String wkt = address.getWkt();

        if(wkt == null) {
            wkt = "POINT(" + address.getLongitude() + " " + address.getLatitude() + ")";
        }

        Geometry result;
        try {
            result = wktReader.read(wkt);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
        return result;
    }

    public static final FunctionNominatimAddressToGeometry fn = new FunctionNominatimAddressToGeometry();
}