Ext.define('Flux.controller.MapController', {
    extend: 'Ext.app.Controller',

    init: function() {
        this.control({

            // Draws the D3 element(s) when their container(s) are ready    
            'd3panel > component[autoEl]': {
                boxready: this.initialize,
                resize: this.handleResize
            },

            // Handles change in the basemap
            'mapsettings > combo[name=basemap]': {
                select: this.handleBasemapChange
            },

            // Handles change in the projection
            'mapsettings > combo[name=projection]': {
                select: this.handleProjectionChange
            },

            'mapsettings > checkbox[cls=basemap-options]': {
                change: this.toggleBasemapStyle
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
        var basemapPicker = Ext.ComponentQuery.query('mapsettings > combo[name=basemap]').pop();

        basemapPicker.getStore().add([
            ['usa', 'U.S.A.', '/flux-client/political-usa.topo.json'],
            ['northAmerica', 'North America', '/flux-client/political-north-america.topo.json'],
            ['global', 'Global', '/flux-client/political.topo.json'],
            ['globalSmall', 'Global (Small Scale)', '/flux-client/political-small.topo.json']
        ]);

        basemapPicker.setValue('globalSmall');

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

        cmp.up('panel')
            .render(this.projection, width, height)
            .setBasemap('globalSmall', '/flux-client/political-small.topo.json');
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

        this.projection = rec.get('proj');
    },

    /**
        Handles changes in the size of the D3 drawing area by replacing the
        SVG element with a new instance.
        @param  cmp         {Ext.Component}
        @param  width       {Number}        The resized width
        @param  height      {Number}        The resized height
        @param  oldWidth    {Number}        The original width
        @param  oldHeight   {Number}        The original height
     */
    handleResize: function (cmp, width, height, oldWidth, oldHeight) {
        var basemap;
        // oldWidth and oldHeight undefined when 'resize' event fires as part
        //  of the initial layout; we want to avoid acting on this firing
        if (oldWidth && oldHeight && width !== oldWidth && height !== oldHeight) {
            basemap = Ext.ComponentQuery.query('mapsettings > combo[name=basemap]').pop().getRecord();

            cmp.up('panel')
                .render(this.projection, width, height)
                .setBasemap(basemap.get('id'), basemap.get('url'));
        }
    },

    /**
        Changes the style of the basemap, toggling between two different choices
        rendered as checkboxes in the MapSettings panel.
        @param  cb      {Ext.form.field.Checkbox}
        @param  checked {Boolean}
     */
    toggleBasemapStyle: function (cb, checked) {
        var basemap = Ext.ComponentQuery.query('mapsettings > combo[name=basemap]').pop().getRecord();
        var keyword;

        switch (cb.getSubmitValue()) {
            case 'showPoliticalBoundaries':
            keyword = 'both';
            break;

            case 'showBasemapOutlines':
            keyword = 'outer';
            break;

            default:
            if (cb.up('mapsettings').down('#show-political-boundaries').getValue()) {
                keyword = 'both';
            } else {
                keyword = 'none';
            }
        }

        // For every d3geopanel instance, update the basemap
        Ext.Array.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            cmp.setBasemap(basemap.get('id'), basemap.get('url'), keyword);
        });
    }
    
});


