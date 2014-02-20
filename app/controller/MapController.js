Ext.define('Flux.controller.MapController', {
    extend: 'Ext.app.Controller',

    init: function() {
        this.control({

            // Draws the D3 element(s) when their container(s) are ready    
            'd3panel > component[autoEl]': {
                boxready: this.initialize
            },

            'mapsettings > combo[name=basemap]': {
                select: this.handleBasemapChange
            }

        });
    },

    /**
        The spatial projection used (and shared) throughout the map visualizations.
     */
    projection: undefined,

    /**
        Set the spatial projection and begin D3 rendering.
        @param  cmp     {Ext.Component}
        @param  width   {Number}
        @param  height  {Number}
     */
    initialize: function (cmp, width, height) {
        this.projection = d3.geo.albersUsa();

        cmp.up('panel').render(this.projection, width, height)
    },

    handleBasemapChange: function (field, recs) {
        var query = Ext.ComponentQuery.query('d3geopanel');

        Ext.Array.each(query, function (cmp) {
            cmp.updateBasemap(recs.pop().get('url'))
        });
    }
});
