Ext.define('Flux.view.D3GeographicPanel', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geopanel',
    requires: [
        'Ext.Function',
        'Ext.tip.QuickTip'
    ],

    bbar: {
        border: true,
        cls: 'map-tbar',
        style: { borderColor: '#157fcc' },
        items: ['->', {
            xtype: 'tbitem',
            width: 150,
            height: 45,
            html: '<a href="http://mtu.edu"><img src="/flux-client/resources/MTRI_logo_dark_bg.png" /></a>'
        }]
    },

    lbar: {
        defaultType: 'button',
        cls: 'map-tbar',
        defaults: {
            cls: 'btn-zoom',
            scale: 'large',
            height: 34,
            width: 34
        },
        items: [{
            id: 'btn-zoom-in',
            iconCls: 'icon-zoom-in',
            tooltip: 'Zoom In'
        }, {
            id: 'btn-zoom-out',
            iconCls: 'icon-zoom-out',
            tooltip: 'Zoom Out'
        }, {
            id: 'btn-zoom-way-out',
            iconCls: 'icon-zoom-extend',
            tooltip: 'Zoom to Layer'
        }]
    },

    _mercatorScale: function (phi) {
        return 1/Math.cos((Math.PI * phi) / 180);
    },

    /**
        Configuration and state for the basemap(s).
     */
    basemaps: {
        boundaries: 'both'
    },

    /**
        The URL of the current (currently loaded) basemap.
     */
    basemapUrl: undefined,

    bodyStyle: {
        backgroundColor: '#aaaaaa'
    },

    /**
        Initializes the component.
     */
    initComponent: function () {
        this.addEvents(['scalechange']);

        /**
            Flag to indicate whether or not the <rect> elements have already
            been added to the map.
            @private
         */
        this._isDrawn = false;

        this._legend = {};

        /**
            The scale used for coloring map elements.
            @private
         */
        this._scale = d3.scale.quantile();

        this.callParent(arguments);
    },

    /**
        Add event listeners to the drawn elements.
        @param  sel {d3.selection}
        @return     {Flux.view.D3GeographicPanel}
     */
    addListeners: function (sel) {
        sel = sel || this.panes.overlay.selectAll('.point');
        sel.on('mouseover', Ext.Function.bind(function (d) {
            var c = d3.mouse(this.svg[0][0]);
            //this.updateDisplay([{
            //    id: 'tooltip',
            //    text: d.toFixed(2)
            //}]);
            this.panes.tooltip.selectAll('.tip')
                .text(d.toFixed(2))
                .attr({
                    'x': c[0] + 20,
                    'y': c[1] + 30
                });
        }, this));

        sel.on('mouseout', Ext.Function.bind(function (d) {
            //this.updateDisplay([{
            //    id: 'timestamp',
            //    text: this._timestamp
            //}]);
            this.panes.tooltip.selectAll('.tip').text('');
        }, this));

        return this;
    },

    /**
        Initially configure this view with the relevant Metadata.
        @param  metadata    {Flux.model.Metadata}
        @return             {Flux.view.D3GeographicPanel}
     */
    configure: function (metadata) {
        this._metadata = metadata;
        return this;
    },

    /**
        Draws the visualization features on the map given input data and the
        corresponding metadata.
        @param  grid    {Flux.model.Grid}
        @return         {Flux.view.D3GeographicPanel}
     */
    draw: function (grid) {
        var bbox, lat, lng, c1, c2, sel;
        var proj = this.getProjection();

        // Retain references to last drawing data and metadata; for instance,
        //  resize events require drawing again with the same (meta)data
        if (grid) {
            this._data = grid.get('features');
        }

        // Sets the enter or update selection's data
        sel = this.panes.overlay.selectAll('.point')
            .data(this._data, function (d, i) {
                return i; // Use the cell index as the key
            });

        // Append a <rect> for every grid cell so long as the features haven't
        //  been drawn before
        if (!this._isDrawn) {
            sel.enter().append('rect');

            // Add mouseover and mouseout event listeners
            this.addListeners(sel);
        }

        // Calculate the position and dimensions attributes of the elements
        sel.attr(this.getOverlayAttrs());

        // Applies the color scale to the current selection
        this.update(sel);

        // Skip zooming to the data if they've been drawn or if map is already zoomed
        if (!this._isDrawn && this.zoom.scale() === 1) {
            bbox = this._metadata.get('bbox');

            // Calculate the center of the view
            c1 = [
                Number(this.svg.attr('width')) * 0.5,
                Number(this.svg.attr('height')) * 0.5
            ];

            // Average the respective coordinate pairs in the bounds (xmin, ymin, xmax, ymax)
            lat = (bbox[1] + bbox[3]) * 0.5;
            lng = (bbox[0] + bbox[2]) * 0.5;

            if (this._projectionId === 'mercator') {
                lat = this._mercatorScale(lat) * lat;
            }

            c2 = proj([lng, lat]);

            this.zoom.translate([(c1[0] - c2[0]), (c1[1] - c2[1])])
                .event(this.wrapper.transition().duration(500));

            this.setZoom(2 * (this.svg.attr('width')) / proj([(bbox[2] - bbox[0]), 0])[0]);
        }

        this._isDrawn = true;

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
        Draws the visualization features on the map given input data and the
        corresponding metadata.
        @return {Object}
     */
    getOverlayAttrs: function () {
        var attrs, gridres;
        var grid = this.getGridGeometry();
        var proj = this.getProjection();
        var scaling = this._mercatorScale;

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
        if (this._projectionId === 'mercator') {
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
        return this._projection;
    },

    /**
        Returns the current map scale.
        @return {d3.scale.*}
     */
    getScale: function () {
        return this._scale;
    },

    /**
        Main drawing function; defines and appends the SVG element.
        @param  proj    {d3.geo.*}
        @param  width   {Number}
        @param  height  {Number}
        @return         {Flux.view.D3GeographicPanel}
     */
    render: function (proj, width, height) {
        var elementId = '#' + this.items.getAt(0).id;

        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            this.svg.remove()
        }

        this.svg = d3.select(elementId).append('svg')
            .attr('width', width)
            .attr('height', height);

        this.zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on('zoom', Ext.Function.bind(function () {
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
        this.panes.hud.selectAll('.backdrop')
            .data([0])
            .enter()
            .append('rect')
            .attr({
                'fill': '#fff',
                'fill-opacity': 0.0,
                'class': 'backdrop',
                'x': (this.svg.attr('width') - 400) * 0.5,
                'y': 0,
                'width': 400,
                'height': 55
            });

        this.panes.hud.selectAll('.info')
            .data([
                { text: '', id: 'timestamp' },
            ], function (d) {
                return d.id;
            })
            .enter()
            .append('text')
            .text(function (d) {
                return d.text;
            })
            .attr({
                'class': function (d) {
                    return 'info ' + d.id;
                },
                'font-size': '40px',
                'text-anchor': 'middle'
            });

        // Legend //////////////////////////////////////////////////////////////
        this.panes.legend.append('g').attr('class', 'ramp y axis');
        this._legend.yScale = d3.scale.linear();
        this._legend.yAxis = d3.svg.axis()
            .scale(this._legend.yScale)
            .orient('right');

        this.setProjection(proj);

        // Initialize the Zoom In/Zoom Out buttons
        d3.select('#btn-zoom-in').on('click',
            Ext.Function.bind(this.setZoom, this, [1.3]));
        d3.select('#btn-zoom-out').on('click',
            Ext.Function.bind(this.setZoom, this, [0.7]));
        d3.select('#btn-zoom-way-out').on('click',
            Ext.Function.bind(this.setZoom, this, [0.1]));

        this._isDrawn = false;

        return this;
    },

    /**
        Draws or redraws the basemap given the URL of a new TopoJSON file.
        @param  basemap         {String}    Unique identifier (name) for the basemap
        @param  basemapUrl      {String}
        @param  drawBoundaries  {Boolean}
        @return                 {Flux.view.D3GeographicPanel}
     */
    setBasemap: function (basemap, basemapUrl, boundaries) {
        var drawBasemap = Ext.Function.bind(function (json) {
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

        // Unwrap state objects
        if (typeof basemap === 'object') {
            basemap = basemap.value;
        }

        // Remove the old basemap, if one exists
        this.panes.basemap.select('#basemap').remove()

        if (this.basemapUrl === basemapUrl && boundaries === this.basemaps.boundaries) {
            // If the requested basemap is already displayed, do nothing
            return;

        } else if (this.basemaps[basemap]) {
            // If the requested basemap was loaded before, just re-draw it
            drawBasemap(this.basemaps[basemap]);

        } else {
            // Execute XMLHttpRequest for new basemap data
            d3.json(basemapUrl, Ext.Function.bind(function (error, json) {
                drawBasemap(json);
                this.basemaps[basemap] = json;
            }, this));
        }

        // Remember boundaries settings
        if (boundaries !== undefined) {
            this.basemaps.boundaries = boundaries;
        }

        return this;
    },

    /**
        Sets the grid geometry; retains a reference to the grid geometry.
        @param  geom    {Flux.model.Geometry}
        @return         {Flux.view.D3GeographicPanel}
     */
    setGridGeometry: function (geom) {
        this._grid = geom.get('coordinates');
        return this;
    },

    /**
        Given a new projection, the drawing path is updated.
        @param  proj    {d3.geo.*}
        @param  id      {String}
        @return         {Flux.view.D3GeographicPanel}
     */
    setProjection: function (proj, id) {
        proj.translate([
            this.svg.attr('width') * 0.5,
            this.svg.attr('height') * 0.5
        ]);

        this.path = d3.geo.path()
            .projection(proj);

        // Update the data in every currently drawn path
        this.svg.selectAll('path')
            .attr('d', this.path);

        this._projection = proj;

        if (id) {
            this._projectionId = id;
        }

        return this;
    },

    /**
        Sets the color scale used by the map.
        @param  scale   {d3.scale.*}
        @return         {Flux.view.D3GeographicPanel}
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
        @param  duration    {Number}
        @return             {Flux.view.D3GeographicPanel}
     */
    setZoom: function (factor, duration) {
        var scale = this.zoom.scale();
        var extent = this.zoom.scaleExtent();
        var newScale = scale * factor;
        var t = this.zoom.translate();
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
                .event(this.wrapper.transition().duration(duration));

        } else {
            this.zoom.scale(1)
                .translate([
                    c[0] + (t[0] - c[0]) / scale, 
                    c[1] + (t[1] - c[1]) / scale
                ])
                .event(this.wrapper.transition().duration(duration));

        }

        return this;
    },

    /**
        Draws again the visualization features of the map by updating their
        SVG attributes. Accepts optional D3 selection which it will style.
        @param  selection   {d3.selection}
        @return             {Flux.view.D3GeographicPanel}
     */
    update: function (selection) {
        if (selection) {
            selection.attr('fill', Ext.Function.bind(function (d, i) {
                return this.getScale()((d === undefined) ? undefined : d);
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
        @return         {Flux.view.D3GeographicPanel}
     */
    updateDisplay: function (data) {
        if (!data) {
            data = this.panes.hud.selectAll('.info').data();
            // Recall the timestamp text (if this function was called after
            //  the window is resized and this panel is re-rendered)
            if (data[0].id === 'timestamp') {
                data[0].text = this._timestamp;
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
                    return (i + 1) * 40;
                }
            });
        return this;
    },

    /**
        Updates the legend based on the current color scale; can be called with
        or without an Array of breakpoints (bins) for the scale.
        @param  bins    {Array}
        @return         {Flux.view.D3GeographicPanel}
     */
    updateLegend: function (bins) {
        var h;
        var s = 0.025 * this.svg.attr('width'); // Length on a side of the legend's bins
        var colors = this._scale.range();
        var yOffset = this.svg.attr('height');
        bins = bins || this._scale.quantiles();

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

        this.panes.legend.selectAll('.axis')
            .attr('transform', 'translate(' + s.toString() + ',' +
                (yOffset - this._legend.yScale(bins.length) - h - s).toString() + ')')
            .call(this._legend.yAxis);

        this.panes.legend.selectAll('.bin').remove();
        this.panes.legend.selectAll('.bin')
            .data(colors)
            .enter()
            .append('rect')
            .attr({
                'x': 0,
                'y': function (d, i) {
                    return yOffset - (i * s) - s;
                },
                'width': s,
                'height': s,
                'fill': function (d) {
                    return d;
                },
                'class': 'bin'
            });

        return this;
    },

    /**
        Updates the on-map info text in the heads-up-display.
        @param  date    {Date}
        @param  fmt     {Array}
        @return         {Flux.view.D3GeographicPanel}
     */
    updateTimestamp: function (date, fmt) {
        this._timestamp = Ext.Date.format(Ext.Date.add(date, Ext.Date.MINUTE,
            date.getTimezoneOffset()), fmt)
        this.updateDisplay([{
            id: 'timestamp',
            // The following is necessary because Ext.Date.format prints only
            //  locale time strings, not UTC time strings
            text: this._timestamp
        }]);
        return this;
    },

});


