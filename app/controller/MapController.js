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

            'd3geomap': {
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

        Ext.onReady(Ext.bind(function () {

            // Add additional listeners to stateful fields only AFTER their
            //  values have been set from saved state
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

        }, this));
    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Set the spatial projection and begin D3 rendering.
        @param  cmp     {Ext.Component}
     */
    initialize: function (cmp) {
        // Width and height are undefined in this boxready call, which originates
        //  from the component's underlying box (this > component[autoEl])
        var width = cmp.getWidth();
        var height = cmp.getHeight();
        var opts = this.getMapSettings().getForm().getValues();
        var kw = (Ext.bind(function () {
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

        cmp.init(width, height)
            .setProjection(opts.projection, width, height)
            .setBasemap(opts.basemap, kw);

    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Handles a change in the basemap.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onBasemapChange: function (c, recs) {
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (view) {
            // For every d3geomap instance, update the basemap
            view.setBasemap(recs[0].get('id'));
        });
    },

    /**
        Handles a change in the Checkbox as to whether or not to display the legend.
        @param  c       {Ext.form.field.CheckBox}
        @param  state   {Boolean}
     */
    onLegendDisplayChange: function (c, state) {
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (view) {
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
        Ext.each(Ext.ComponentQuery.query('d3geomap'), Ext.bind(function (view) {
            // For every d3geomap instance, update the scale's output range
            if (view.getScale()) {
                if (typeof view.getScale().quantiles === 'function') {
                    view.setScale(view.getScale().range(cs));
                }
            }
        }, this));

        this.updateScales();
    },

    /**
        Handles a change in the map projection.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onProjectionChange: function (c, recs) {
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (view) {
            if (view.getProjection().id === recs[0].get('id')) {
                return;
            }

            // For every d3geomap instance, update the projection
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
            // If only one size dimension changed, this might be an "alignment"
            //  of one of multiple D3Panels, which should be ignored
            if (width === oldWidth || height === oldHeight) {
                // However, if the width is 100% then we know it is not an
                //  "alignment" as there is only one (column of) D3Panel
                if (view.anchor.split(' ')[0] !== '100%') {
                    return;
                }
            }

            // Update the projections ComboBox; rescale each projection contained
            view.init(width, height)
                .setBasemap(this.getMapSettings().down('combo[name=basemap]').getValue())
                .redraw(true)
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
        this.updateScales(cfg);
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

        // For every d3geomap instance, update the basemap
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (view) {
            view.setBasemap(basemap, keyword);
        });
    },

    /**
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  config  {Object}    Properties are palette configs e.g. sigmas,
            tendency, paletteType
     */
    updateScales: function (config) {
        var opts = this.getSymbology().getForm().getValues();

        opts = Ext.merge(opts, config || {});

        // Update the scale of every map
        Ext.each(Ext.ComponentQuery.query('d3geomap'), Ext.bind(function (view) {
            view.updateScale(opts);
        }, this));
    }
    
});



