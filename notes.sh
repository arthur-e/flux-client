################################################################################
# United States features #######################################################

# Get the Natural Earth dataset (1:50m cultural without large lakes)
wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_1_states_provinces_lakes.zip
unzip ne_50m_admin_1_states_provinces_lakes.zip

# Extract just American states and convert to GeoJSON
ogr2ogr -f "GeoJSON" -where "sr_adm0_a3 IN ('USA')" political-usa.json ne_50m_admin_1_states_provinces_lakes.shp

# Simplify to 10^-5 (0.00001) steradians, which is acceptable for this display
# See: http://en.wikipedia.org/wiki/Steradian#SI_multiples
topojson --id-property postal -s 0.000001 -o political-usa.topo.json political-usa.json

# Make a GeoJSON copy with reduced precision
rm political-usa.json; geojson --precision 3 political-usa.topo.json

# Change the keyword for accessing geometry to "basemap"
sed -i 's/political-usa/basemap/g' political-usa.topo.json

################################################################################
# North America features (political) ###########################################

# Get the Natural Earth dataset (1:10m cultural without large lakes)
wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_0_countries_lakes.zip
unzip ne_10m_admin_0_countries_lakes.zip

# Extract North American countries
ogr2ogr -f "GeoJSON" -where "adm0_a3 IN ('ATG', 'BHS', 'BLZ', 'BRB',
'CAN', 'CUB', 'CRI', 'DMA', 'DOM', 'GTM', 'GRD', 'HND', 'HTI', 'JAM', 'KNA',
'LCA', 'MEX', 'NIC', 'PAN', 'SLV', 'TTO', 'USA', 'VCT')" political-north-america.json ne_10m_admin_0_countries_lakes.shp

topojson --id-property adm0_a3 -s 0.000001 -o political-north-america.topo.json political-north-america.json
rm political-north-america.json; geojson --precision 3 political-north-america.topo.json
sed -i 's/political-north-america/basemap/g' political-north-america.topo.json

################################################################################
# Global features (political) ##################################################

ogr2ogr -f "GeoJSON" political.json ne_10m_admin_0_countries_lakes.shp
topojson --id-property adm0_a3 -s 0.00001 -o political.topo.json political.json
rm political.json; geojson --precision 3 political.topo.json
sed -i 's/political/basemap/g' political.topo.json

################################################################################
# Global features (small-scale, political) #####################################

ogr2ogr -f "GeoJSON" political-small.json ne_10m_admin_0_countries_lakes.shp
topojson --id-property adm0_a3 -s 0.0001 -o political-small.topo.json political-small.json
rm political-small.json; geojson --precision 3 political-small.topo.json
sed -i 's/political-small/basemap/g' political-small.topo.json
