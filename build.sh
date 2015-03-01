export PATH=/opt/SenchaSDKTools-2.0.0-beta3:$PATH
export SENCHA_SDK_TOOLS_2_0_0_BETA3="/opt/SenchaSDKTools-2.0.0-beta3"
export PATH=/home/mgbillmi/bin/Sencha/Cmd/4.0.5.87:$PATH
export SENCHA_CMD_3_0_0="/home/mgbillmi/bin/Sencha/Cmd/3.1.2.342"

sencha config -prop app.theme=ext-theme-neptune then app build

if [ -d build ]; then

  sed -i 's|<script type="text/javascript" src="/flux-client/d3.lib.colorbrewer.js"></script>||g' build/production/Flux/index.html
  sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/d3/d3.min.js"></script>||g' build/production/Flux/index.html
  sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/topojson/topojson.min.js"></script>||g' build/production/Flux/index.html
  sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/moment/moment.min.js"></script>||g' build/production/Flux/index.html
  sed -i 's|<script type="text/javascript" src="/flux-client/node_modules/queue-async/queue.min.js"></script>||g' build/production/Flux/index.html

  if [ -e build/production/Flux/git.log ]; then

    git log > build/production/Flux/git.log

  fi
fi
