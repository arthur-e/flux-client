Ext.define('Flux.controller.MapController', {
    extend: 'Ext.app.Controller',

    init: function() {
        this.control({
            '#d3content': {
                boxready: this.initialize
            }
        });
    },

    /**
        The spatial projection used (and shared) throughout the map visualizations.
     */
    projection: undefined,

    initialize: function (panel, width, height) {
        this.projection = d3.geo.albersUsa();

        panel.up('panel').render(this.projection, width, height)
    }
});
