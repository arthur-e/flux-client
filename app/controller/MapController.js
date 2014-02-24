Ext.define('Flux.controller.MapController', {
    extend: 'Ext.app.Controller',

    init: function() {
        this.control({

            // Draws the D3 element(s) when their container(s) are ready    
            'd3panel > component[autoEl]': {
                boxready: this.initialize
            },

            // Handles change in the basemap
            'mapsettings > combo[name=basemap]': {
                select: this.handleBasemapChange
            },

            // Handles change in the projection
            'mapsettings > combo[name=projection]': {
                select: this.handleProjectionChange
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
        var projPicker = Ext.ComponentQuery.query('mapsettings > combo[name=projection]').pop();

        projPicker.getStore().add([
            ['equirectangular', 'Equirectangular (Plate Carrée)', d3.geo.equirectangular().scale(width * 0.15)],
            //['hammer', 'Hammer (Equal-Area)'],
            ['mercator', 'Mercator', d3.geo.mercator().scale(width * 0.15)],
            //['miller', 'Miller'],
            //['naturalEarth', 'Natural Earth'],
            //['robinson', 'Robinson']
        ]);

        projPicker.setValue('equirectangular'); // Initialize ComboBox displayed value

        // Set the map projection
        this.projection = d3.geo.equirectangular().scale(width * 0.15);

        cmp.up('panel').render(this.projection, width, height)
    },

    /**
        Handles a change in the basemap.
        @param  field   {Ext.form.field.Combo}
        @param  recs    {Array}
     */
    handleBasemapChange: function (field, recs) {
        var query = Ext.ComponentQuery.query('d3geopanel');
        var rec = recs.pop();

        // For every d3geopanel instance, update the basemap
        Ext.Array.each(query, function (cmp) {
            cmp.setBasemap(rec.get('id'), rec.get('url'));
        });
    },

    /**
        Handles a change in the map projection.
        @param  field   {Ext.form.field.Combo}
        @param  recs    {Array}
     */
    handleProjectionChange: function (field, recs) {
        var query = Ext.ComponentQuery.query('d3geopanel');
        var rec = recs.pop();

        // For every d3geopanel instance, update the projection
        Ext.Array.each(query, function (cmp) {
            cmp.setProjection(rec.get('proj'));
        });
    }
    
});


