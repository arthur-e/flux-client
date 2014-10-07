Ext.define('Flux.controller.MapController', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'mapSettings',
        selector: 'mapsettings'
    }, {
        ref: 'settingsMenu',
        selector: '#settings-menu'
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
                mouseover: this.onMouseOver,
                mouseout: this.onMouseOut,
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
                var k = 'none';
                var basemapOutlines = this.getMapSettings().down('checkbox[name=showBasemapOutlines]').getValue();
                var politicalBoundaries = this.getMapSettings().down('checkbox[name=showPoliticalBoundaries]').getValue();

                if (basemapOutlines) {
                    k = 'outer';
                } else {
                    k = (politicalBoundaries) ? 'both' : 'none';
                }

                return k;
        }, this)());

        cmp.init(width, height)
            .setProjection(opts.projection, width, height)
            .setBasemap(opts.basemap, kw);

        cmp.setMarkerSize(this.getSettingsMenu().down('field[name=markerSize]').getValue());

    },

    ////////////////////////////////////////////////////////////////////////////
    // Event Handlers //////////////////////////////////////////////////////////

    /**
        Handles a change in the basemap.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onBasemapChange: function (c, recs) {
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (v) {
            // For every d3geomap instance, update the basemap
            v.setBasemap(recs[0].get('id'));
        });
    },

    /**
        Handles a change in the Checkbox as to whether or not to display the legend.
        @param  c       {Ext.form.field.CheckBox}
        @param  state   {Boolean}
     */
    onLegendDisplayChange: function (c, state) {
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (v) {
            v.toggleLegend(state);
        });
    },

    /**
        Handles the mouse entering a map selection. Updates the display text of
        all other maps so that they show the value at the corresponding location
        given by the pixel coordinates from the mouseover event.
        @param  focused {D3GeographicMap}   The map with the mouseover selection
        @param  coords  {Array}             The pixel coordinates of the mouseover selection (not the mouse)
        @param  value   {Number}            The value of the mouseover selection
     */
    onMouseOver: function (focused, coords) {
        var geom = focused.getProjection().invert(Ext.Array.map(coords, Number));

        // Need to add half the grid spacing as this was subtracted to obtain
        //  the upper-left corner of the grid cell
        geom = focused.getMetadata().calcHalfOffsetCoordinates(geom);

        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (v) {
            if (v.getId() !== focused.getId()) {
                v.highlightMapLocation(geom);
            }
        });
    },

    /**
        Handles the mouse exiting a map selection. Resets the display text to
        its stored reference.
        @param  focused {D3GeographicMap}
     */
    onMouseOut: function (focused) {
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (v) {
            if (v.getId() !== focused.getId()) {
                v.updateDisplay({
                    id: 'tooltip',
                    text: v._display
                });
            }
        });
    },

    /**
        Sets the new color scale given a change in the color palette selection.
        @param  c       {Ext.form.field.ComboBox}
        @param  recs    {Array}
     */
    onPaletteChange: function (c, recs) {
        var cs = recs[0].get('colors');

        Ext.each(Ext.ComponentQuery.query('d3geomap'), Ext.bind(function (v) {
            // For every d3geomap instance, update the scale's output range
            if (v.getScale()) {
                if (typeof v.getScale().quantiles === 'function') {
                    v.setScale(v.getScale().range(cs));
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
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (v) {
            if (v.getProjection().id === recs[0].get('id')) {
                return;
            }

            // For every d3geomap instance, update the projection
            v.setProjection(recs[0].get('id')).update();
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
    onScaleParameterChange: function (c, value) {
        var cfg = {};
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
        Ext.each(Ext.ComponentQuery.query('d3geomap'), function (v) {
            v.setBasemap(basemap, keyword);
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
        Ext.each(Ext.ComponentQuery.query('d3geomap'), Ext.bind(function (v) {
            v.updateScale(opts);
        }, this));
    }

});



