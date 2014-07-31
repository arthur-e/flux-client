Carbon Data Explorer (Web Client)
---------------------------------

############
# Overview #
############

The Carbon Data Explorer or `flux-client` is a JavaScript web application.
The application was written using the ExtJS and D3.js frameworks.
When built, it is portable to any web server and can be run on any modern web
browser (though [Google Chrome](https://www.google.com/chrome/browser/) is recommended).

#####################
## Supported Clients

While the Carbon Data Explorer was designed to be cross-platform compatible,
certain technological restrictions prevent it from being run in older browsers,
particularly those browsers that do not support SVG or CSS3 transitions.

| Client            | Supported version(s)       | Latest version (as of 2014-02-11) |
| ----------------- | -------------------------- | --------------------------------- |
| Google Chrome     | Version 31.0 or higher     | Version 32.0                      |
| Internet Explorer | Version 9 or higher (IE9+) | Version 11 (IE11)                 |
| Mozilla Firefox   | Version 26.0 or higher     | Version 27.0                      |
| Opera             | Version 19.0 or higher     | Version 19.0                      |
| Apple Safari      | Version 5.1 or higher      | Version 7.0                       |

###################
# Getting Started #
###################

The rest of this document is written for developers who need to download the
ExtJS and JavaScript dependencies to build the application.

######################
## Build Dependencies

The following are required for building the software:

* [The Sencha SDK](http://www.sencha.com/products/sdk-tools)
* [Sencha Cmd](http://www.sencha.com/products/sencha-cmd/download/)
* [ExtJS 4.2.1](http://www.sencha.com/products/extjs/download/ext-js-4.2.1/2281)

Finally, you will need Node.js and the Node Package Manager (NPM) to install
the remaining JavaScript dependencies.

### Installing the Sencha SDK

#### On GNU/Linux

    $ sudo chmod g+x SenchaSDKTools-2.0.0-beta3-linux-x64.run
    $ sudo ./SenchaSDKTools-2.0.0-beta3-linux-x64.run

A graphical installer should appear to guide you through the setup.
After the Sencha SDK Tools installer is finished...

    $ export PATH=/opt/SenchaSDKTools-2.0.0-beta3:$PATH
    $ export SENCHA_SDK_TOOLS_2_0_0_BETA3="/opt/SenchaSDKTools-2.0.0-beta3"
     
### Installing Sencha Cmd

#### On GNU/Linux

    $ sudo chmod g+x SenchaCmd-3.1.2.342-linux-x64.run

This shouldn't have to be run as root; if it does, you'll need to chown and chgrp the bin/ folder created in your home directory:

    $ ./SenchaCmd-3.1.2.342-linux-x64.run

A graphical installer again...
After the Sencha Cmd installer is finished...

    $ export PATH=~/bin/Sencha/Cmd/3.1.2.342:$PATH
    $ export SENCHA_CMD_3_0_0="~/bin/Sencha/Cmd/3.1.2.342"

### Installing Remaining Dependencies with Node.js and NPM

If you need to instal Node.js and NPM, refer to the `flux-server` documentation, `README.md`.
Installing the remaining dependencies is easy.
Navigate to the `flux-client` directory, where `package.json` is found, and execute:

    $ npm install

The installation process should automatically download a copy of ExtJS 4.2.1 and
put its contents into a subfolder `ext/`.

##############
## Deployment

When built, `flux-client` can be deployed by simpling placing it in a web-accessible directory.

**On GNU/Linux systems running Apache,** place the build directory into:

    /var/www/

**On Mac OS X systems running Apache,** place the build directory into:

    /Libary/WebServer/Documents/

The `flux-client` can then be accessed at `http://localhost/flux-client/` or `127.0.0.1/flux-client/`.

### Apache Server Configuration

If the `flux-server` is hosted on a different machine, you will need to set up
a proxy for the `/flux/` address; here is an example proxy with Apache.

    <Location /flux>
        ProxyPass http://127.0.0.1:8080/flux
        ProxyPassReverse http://127.0.0.1:8080/flux
        Order allow,deny
        Allow from all
    </Location>

#################
## Documentation

Documentation can be generated with docco. To install docco:

    sudo npm install docco -g

To generate the documentation:

    docco -l classic app/*.js app/controller/*.js app/field/*.js app/model/*.js app/store/*.js app/type/*.js app/view/*.js

#######################
# Repository Contents #
#######################

######################
## ExtJS Architecture

### Flux/app

This folder contains the JavaScript files for the application.

### Flux/resources

This folder contains static resources (typically an `"images"` folder as well).

### Flux/overrides

This folder contains override classes. All overrides in this folder will be 
automatically included in application builds if the target class of the override
is loaded.

### Flux/sass/etc

This folder contains misc. support code for sass builds (global functions, 
mixins, etc.)

### Flux/sass/src

This folder contains sass files defining css rules corresponding to classes
included in the application's javascript code build.  By default, files in this 
folder are mapped to the application's root namespace, 'Flux'. The
namespace to which files in this directory are matched is controlled by the
app.sass.namespace property in Flux/.sencha/app/sencha.cfg. 

### Flux/sass/var

This folder contains sass files defining sass variables corresponding to classes
included in the application's javascript code build.  By default, files in this 
folder are mapped to the application's root namespace, 'Flux'. The
namespace to which files in this directory are matched is controlled by the
app.sass.namespace property in Flux/.sencha/app/sencha.cfg. 
