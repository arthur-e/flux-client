USERNAME=$USER
BUILD_DIR=/home/$USERNAME/Source/
EXT_DIR=/var/www/static/extjs

echo "Installing Ruby..."
sudo apt-get install ruby ruby1.9.1

echo "Downloading ExtJS library..."
sudo mkdir -p $EXT_DIR
sudo chown $USERNAME $EXT_DIR
(cd $EXT_DIR && wget http://cdn.sencha.com/ext/gpl/ext-4.2.1-gpl.zip)
(cd $EXT_DIR && unzip ext-4.2.1-gpl.zip)
mv $EXT_DIR/ext.4.2.1.883 $EXT_DIR/4.2.1

echo "Installing Sencha SDK..."
cd $BUILD_DIR
sudo wget http://cdn.sencha.io/sdk-tools/SenchaSDKTools-2.0.0-beta3-linux-x64.run
sudo chmod +x SenchaSDKTools-2.0.0-beta3-linux-x64.run
sudo ./SenchaSDKTools-2.0.0-beta3-linux-x64.run
# Graphical installer should start up... Install to /opt/ by default
# After the Sencha SDK Tools installer is finished...
export PATH=/opt/SenchaSDKTools-2.0.0-beta3:$PATH
export SENCHA_SDK_TOOLS_2_0_0_BETA3="/opt/SenchaSDKTools-2.0.0-beta3"

echo "Installing Sencha Cmd..."
cd $BUILD_DIR
wget http://cdn.sencha.com/cmd/4.0.5.87/SenchaCmd-4.0.5.87-linux-x64.run.zip
unzip SenchaCmd-4.0.5.87-linux-x64.run.zip
sudo chmod +x SenchaCmd-4.0.5.87-linux-x64.run
# This shouldn't have to be run as root; if it does, you'll need to chown and chgrp the bin/ folder created in your home directory
./SenchaCmd-4.0.5.87-linux-x64.run
# Graphical installer again...
# After the Sencha Cmd installer is finished...
export PATH=/home/$USERNAME/bin/Sencha/Cmd/4.0.5.87:$PATH
export SENCHA_CMD_4_0_5="/home/$USERNAME/bin/Sencha/Cmd/4.0.5.87"
