BUILD_DIR=/home/arthur/Source/
USERNAME=kaendsle

echo "Installing Ruby..."
sudo apt-get install ruby ruby1.9.1

echo "Downloading ExtJS library..."
sudo mkdir -p /var/www/static/extjs/
sudo chown $USERNAME /var/www/static/extjs
cd /var/www/static/extjs
wget http://cdn.sencha.com/ext/gpl/ext-4.2.1-gpl.zip
unzip ext-4.2.1-gpl.zip
mv ext.4.2.1.883 /var/www/static/extjs/4.2.1

echo "Installing Sencha SDK..."
cd $BUILD_DIR
wget http://cdn.sencha.io/sdk-tools/SenchaSDKTools-2.0.0-beta3-linux-x64.run
sudo chmod +x SenchaSDKTools-2.0.0-beta3-linux-x64.run
sudo ./SenchaSDKTools-2.0.0-beta3-linux-x64.run
# Graphical installer should start up... Install to /opt/ by default
# After the Sencha SDK Tools installer is finished...
export PATH=/opt/SenchaSDKTools-2.0.0-beta3:$PATH
export SENCHA_SDK_TOOLS_2_0_0_BETA3="/opt/SenchaSDKTools-2.0.0-beta3"

echo "Installing Sencha Cmd..."
cd $BUILD_DIR
wget http://cdn.sencha.com/cmd/4.0.2.67/SenchaCmd-4.0.2.67-linux-x64.run.zip
unzip SenchaCmd-4.0.2.67-linux-x64.run.zip
sudo chmod +x SenchaCmd-4.0.2.67-linux-x64.run
# This shouldn't have to be run as root; if it does, you'll need to chown and chgrp the bin/ folder created in your home directory
./SenchaCmd-4.0.2.67-linux-x64.run
# Graphical installer again...
# After the Sencha Cmd installer is finished...
export PATH=/home/$USERNAME/bin/Sencha/Cmd/4.0.2.67:$PATH
export SENCHA_CMD_4_0_2="/home/kaendsle/bin/Sencha/Cmd/4.0.2.67"
