# NY_Population_Density

## Data Preparation

* Download shapefile

From [Census Bureau website](http://www2.census.gov/geo/tiger/GENZ2016/shp/) New York(FIPS code 36) State in ACS 2016 5-year estimate
    ```
    curl 'http://www2.census.gov/geo/tiger/GENZ2016/shp/cb_2016_36_tract_500k.zip' -o cb_2016_36_tract_500k.zip
    unzip -o cb_2015_36_tract_500k.zip
    ```

* Convert .shp to GeoJSON

    ```
    npm install -g shapefile
    shp2json cb_2015_36_tract_500k.zip -o NY.json
    ```

* Apply geographic [projection](https://github.com/veltman/d3-stateplane)

    ```
    npm install -g d3-geo-projection
    geoproject 'd3.geoConicEqualArea().parallels([40.5, 41.5]).rotate([74, 0]).fitSize([960, 960], d)' < NY.json > NY-albers.json
    ```
    
* Enter newline-delimited JSON
    ```
    npm install -g ndjson-cli
    ndjson-split 'd.features' < NY-albers.json > NY-albers.ndjson
    | ndjson-map 'd.id = d.properties.GEOID.slice(2), d' < NY-albers.ndjson > NY-albers-id.ndjson
    ```

* Download population file and convert to ndjson
    ```
    curl 'http://api.census.gov/data/2015/acs5?get=B01003_001E&for=tract:*&in=state:36' -o cb_2015_36_tract_B01003.json
    ndjson-cat cb_2015_36_tract_B01003.json | ndjson-split 'd.slice(1)' | ndjson-map '{id: d[2] + d[3], B01003: +d[0]}' > cb_2015_36_tract_B01003.ndjson
    ```
    
* Join population data to the geometry and compute population density
    ```
    ndjson-join 'd.id' NY-albers-id.ndjson cb_2015_36_tract_B01003.ndjson > NY-albers-join.ndjson
    ndjson-map 'd[0].properties = {density: Math.floor(d[1].B01003 / d[0].properties.ALAND * 2589975.2356)}, d[0]' < NY-albers-join.ndjson > NY-albers-density.ndjson
    ```

* Convert back to GeoJson
    ```
    ndjson-reduce < NY-albers-density.ndjson | ndjson-map '{type: "FeatureCollection", features: d}' > NY-albers-density.json
    ```
    
* Convert GeoJson to TopoJson and reduce size

Resulting NY-quantized-topo.json is used to display tracts boarders.

    ```
    npm install -g topojson
    geo2topo -n tracts=NY-albers-density.ndjson > NY-tracts-topo.json
    | toposimplify -p 1 -f < NY-tracts-topo.json > NY-simple-topo.json
    | topoquantize 1e5 < NY-simple-topo.json > NY-quantized-topo.json
    ```
    
* Compute county geometry 

Resulting NY-merge-topo.json is used to display county boundary

    ```
    topomerge -k 'd.id.slice(0, 3)' counties=tracts < NY-quantized-topo.json > NY-merge-topo.json
    ```
    
* Compute county internal boarders

Resulting NY-topo.json is used to hide state boundary

    ```
    topomerge --mesh -f 'a !== b' counties=counties < NY-merge-topo.json > NY-topo.json
    ```

## Visulization

https://wenzi3241.github.io/NY_Population_Density/

## Reference

* [Command-Line Cartography](https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c)

* [Mapshaper](http://mapshaper.org/)

* [California Population Density by Mike Bostock](https://bl.ocks.org/mbostock/5562380) 
