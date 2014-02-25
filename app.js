/*
    This file is generated and updated by Sencha Cmd. You can edit this file as
    needed for your application, but these edits will have to be merged by
    Sencha Cmd when upgrading.
*/

//@require node_modules/chroma-js/chroma.min.js
//@require node_modules/d3/d3.min.js
//@require node_modules/topojson/topojson.min.js



Ext.application({
    name: 'Flux',

    extend: 'Flux.Application',
    
    autoCreateViewport: true,

    require: [
        'Ext.Array',
        'Ext.view.View'
    ],

    launch: function () {
        Ext.override(Ext.form.field.Checkbox, {
            inputValue: true
        });
    }
});
