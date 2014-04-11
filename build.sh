export PATH=/opt/SenchaSDKTools-2.0.0-beta3:$PATH
export SENCHA_SDK_TOOLS_2_0_0_BETA3="/opt/SenchaSDKTools-2.0.0-beta3"
export PATH=/home/kaendsle/bin/Sencha/Cmd/4.0.0.203:$PATH
export SENCHA_CMD_3_0_0="/home/kaendsle/bin/Sencha/Cmd/4.0.0.203"

sencha config -prop app.theme=ext-theme-neptune then app build

sed -i 's|<script type="text/javascript" src="/flux-client/d3.lib.colorbrewer.js"></script>||g' build/production/Flux/index.html
sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/d3/d3.min.js"></script>||g' build/production/Flux/index.html
sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/topojson/topojson.min.js"></script>||g' build/production/Flux/index.html
sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/moment/moment.min.js"></script>||g' build/production/Flux/index.html



