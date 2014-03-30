Ext.define('Flux.controller.MapController', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'mapSettings',
        selector: 'mapsettings'
    }, {
        ref: 'symbology',
        selector: 'symbology'
    }],

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

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            // Draws the D3 element(s) when their container(s) are ready    
            'd3panel > component[autoEl]': {
                boxready: this.initialize,
                resize: this.onResize
            },

            'symbology #paletteType': {
                change: this.onScaleParameterChange
            },

            'symbology container[name=domain]': {
                boundschange: this.onScaleParameterChange
            },

            'symbology field[name=autoscale]': {
                change: this.onScaleParameterChange
            },

            'symbology field[name=palette]': {
                select: this.onPaletteChange
            },

            'symbology field[name=segments]': {
                change: this.onScaleParameterChange
            },

            'symbology field[name=sigmas]': {
                change: this.onScaleParameterChange
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

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Set the spatial projection and begin D3 rendering.
        @param  cmp     {Ext.Component}
        @param  width   {Number}
        @param  height  {Number}
     */
    initialize: function (cmp, width, height) {
        var basemapPicker = this.getMapSettings().down('combo[name=basemap]');
        var projPicker = this.getMapSettings().down('combo[name=projection]');
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
            //['miller', 'Miller'],
            //['naturalEarth', 'Natural Earth'],
            //['robinson', 'Robinson'],
            ['mercator', 'Mercator', d3.geo.mercator().scale(width * 0.15)]
        ]);

        // Initialize the the user interface for ComboBoxes
        Ext.Object.each(state, function (key, value) {
            var target = Ext.ComponentQuery.query('combo[name=' + key + ']')[0];
            if (target) {
                target.applyState(value);
            }
        });

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        // Add additional listeners to fields AFTER their values have been set
        this.control({
            // Handles change in the basemap
            'mapsettings > combo[name=basemap]': {
                select: this.onBasemapChange
            },

            // Handles change in the projection
            'mapsettings > combo[name=projection]': {
                select: this.onProjectionChange
            },

            'mapsettings > checkbox[cls=basemap-options]': {
                change: this.toggleBasemapStyle
            }

        });

        // Set the map projection
        this.projection = projPicker.getRecord().get('proj');

        // Set the name of the map projection as the projectionId
        cmp.up('panel')._projectionId = projPicker.getRecord().get('id');
        cmp.up('panel')
            .render(this.projection, width, height)
            .setBasemap(state.basemap.value, basemapPicker.getRecord().get('url'),
                Ext.Function.bind(function () {
                    var kw = 'none';
                    var basemapOutlines = this.getMapSettings().down('checkbox[name=showBasemapOutlines]').getValue();
                    var politicalBoundaries = this.getMapSettings().down('checkbox[name=showPoliticalBoundaries]').getValue();

                    if (basemapOutlines) {
                        kw = 'outer';
                    } else {
                        kw = (politicalBoundaries) ? 'both' : 'none';
                    }

                    return kw;
            }, this)());

    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Handles a change in the basemap.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onBasemapChange: function (c, recs) {
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            // For every d3geopanel instance, update the basemap
            cmp.setBasemap(recs[0].get('id'), recs[0].get('url'));
        });
    },

    /**
        Sets the new color scale given a change in the color palette selection.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onPaletteChange: function (c, recs) {
        var cs = recs[0].get('colors');
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            // For every d3geopanel instance, update the scale's output range
            if (cmp.getScale()) {
                cmp.setScale(cmp.getScale().range(cs));
            }
        });
    },

    /**
        Handles a change in the map projection.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onProjectionChange: function (c, recs) {
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            // For every d3geopanel instance, update the projection
            cmp.setProjection(recs[0].get('proj'), recs[0].get('id')).update();
        });

        this.projection = recs[0].get('proj');
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
    onResize: function (cmp, width, height, oldWidth, oldHeight) {
        var basemap;
        // oldWidth and oldHeight undefined when 'resize' event fires as part
        //  of the initial layout; we want to avoid acting on this firing
        if (oldWidth && oldHeight && width !== oldWidth && height !== oldHeight) {
            basemap = this.getMapSettings().down('combo[name=basemap]').getRecord();
            cmp.up('panel')
                .render(this.projection, width, height)
                .setBasemap(basemap.get('id'), basemap.get('url'))
                .draw();

            cmp.updateLegend();
        }
    },

    /**
        Handles a change in the configuration of a color scale; either the
        number of standard deviations (sigmas) or the number of segments in the
        color scale.
        @param  c       {Ext.form.field.*}
        @param  value   {Number}
     */
    onScaleParameterChange: function (c, value)  {
        var cfg = {}
        cfg[c.getName()] = value;
        this.updateColorScale(cfg);
    },

    /**
        Changes the style of the basemap, toggling between two different choices
        rendered as checkboxes in the MapSettings panel.
        @param  cb      {Ext.form.field.Checkbox}
        @param  checked {Boolean}
     */
    toggleBasemapStyle: function (cb, checked) {
        var basemap = this.getMapSettings().down('combo[name=basemap]').getRecord();
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
            if (this.getMapSettings().down('checkbox[name=showPoliticalBoundaries]').getValue()) {
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
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            cmp.setBasemap(basemap.get('id'), basemap.get('url'), keyword);
        });
    },

    /**
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  config      {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
        @param  metadata    {Flux.model.Metadata}
     */
    updateColorScale: function (config, metadata) {
        var palette, scale;
        var opts = this.getSymbology().getForm().getValues();

        opts = Ext.Object.merge(opts, config);

        // Get the color palette
        palette = this.getStore('palettes').getById(opts.palette);

        if (!metadata) {
            metadata = this.getStore('metadata').getAt(0);
        }

        if (!palette || !metadata) {
            return;
        }

        // Get a scale; set the output range
        scale = metadata.getQuantileScale(opts).range(palette.get('colors'));

        // Update the scale of every map
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            cmp.setScale(scale);
        });
    }
    
});


