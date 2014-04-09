BASE_DIR=/var/www/flux-client
mkdir -p $BASE_DIR/node_modules/moment/
mkdir -p $BASE_DIR/node_modules/topojson
wget http://spatial.mtri.org/flux/shared/topojson/topojson.min.js -O $BASE_DIR/node_modules/topojson/topojson.min.js
wget http://spatial.mtri.org/flux/shared/moment/moment.min.js -O $BASE_DIR/node_modules/moment/moment.min.js
