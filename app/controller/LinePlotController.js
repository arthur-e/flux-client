Ext.define('Flux.controller.LinePlotController', {
    extend: 'Ext.app.Controller',

    requires: [
    ],

    init: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            'd3lineplot > component[autoEl]': {
                boxready: this.initialize
            }

        });
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    initialize: function (cmp, width, height) {
        cmp.up('d3lineplot').init(width, height);
    }

});




