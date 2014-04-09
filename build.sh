sencha config -prop app.theme=ext-theme-neptune then app build

sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/chroma-js/chroma.min.js"></script>||g' build/production/Flux/index.html
sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/d3/d3.min.js"></script>||g' build/production/Flux/index.html
sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/topojson/topojson.min.js"></script>||g' build/production/Flux/index.html
sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/moment/moment.min.js"></script>||g' build/production/Flux/index.html



