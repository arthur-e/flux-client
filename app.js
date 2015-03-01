/*
    This file is generated and updated by Sencha Cmd. You can edit this file as
    needed for your application, but these edits will have to be merged by
    Sencha Cmd when upgrading.
*/

//@require d3.lib.colorbrewer.js
//@require node_modules/d3/d3.min.js
//@require node_modules/topojson/topojson.min.js
//@require node_modules/moment/moment.min.js
//@require node_modules/queue-async/queue.min.js

Ext.Loader.require('Ext.data.Types', function () {
    Ext.Loader.require('Flux.type.Moment');
});

Ext.application({
    name: 'Flux',

    extend: 'Flux.Application',
    
    autoCreateViewport: true,

    launch: function () {
        Ext.String.addCharacterEntities({
            '&mu;': 'μ',
            '&sup2;': '²'
        });

        // Polyfills ///////////////////////////////////////////////////////////
        // A more Pythonic trim that accepts extra characters
        String.prototype.trim = function (t) {
            t = t || '';
            return this.replace(RegExp('^[' + t + '\\s]+|[' + t + '\\s]+$', ['g']), '');
        };

        // Overrides ///////////////////////////////////////////////////////////
        Ext.override(Ext.form.field.ComboBox, {
            stateEvents: ['select']
        });

        Ext.override(Ext.form.RadioGroup, {
            getState: function () {
                return {
                    value: this.getValue()
                }
            }
        });

        // Initialization and Managers /////////////////////////////////////////
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

    }
});
