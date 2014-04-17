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

            'd3geopanel': {
                resize: this.onResize
            },

            'd3geopanel > component[autoEl]': {
                boxready: this.initialize
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

        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
            view.init(width, height)
                .setProjection(opts.projection, width, height)
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
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
            // For every d3geopanel instance, update the basemap
            view.setBasemap(recs[0].get('id'), recs[0].get('url'));
        });
    },

    /**
        Handles a change in the Checkbox as to whether or not to display the legend.
        @param  c       {Ext.form.field.CheckBox}
        @param  state   {Boolean}
     */
    onLegendDisplayChange: function (c, state) {
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
            view.toggleLegend(state);
        });
    },

    /**
        Sets the new color scale given a change in the color palette selection.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onPaletteChange: function (c, recs) {
        var cs = recs[0].get('colors');
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), Ext.Function.bind(function (view) {
            // For every d3geopanel instance, update the scale's output range
            if (view.getScale()) {
                if (typeof cmp.getScale().quantiles === 'function') {
                    view.setScale(view.getScale().range(cs));
                } else {
                    this.updateColorScales();
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
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
            if (view.getProjection().id === recs[0].get('id')) {
                return;
            }

            // For every d3geopanel instance, update the projection
            view.setProjection(recs[0].get('id')).update();
        });
    },

    /**
        Handles changes in the size of the D3 drawing area by replacing the
        SVG element with a new instance.
        @param  view        {Flux.view.D3Panel}
        @param  width       {Number}        The resized width
        @param  height      {Number}        The resized height
        @param  oldWidth    {Number}        The original width
        @param  oldHeight   {Number}        The original height
     */
    onResize: function (view, width, height, oldWidth, oldHeight) {
        // oldWidth and oldHeight undefined when 'resize' event fires as part
        //  of the initial layout; we want to avoid acting on this firing
        if (oldWidth && oldHeight) {
            if (width !== oldWidth && height !== oldHeight) {
                // Update the projections ComboBox; rescale each projection contained
                view.init(width, height)
                    .setBasemap(this.getMapSettings().down('combo[name=basemap]').getValue())
                    .draw(undefined, true)
                    .updateLegend()
                    .updateDisplay();

            } else if (width !== oldWidth || height !== oldHeight) {
                // If only the width OR only the height changes, we can simply
                //  redraw the map
                view.ownerCt.on('afterlayout', function () {
                    view.draw().updateLegend();
                });
            }
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
        this.updateColorScales(cfg);
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
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), function (view) {
            view.setBasemap(basemap, keyword);
        });
    },

    /**
        Updates the color scale configuration of a specific view, as provided.
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  view    {Ext.Component}
        @param  config  {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
     */
    updateColorScale: function (view, config) {
        var opts = config || this.getSymbology().getForm().getValues();
        var palette, scale;
        var metadata = view.getMetadata();

        if (!metadata) {
            return;
        }

        // Get the color palette
        palette = this.getStore('palettes').getById(opts.palette);

        if (opts.threshold) {
            scale = this.generateThresholdScale(opts.thresholdValues, palette.get('colors')[0]);
        } else {
            scale = metadata.getQuantileScale(opts).range(palette.get('colors'));
        }

        view.setScale(scale);
    },

    /**
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  config  {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
     */
    updateColorScales: function (config) {
        var opts = this.getSymbology().getForm().getValues();

        opts = Ext.Object.merge(opts, config || {});

        // Update the scale of every map
        Ext.each(Ext.ComponentQuery.query('d3geopanel'), Ext.Function.bind(function (view) {
            this.updateColorScale(view, opts);
        }, this));
    }
    
});



