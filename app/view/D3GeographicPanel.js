Ext.define('Flux.view.D3GeographicPanel', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geopanel',
    requires: [
        'Ext.Function'
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

        /**
            The scale used for coloring map elements.
            @private
         */
        this._scale = d3.scale.quantile();

        this.callParent(arguments);
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
        var bbox, c1, c2, sel, ts;
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
            c2 = proj([(bbox[0] + bbox[2]) * 0.5, (bbox[1] + bbox[3]) * 0.5]);

            this.zoom.translate([(c1[0] - c2[0]), (c1[1] - c2[1])])
                .event(this.wrapper.transition().duration(500));

            this.setZoom(2 * (this.svg.attr('width')) / proj([(bbox[2] - bbox[0]), 0])[0]);
        }

        if (grid) {
            ts = grid.get('timestamp');
            this.updateDisplay([{
                id: 'date',
                text: Ext.String.format('{0} {1}-{2}', ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()) //FIXME Ext.Date.format(ts, 'Y m-d') Prints locale time strings
            }, {
                id: 'time',
                text: (function () { //FIXME Ext.Date.format(ts, 'H:i') Prints locale time strings
                    var H = ts.getUTCHours().toString();
                    var i = ts.getUTCMinutes().toString();
                    H = (H.length === 1) ? '0' + H : H;
                    i = (i.length === 1) ? '0' + i : i;
                    return Ext.String.format('{0}:{1}', H, i);
                }())
            }]);

            this.updateLegend();
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
        var grid = this.getGridGeometry();
        var gridres = this._metadata.get('gridres'); // Assumes grid spacing given in degrees
        var proj = this.getProjection();
        var projName = this._projectionId;

        var attrs = {
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
        if (projName === 'mercator') {
            attrs.height = function (d, i) {
                var sf = 1/Math.cos((Math.PI * grid[i][1]) / 180);
                return sf * Math.abs(proj([0, gridres.y])[1] - proj([0, 0])[1]);
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
        @return {Flux.view.D3GeographicPanel}
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

        // Create the elements for the heads-up-display (HUD)
        this.panes.hud.selectAll('.info')
            .data([
                { text: '', id: 'date' },
                { text: '', id: 'time' }
            ], function (d) {
                return d.id;
            })
            .enter()
            .append('text')
            .text(function (d) {
                return d.text;
            })
            .attr({
                'x': 0,
                'y': function (d, i) {
                    return (i + 1) * 40;
                },
                'class': function (d) {
                    return 'info ' + d.id;
                },
                'font-size': '40px'
            });

        this.setProjection(proj);

        // Initialize the Zoom In/Zoom Out buttons
        d3.select('#btn-zoom-in').on('click',
            Ext.Function.bind(this.setZoom, this, [1.3]));
        d3.select('#btn-zoom-out').on('click',
            Ext.Function.bind(this.setZoom, this, [0.7]));
        d3.select('#btn-zoom-way-out').on('click',
            Ext.Function.bind(this.setZoom, this, [0.1]));

        return this;
    },

    /**
        Draws or redraws the basemap given the URL of a new TopoJSON file.
        @param  basemap         {String}    Unique identifier (name) for the basemap
        @param  basemapUrl      {String}
        @param  drawBoundaries  {Boolean}
        @return {Flux.view.D3GeographicPanel}
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
        @return {Flux.view.D3GeographicPanel}
     */
    setGridGeometry: function (geom) {
        this._grid = geom.get('coordinates');
        return this;
    },

    /**
        Given a new projection, the drawing path is updated.
        @param  proj    {d3.geo.*}
        @param  id      {String}
        @return {Flux.view.D3GeographicPanel}
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
        @return {Flux.view.D3GeographicPanel}
     */
    setScale: function (scale) {
        this._scale = scale;

        if (this.panes.overlay) {
            this.update(this.panes.overlay.selectAll('.point'));
        }

        this.fireEvent('scalechange');

        return this;
    },

    /**
        Sets the zoom level by a specified factor; also accepts a specified
        duration of time for the transition to the new zoom level.
        @param  factor      {Number}
        @param  duration    {Number}
        @return {Flux.view.D3GeographicPanel}
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
                return this.getScale()((!d) ? undefined : d);
            }, this));

            return this;
        }

        this.panes.overlay.selectAll('.point')
        .attr(this.getOverlayAttrs());

        return this;
    },

    /**
        Updates the on-map info text in the heads-up-display.
     */
    updateDisplay: function (data) {
        this.panes.hud.selectAll('.info')
            .data(data)
            .text(function (d) { return d.text; });
    },

    /**TODO
     */
    updateLegend: function (bins) {
        bins = bins || this._scale.range();

        this.panes.legend.selectAll('.bins').remove();
        this.panes.legend.selectAll('.bins')
            .data(bins)
            .enter()
            .append('rect')
            .attr({
                'x': 0,
                'y': Ext.Function.bind(function (d, i) {
                    return this.svg.attr('height') - (i * 32) - 32;
                }, this),
                'width': 32,
                'height': 32,
                'fill': Ext.Function.bind(function (d) {
                    return d;
                }, this),
                'class': 'bins'
            });
    }

});


