Ext.define('Flux.view.D3GeographicMap', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geomap',
    requires: [
        'Ext.Function',
        'Ext.tip.QuickTip',
        'Ext.toolbar.Toolbar',
        'Flux.store.Grids'
    ],

    bodyStyle: {
        backgroundColor: '#aaa'
    },

    /**
        An internal reference to the legend selection.
        @private
      */
    _legend: {},

    /**
        The scaling factor for a Mercator projection.
        @private
     */
    _mercatorFactor: function (phi) {
        return 1/Math.cos((Math.PI * phi) / 180);
    },

    /**
        Configuration and state for the basemap(s).
     */
    basemaps: {
        boundaries: 'both'
    },

    /**
        Enables the heads-up-display to show timestamps, mouseover events, etc.
     */
    enableDisplay: true,

    /**
        Flag to indicate whether or not the <rect> elements have already
        been added to the map.
        @private
     */
    isDrawn: false,

    /**
        The moment.js time display format to use.
        @private
     */
    timeFormat: 'YYYY MM-DD HH:ss',

    /**
        Initializes the component.
     */
    initComponent: function () {
        /**
            The scale used for coloring map elements.
            @private
         */
        this._scale = d3.scale.quantile();

        /**
            The Flux.Store.Grids instance associated with this view.
         */
        this.store = Ext.create('Flux.store.Grids');

        // Rewrite the updateDisplay() function to update the Panel's header
        //  title if displays are disabled
        if (!this.enableDisplay) {
            this.updateDisplay = function (data) {  
                if (Ext.isArray(data)) {
                    this.setTitle(Ext.String.format('{0}: {1}',
                        this.getMetadata().get('_id'), data[0].text));
                }
            };
        }

        this.on('draw', function (v, grid) {
            this._moment = grid.get('timestamp');

            if (Ext.isEmpty(grid.get('title'))) {
                this._display = grid.getTimestampDisplay(this.timeFormat)
            } else {
                this._display = grid.get('title');
            }

            this.updateDisplay([{
                id: 'timestamp',
                text: this._display
            }]);
        });

        this.on('render', function () {
            if (this.enableZoomControls) {
                this.addDocked(Ext.create('Ext.toolbar.Toolbar', {
                    dock: 'left',
                    defaultType: 'button',
                    cls: 'map-tbar',
                    defaults: {
                        cls: 'btn-zoom',
                        scale: 'large',
                        height: 34,
                        width: 34
                    },
                    items: [{
                        itemId: 'btn-zoom-in',
                        iconCls: 'icon-zoom-in',
                        tooltip: 'Zoom In',
                        listeners: {
                            click: Ext.bind(this.setZoom, this, [1.3])
                        }
                    }, {
                        itemId: 'btn-zoom-out',
                        iconCls: 'icon-zoom-out',
                        tooltip: 'Zoom Out',
                        listeners: {
                            click: Ext.bind(this.setZoom, this, [0.7])
                        }
                    }, {
                        itemId: 'btn-zoom-way-out',
                        iconCls: 'icon-zoom-extend',
                        tooltip: 'Zoom to Layer',
                        listeners: {
                            click: Ext.bind(this.setZoom, this, [0.1])
                        }
                    }]
                }), 0);
            }
        });

        this.callParent(arguments);
    },

    /**
        Add event listeners to the drawn elements.
        @param  sel {d3.selection}
        @return     {Flux.view.D3GeographicMap}
     */
    addListeners: function (sel) {
        sel = sel || this.panes.overlay.selectAll('.point');
        sel.on('mouseover', Ext.bind(function (d) {
            var c = d3.mouse(this.svg[0][0]);
            this.updateDisplay([{
                id: 'tooltip',
                text: d.toFixed(2)
            }]);
            this.panes.tooltip.selectAll('.tip')
                .text(d.toFixed(2))
                .attr({
                    'x': c[0] + 20,
                    'y': c[1] + 30
                });
        }, this));

        sel.on('mouseout', Ext.bind(function () {
            this.updateDisplay([{
                id: 'timestamp',
                text: this._display
            }]);
            this.panes.tooltip.selectAll('.tip').text('');
        }, this));

        return this;
    },

    /**
        Draws the visualization features on the map given input data and the
        corresponding metadata.
        @param  grid    {Flux.model.Grid}
        @param  zoom    {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
    draw: function (grid, zoom) {
        var bbox, lat, lng, c1, c2, sel, target;
        var proj = this.getProjection();

        this.fireEventArgs('beforedraw', [this, (grid || this._model), zoom]);

        if (!grid) {
            return this;
        }

        // Retain references to last drawing data and metadata; for instance,
        //  resize events require drawing again with the same (meta)data
        this._model = grid;

        // Disallow zooming by default
        zoom = (zoom === true);

        // Sets the enter or update selection's data
        sel = this.panes.overlay.selectAll('.point')
            .data(grid.get('features'), function (d, i) {
                return i; // Use the cell index as the key
            });

        // Append a <rect> for every grid cell so long as the features haven't
        //  been drawn before
        if (!this.isDrawn) {
            sel.enter().append('rect');

            // Add mouseover and mouseout event listeners
            this.addListeners(sel);
        }

        // Calculate the position and dimensions attributes of the elements
        sel.attr(this.getOverlayAttrs());

        // Applies the color scale to the current selection
        this.update(sel);

        // Skip zooming to the data if they've been drawn or if map is already zoomed
        if (!this.isDrawn && this.zoom.scale() === 1) {
            bbox = this._metadata.get('bbox');

            // Calculate the center of the view
            c1 = [
                Number(this.svg.attr('width')) * 0.5,
                Number(this.svg.attr('height')) * 0.5
            ];

            // Average the respective coordinate pairs in the bounds (xmin, ymin, xmax, ymax)
            lat = (bbox[1] + bbox[3]) * 0.5;
            lng = (bbox[0] + bbox[2]) * 0.5;

            if (this._projId === 'mercator') {
                lat = this._mercatorFactor(lat) * lat;
            }

            c2 = proj([lng, lat]);

            this.setZoom(2 * (this.svg.attr('width')) / proj([(bbox[2] - bbox[0]), 0])[0], [
                (c1[0] - c2[0]),
                (c1[1] - c2[1])
            ]);

        }

        this.isDrawn = true;
        this.fireEventArgs('draw', [this, (grid || this._model)]);
        return this;
    },

    /**
        Returns the retained reference to the underlying grid geometry.
        @return {Flux.model.Geometry}
     */
    getGridGeometry: function () {
        return this._grid;
    },

    /**
        Creates an Object of attributes for the drawing features.
        @return {Object}
     */
    getOverlayAttrs: function () {
        var attrs, gridres;
        var grid = this.getGridGeometry();
        var proj = this.getProjection();
        var scaling = this._mercatorFactor;

        if (!this._metadata) {
            return;
        }

        // Assumes grid spacing given in degrees
        gridres = this._metadata.get('gridres');
        attrs = {
            'x': function (d, i) {
                // We want to start drawing at the upper left (half the cell
                //  width, or half a degree)
                return proj(grid[i].map(function (j) {
                    // Subtract half the grid spacing from longitude (farther west)
                    return (j - (gridres.x * 0.5));
                }))[0];
            },

            'y': function (d, i) {
                return proj(grid[i].map(function (j) {
                    // Add half the grid spacing from latitude (farther north)
                    return (j + (gridres.y * 0.5));
                }))[1];
            },

            'width': Math.abs(proj([gridres.x, 0])[0] - proj([0, 0])[0]),

            'height': Math.abs(proj([0, gridres.y])[1] - proj([0, 0])[1]),

            'class': 'point'
        };

        // Use a scaling factor for non-equirectangular projections
        // http://en.wikipedia.org/wiki/Mercator_projection#Scale_factor
        if (this._projId === 'mercator') {
            attrs.height = function (d, i) {
                return scaling(grid[i][1]) * Math.abs(proj([0, gridres.y])[1] - proj([0, 0])[1]);
            }
        }

        return attrs;

    },

    /**
        Returns the current map projection.
        @return {d3.geo.*}
     */
    getProjection: function () {
        return this._proj;
    },

    /**
        Returns the current map scale.
        @return {d3.scale.*}
     */
    getScale: function () {
        return this._scale;
    },

    /**
        Initializes drawing; defines and appends the SVG element(s). The drawing
        panes are set up and SVG element(s) are initialized, sometimes with
        empty data sets.
        @param  width   {Number}
        @param  height  {Number}
        @return         {Flux.view.D3GeographicMap}
     */
    init: function (width, height) {
        var elementId = '#' + this.items.getAt(0).id;

        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            this.svg.remove();
        }

        this.svg = d3.select(elementId).append('svg')
            .attr('width', width)
            .attr('height', height);

        this.zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on('zoom', Ext.bind(function () {
                this.wrapper.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            }, this));

        // This container will apply zoom and pan transformations to the entire
        //  content area; NOTE: layers that need to be zoomed and panned around
        //  must be appended to the wrapper
        this.wrapper = this.svg.append('g').attr('class', 'wrapper')
            .call(this.zoom);

        // Add a background element to receive pointer events in otherwise
        //  "empty" space
        this.wrapper.append('rect')
            .attr({
                'class': 'filler',
                'width': width,
                'height': height,
                'fill': this.bodyStyle.backgroundColor,
                'x': 0,
                'y': 0
            })
            .style('pointer-events', 'all');

        // Create panes in which to organize content at difference z-index
        //  levels using painter's algorithm (first drawn on bottom; last drawn
        //  is on top); NOTE: layers that need to be zoomed and panned around
        //  must be appended to the wrapper layer; layers that should NOT zoom
        //  and pan should be appended to something else (e.g this.svg)
        this.panes = {
            basemap: this.wrapper.append('g').attr('class', 'pane')
        };
        this.panes.overlay = this.wrapper.append('g').attr('class', 'pane overlay');
        this.panes.hud = this.svg.append('g').attr('class', 'pane hud');
        this.panes.legend = this.svg.append('g').attr('class', 'pane legend');
        this.panes.tooltip = this.svg.append('g').attr('class', 'pane tooltip');

        // Tooltip /////////////////////////////////////////////////////////////
        this.panes.tooltip.selectAll('.tip')
            .data([0])
            .enter()
            .append('text')
            .text('')
            .attr('class', 'info tip');

        // Heads-Up-Display (HUD) date/time info ///////////////////////////////
        if (this.enableDisplay) {
            this.panes.hud.selectAll('.backdrop')
                .data([0])
                .enter()
                .append('rect')
                .attr({
                    'fill': '#fff',
                    'fill-opacity': 0.0,
                    'class': 'backdrop',
                    'x': 0,
                    'y': 0,
                    'width': width,
                    'height': (0.05 * height)
                });
        }

        this.panes.hud.selectAll('.info')
            .data([
                { text: '', id: 'timestamp' }
            ], function (d) {
                return d.id;
            })
            .enter()
            .append('text')
            .text(function (d) {
                return d.text;
            })
            .style('font-size', (0.04 * height).toString() + 'px')
            .attr({
                'class': function (d) {
                    return 'info ' + d.id;
                },
                'text-anchor': 'middle'
            });

        // Legend //////////////////////////////////////////////////////////////
        this._legend.yScale = d3.scale.linear();
        this._legend.yAxis = d3.svg.axis()
            .scale(this._legend.yScale)
            .orient('right');

        this.isDrawn = false;

        return this;
    },

    /**
        Draws the view again with the same data it already has bound to it.
        @param  zoom    {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
    redraw: function (zoom) {
        if (this._model) {
            this.draw(this._model, zoom).updateLegend();
        }
        return this;
    },

    /**
        Draws or redraws the basemap given the URL of a new TopoJSON file.
        @param  basemapUrl      {String}
        @param  drawBoundaries  {Boolean}
        @return                 {Flux.view.D3GeographicMap}
     */
    setBasemap: function (basemapUrl, boundaries) {
        var drawBasemap = Ext.bind(function (json) {
            var sel = this.panes.basemap.append('g')
                .attr('id', 'basemap')

            sel.append('g')
                .attr('class', (boundaries === 'outer') ? 'political empty' : 'political region')
                .selectAll('path')
                .data(topojson.feature(json, json.objects.basemap).features)
                .enter().append('path')
                .attr('d', this.path);

            if (boundaries === 'inner' || boundaries === 'both') {
                sel.append('path')
                    .datum(topojson.mesh(json, json.objects.basemap, function (a, b) {
                        return a !== b; // Inner boundaries
                    }))
                    .attr('class', 'political boundary inside')
                    .attr('d', this.path);
            }

            if (boundaries === 'outer' || boundaries === 'both') {
                sel.append('path')
                    .datum(topojson.mesh(json, json.objects.basemap, function (a, b) {
                        return a === b; // Outer boundaries
                    }))
                    .attr('class', (function () {
                        var c = 'political boundary ';
                        if (boundaries === 'both') {
                            return c + 'inside';
                        }

                        return c + 'outside';
                    }()))
                    .attr('d', this.path);
            }

        }, this);

        boundaries = boundaries || this.basemaps.boundaries;

        // Remove the old basemap, if one exists
        this.panes.basemap.select('#basemap').remove()

        if (this.basemaps.hasOwnProperty(basemapUrl)) {
            // If the requested basemap was loaded before, just re-draw it
            drawBasemap(this.basemaps[basemapUrl]);

        } else {
            // Execute XMLHttpRequest for new basemap data
            d3.json(basemapUrl, Ext.bind(function (error, json) {
                drawBasemap(json);
                this.basemaps[basemapUrl] = json;
            }, this));
        }

        // Remember boundaries settings
        if (boundaries !== undefined) {
            this.basemaps.boundaries = boundaries;
        }

        return this;
    },

    /**
        Sets the grid geometry; retains a reference to the Flux.model.Geometry
        instance.
        @param  geom    {Flux.model.Geometry}
        @return         {Flux.view.D3GeographicMap}
     */
    setGridGeometry: function (geom) {
        this._grid = geom.get('coordinates');
        return this;
    },

    /**
        Given a new projection, the drawing path is updated.
        @param  proj    {String}
        @param  width   {Number}
        @param  height  {Number}
        @return         {Flux.view.D3GeographicMap}
     */
    setProjection: function (proj, width, height) {
        width = width || this.svg.attr('width');
        height = height || this.svg.attr('height');

        this._projId = proj;
        this._proj = d3.geo[proj]().scale(width * 0.15)
            .translate([
                Number(width) * 0.5,
                Number(height) * 0.5
            ]);

        this.path = d3.geo.path()
            .projection(this._proj);

        // Update the data in every currently drawn path
        this.svg.selectAll('path')
            .attr('d', this.path);

        return this;
    },

    /**
        Sets the color scale used by the map.
        @param  scale   {d3.scale.*}
        @return         {Flux.view.D3GeographicMap}
     */
    setScale: function (scale) {
        this._scale = scale;

        if (this.panes.overlay) {
            this.update(this.panes.overlay.selectAll('.point'));
            this.updateLegend();
        }

        this.fireEvent('scalechange');

        return this;
    },

    /**
        Sets the zoom level by a specified factor; also accepts a specified
        duration of time for the transition to the new zoom level.
        @param  factor      {Number}
        @param  translation {Array}
        @param  duration    {Number}
        @return             {Flux.view.D3GeographicMap}
     */
    setZoom: function (factor, translation, duration) {
        var scale = this.zoom.scale();
        var extent = this.zoom.scaleExtent();
        var newScale = scale * factor;
        var t = translation || this.zoom.translate();
        var c = [
            this.svg.attr('width') * 0.5,
            this.svg.attr('height') * 0.5
        ];

        duration = duration || 500; // Duration in milliseconds
        if (extent[0] <= newScale && newScale <= extent[1]) {
            this.zoom.scale(newScale)
                .translate([
                    c[0] + (t[0] - c[0]) / scale * newScale, 
                    c[1] + (t[1] - c[1]) / scale * newScale
                ])
                .event((this._transitions) ? this.wrapper.transition().duration(duration) : this.wrapper);

        } else {
            this.zoom.scale(1)
                .translate([
                    c[0] + (t[0] - c[0]) / scale, 
                    c[1] + (t[1] - c[1]) / scale
                ])
                .event((this._transitions) ? this.wrapper.transition().duration(duration) : this.wrapper);

        }

        return this;
    },

    /**
        Toggles the display of the legend on/off.
        @param  state   {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
    toggleLegend: function (state) {
        if (state) {
            this.panes.legend.attr('class', 'pane legend');
        } else {
            this.panes.legend.attr('class', 'pane legend hidden');
        }

        return this;
    },

    /**
        Draws again the visualization features of the map by updating their
        SVG attributes. Accepts optional D3 selection which it will style.
        @param  selection   {d3.selection}
        @return             {Flux.view.D3GeographicMap}
     */
    update: function (selection) {
        if (selection) {
            selection.attr('fill', Ext.bind(function (d, i) {
                if (d === undefined) {
                    return undefined;
                }
                if (this._showAnomalies) {
                    return this.getScale()(d + this._addOffset);
                }
                return this.getScale()(d);
            }, this));

            return this;
        }

        this.panes.overlay.selectAll('.point')
        .attr(this.getOverlayAttrs());

        return this;
    },

    /**
        Updates the on-map info text in the heads-up-display.
        @param  data    {Array}
        @return         {Flux.view.D3GeographicMap}
     */
    updateDisplay: function (data) {
        var scale = 0.039 * this.svg.attr('height');

        if (!this._model) {
            return this;
        }

        if (!data) {
            data = this.panes.hud.selectAll('.info').data();
            // Recall the timestamp text (if this function was called after
            //  the window is resized and this panel is re-rendered)
            if (data[0].id === 'timestamp') {
                data[0].text = this._moment.format(this.timeFormat);
            }
        }

        this.panes.hud.selectAll('.backdrop')
            .attr('fill-opacity', (data === []) ? 0.0 : 0.6);
        this.panes.hud.selectAll('.info')
            .data(data)
            .text(function (d) { return d.text; })
            .attr({
                'x': this.svg.attr('width') * 0.5,
                'y': function (d, i) {
                    return (i + 1) * scale;
                }
            });

        return this;
    },

    /**
        Updates the legend based on the current color scale; can be called with
        or without an Array of breakpoints (bins) for the scale.
        @return         {Flux.view.D3GeographicMap}
     */
    updateLegend: function () {
        var bins, h, ordinal;
        var s = 0.025 * this.svg.attr('width'); // Length on a side of the legend's bins
        var colors = this._scale.range();

        // Subtract the header width from the legend's y-offset so that it
        //  is displaced relative to the bottom of the Panel's header, not the 
        //  top of the Panel's header
        var yOffset = this.svg.attr('height') - this.getHeader().getHeight();

        if (this._scale.domain().length === 0) {
            return this;
        }

        if (typeof this._scale.quantiles === 'function') {
            bins = bins || this._scale.quantiles();
            ordinal = false;
        } else {
            bins = bins || this._scale.domain();
            ordinal = true;
            if (bins.length === 1) {
                bins = [Math.floor(bins[0]), (Math.floor(bins[0]) + 1)];
            }
        }

        // Calculate intended height of the legend
        h = s * bins.length;

        this._legend.yScale
            .domain([0, bins.length])
            .range([h, 0]);

        this._legend.yAxis
            .tickFormat(function (x, i) {
                var s = Number(bins[x]).toFixed(1).toString();
                return (s === 'NaN') ? '' : s;
            })
            .scale(this._legend.yScale);

        this.panes.legend.selectAll('.bin').remove();
        this.panes.legend.selectAll('.bin')
            .data(colors)
            .enter()
            .append('rect')
            .attr({
                'x': 0,
                'y': function (d, i) {
                    if (ordinal) {
                        return yOffset - ((i + 2) * s);
                    }
                    return yOffset - ((i + 1) * s);
                },
                'width': s,
                'height': s,
                'fill': function (d) {
                    return d;
                },
                'class': 'bin'
            });

        // NOTE: Possible performance hit in removing the axis every time the
        //  legend is updated; could render it in init() ensuring it is last
        //  in the drawing order
        this.panes.legend.selectAll('.axis').remove();
        this.panes.legend.append('g').attr({
            'class': 'ramp y axis',
            'transform': 'translate(' + s.toString() + ',' +
                (yOffset - this._legend.yScale(bins.length) - h - s).toString() + ')'
        }).call(this._legend.yAxis);

        return this;
    },

    /**
        Updates the color scale configuration of a specific view, as provided.
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  opts    {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
        //TODO Could add a "_lastOptions" property to this view that stores
        //  the opts argument and makes it optional? That ways the view could
        //  call this method on its own
     */
    updateScale: function (opts) {
        var palette, scale;
        var metadata;

        if (!this.getMetadata()) {
            return;
        }

        if (!this._usePopulationStats && this.getModel()) {
            metadata = this.getMetadata().copy();
            metadata.set('stats', this.getModel().summarize());

            this.setMetadata(metadata);

        } else {
            metadata = this.getMetadata();
        }

        // Get the color palette
        palette = Ext.StoreManager.get('palettes').getById(opts.palette);

        if (opts.threshold) {
            scale = metadata.getThresholdScale(opts.thresholdValues, palette.get('colors')[0]);
        } else {
            scale = metadata.getQuantileScale(opts).range(palette.get('colors'));
        }

        this.setScale(scale);
    }

});


