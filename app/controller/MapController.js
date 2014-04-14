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

        ////////////////////////////////////////////////////////////////////////
        // Event Listeners /////////////////////////////////////////////////////

        this.control({

            // Draws the D3 element(s) when their container(s) are ready    
            'd3geopanel > component[autoEl]': {
                boxready: this.initialize,
                resize: this.onResize
            },

            'mapsettings checkbox[name=showLegends]': {
                change: this.onLegendDisplayChange
            },

            'symbology #palette-type': {
                change: this.onScaleParameterChange
            },

            'symbology #reverse-palette': {
                change: this.onScaleParameterChange
            },

            'symbology #threshold-toggle': {
                change: this.onScaleParameterChange
            },

            'symbology enumslider': {
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
        Creates a threshold scale; a hack that acts like a d3.scale.* object.
        The result is a function that returns the specified color value for
        input numeric values that fall within the integer bounds of the given
        breakpoint(s).
        @param  bkpts   {Array}     The breakpoint(s) for the binary mask
        @param  colors  {String}    The color to use for the binary mask
        @return         {Function}
     */
    generateThresholdScale: function (bkpts, color) {
        var scale;

        if (!Ext.isArray(bkpts)) {
            bkpts = [bkpts];
        }

        if (bkpts.length === 1) {
            scale = function (d) {
                if (d >= Math.floor(bkpts[0]) && d < (Math.floor(bkpts[0]) + 1)) {
                    return color;
                }

                return 'rgba(0,0,0,0)';
            };

        } else {
            scale = function (d) {
                if (d >= bkpts[0] && d < bkpts[1]) {
                    return color;
                }

                return 'rgba(0,0,0,0)';
            };

        }

        scale._d = bkpts;
        scale._r = [color];
        scale.domain = function (d) {
            if (d) {
                this._d = d;
                return this;
            }
            return this._d;
        };
        scale.range = function (r) {
            if (r) {
                if (Ext.isArray(r)) {
                    r = [r[0]];
                } else {
                    r = [r];
                }
                this._r = r;
                return this;
            }
            return this._r;
        };

        return scale;
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Set the spatial projection and begin D3 rendering.
        @param  cmp     {Ext.Component}
        @param  width   {Number}
        @param  height  {Number}
     */
    initialize: function (cmp, width, height) {
        var opts = this.getMapSettings().getForm().getValues();
        var kw = (Ext.Function.bind(function () {
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

        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            cmp.render(opts.projection, width, height)
                .setBasemap(opts.basemap, kw);
        });

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
        Handles a change in the Checkbox as to whether or not to display the legend.
        @param  c       {Ext.form.field.CheckBox}
        @param  state   {Boolean}
     */
    onLegendDisplayChange: function (c, state) {
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            cmp.toggleLegend(state);
        });
    },

    /**
        Sets the new color scale given a change in the color palette selection.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onPaletteChange: function (c, recs) {
        var cs = recs[0].get('colors');
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), Ext.Function.bind(function (cmp) {
            // For every d3geopanel instance, update the scale's output range
            if (cmp.getScale()) {
                if (typeof cmp.getScale().quantiles === 'function') {
                    cmp.setScale(cmp.getScale().range(cs));
                } else {
                    this.updateColorScale();
                }
            }
        }, this));
    },

    /**
        Handles a change in the map projection.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onProjectionChange: function (c, recs) {
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (cmp) {
            if (cmp.getProjection().id === recs[0].get('id')) {
                return;
            }

            // For every d3geopanel instance, update the projection
            cmp.setProjection(recs[0].get('id')).update();
        });
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
            basemap = this.getMapSettings().down('combo[name=basemap]').getValue();

            // Update the projections ComboBox; rescale each projection contained
            cmp.up('panel')
                .render(this.getMapSettings().down('combo[name=projection]').getValue(),
                    width, height)
                .setBasemap(basemap)
                .draw()
                .updateLegend()
                .updateDisplay();
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
        var basemap = this.getMapSettings().down('combo[name=basemap]').getValue();
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
            cmp.setBasemap(basemap, keyword);
        });
    },

    /**
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  config      {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
     */
    updateColorScale: function (config) {
        var palette, scale;
        var opts = this.getSymbology().getForm().getValues();

        opts = Ext.Object.merge(opts, config);

        // Get the color palette
        palette = this.getStore('palettes').getById(opts.palette);

        // Update the scale of every map
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), Ext.Function.bind(function (cmp) {
            var metadata = cmp.getMetadata();
            if (!metadata) {
                return;
            }

            if (opts.threshold) {
                scale = this.generateThresholdScale(opts.thresholdValues, palette.get('colors')[0]);
            } else {
                scale = metadata.getQuantileScale(opts).range(palette.get('colors'));
            }

            cmp.setScale(scale);
        }, this));
    }
    
});



