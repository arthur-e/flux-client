Ext.define('Flux.controller.MapController', {
    extend: 'Ext.app.Controller',

    init: function () {
        var params = window.location.href.split('?'); // Get the HTTP GET query parameters, if any

        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        // If HTTP GET query parameters were specified, use them to set the
        //  application state
        if (params.length > 1) {
            params = Ext.Object.fromQueryString(params.pop());

            Ext.Object.each(params, function (key, value) {
                // Replace "true" or "false" (String) with Boolean
                if (value === 'true' || value === 'false') {
                    params[key] = value = (value === 'true');
                }

                // IMPORTANT: Makes sure that applyState() recalls the correct state
                Ext.state.Manager.set(key, {value: value})
            });

            Ext.Object.merge(this.defaultState, params);
        }

        this.control({

            // Draws the D3 element(s) when their container(s) are ready    
            'd3panel > component[autoEl]': {
                boxready: this.initialize,
                resize: this.handleResize
            }

        });
    },

    /**
        The default settings for map-related controls. These should match the
        settings on the components (with these keys as their `name` or 
        `stateId` attributes, which should be the same) i.e. the value of the
        `value` or `checked` attributes; currently this is ONLY needed for the
        ComboBox instances in the MapSettings panel.
     */
    defaultState: {
        basemap: { value: 'globalSmall' },
        projection: { value: 'equirectangular' }
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
        var basemapPicker = Ext.ComponentQuery.query('mapsettings > combo[name=basemap]').pop();
        var projPicker = Ext.ComponentQuery.query('mapsettings > combo[name=projection]').pop();
        var state = {};

        // Retrieve previous state, if any, or use default values
        Ext.Object.each(this.defaultState, function (key, value) {
            var result = Ext.state.Manager.get(key, value); // Second argument is default value
            state[key] = (result === undefined) ? value : result;
        });

        basemapPicker.getStore().add([
            ['usa', 'U.S.A.', '/flux-client/political-usa.topo.json'],
            ['northAmerica', 'North America', '/flux-client/political-north-america.topo.json'],
            ['global', 'Global', '/flux-client/political.topo.json'],
            ['globalSmall', 'Global (Small Scale)', '/flux-client/political-small.topo.json']
        ]);

        projPicker.getStore().add([
            ['equirectangular', 'Equirectangular (Plate Carrée)', d3.geo.equirectangular().scale(width * 0.15)],
            //['hammer', 'Hammer (Equal-Area)'],
            ['mercator', 'Mercator', d3.geo.mercator().scale(width * 0.15)],
            //['miller', 'Miller'],
            //['naturalEarth', 'Natural Earth'],
            //['robinson', 'Robinson']
        ]);

        // Initialize the the user interface for ComboBoxes
        Ext.Object.each(state, function (key, value) {
            var target = Ext.ComponentQuery.query('combo[name=' + key + ']')[0];
            if (target) {
                target.applyState(value);
            }
        });

        // Add additional listeners to fields AFTER their values have been set
        this.control({
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

        // Set the map projection
        this.projection = projPicker.getRecord().get('proj');

        cmp.up('panel')
            .render(this.projection, width, height)
            .setBasemap(state.basemap.value, basemapPicker.getRecord().get('url'), (function () {
                var kw = 'none';
                var basemapOutlines = Ext.ComponentQuery.query('mapsettings > checkbox[name=showBasemapOutlines]')[0].getValue();
                var politicalBoundaries = Ext.ComponentQuery.query('mapsettings > checkbox[name=showPoliticalBoundaries]')[0].getValue();

                if (basemapOutlines) {
                    kw = 'outer';
                } else {
                    kw = (politicalBoundaries) ? 'both' : 'none';
                }

                return kw;
            }()));
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

        if (checked) {
            switch (cb.getName()) {
                case 'showPoliticalBoundaries':
                keyword = 'both';
                break;

                case 'showBasemapOutlines':
                keyword = 'outer';
                // Disable the next field if showBasemapOutlines is checked
                cb.up('panel').down('checkbox[name=showPoliticalBoundaries]').disable();
                break;
            }

        } else {
            if (cb.up('mapsettings').down('checkbox[name=showPoliticalBoundaries]').getValue()) {
                keyword = 'both';
            } else {
                keyword = 'none';
            }

            // Enable the next field if showBasemapOutlines is unchecked
            if (cb.getName() === 'showBasemapOutlines') {
                cb.up('panel').down('checkbox[name=showPoliticalBoundaries]').enable();
            }
        }

        // For every d3geopanel instance, update the basemap
        Ext.Array.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            cmp.setBasemap(basemap.get('id'), basemap.get('url'), keyword);
        });
    }
    
});


