Ext.define('Flux.view.D3GeographicPanel', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geopanel',
    requires: [
        'Ext.Function'
    ],

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

    lbar: [{
        xtype: 'button',
        cls: 'btn-zoom',
        id: 'btn-zoom-in',
        scale: 'medium',
        iconCls: 'icon-zoom-in',
        tooltip: 'Zoom In'
    }, {
        xtype: 'button',
        cls: 'btn-zoom',
        id: 'btn-zoom-out',
        scale: 'medium',
        iconCls: 'icon-zoom-out',
        tooltip: 'Zoom Out'
    }],

    /**
        Initializes the Zoom In/Zoom Out buttons.
     */
    initZoom: function () {
        var svg = this.svg;
        var zoom = this.zoom;
        var target = this.panes.wrapper;

        function zoomed () {
            target.attr('transform',
                'translate(' + zoom.translate() + ')' +
                'scale(' + zoom.scale() + ')'
            );
        }

        function interpolateZoom (translate, scale) {
            var self = this;
            return d3.transition().duration(350).tween('zoom', function () {
                var iTranslate = d3.interpolate(zoom.translate(), translate),
                    iScale = d3.interpolate(zoom.scale(), scale);
                return function (t) {
                    zoom.scale(iScale(t))
                        .translate(iTranslate(t));
                    zoomed();
                };
            });
        }

        function setZoom () {
            var clicked = d3.event.target,
                direction = 1,
                factor = 0.5,
                target_zoom = 1,
                center = [
                    svg.attr('width') * 0.5,
                    svg.attr('height') * 0.5
                ],
                extent = zoom.scaleExtent(),
                translate = zoom.translate(),
                translate0 = [],
                l = [],
                view = {x: translate[0], y: translate[1], k: zoom.scale()};

            d3.event.preventDefault();
            direction = (this.id === 'btn-zoom-in') ? 1 : -1;
            target_zoom = zoom.scale() * (1 + factor * direction);

            if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

            translate0 = [
                (center[0] - view.x) / view.k,
                (center[1] - view.y) / view.k
            ];
            view.k = target_zoom;
            l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

            view.x += center[0] - l[0];
            view.y += center[1] - l[1];

            interpolateZoom([view.x, view.y], view.k);
        }

        d3.selectAll('.btn-zoom').on('click', setZoom);
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
                this.panes.wrapper.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            }, this));

        this.panes = {}; // Organizes visualization features into "panes"

        // This container will apply zoom and pan transformations to the entire
        //  content area
        this.panes.wrapper = this.svg.append('g').attr('class', 'pane wrapper')
            .call(this.zoom);

        // Add a background element to receive pointer events in otherwise
        //  "empty" space
        this.panes.wrapper.append('rect')
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
        //  is on top)
        this.panes.basemap = this.panes.wrapper.append('g').attr('class', 'pane');

        this.setProjection(proj);

        this.initZoom();//FIXME

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
        Given a new projection, the drawing path is updated.
        @param  proj    {d3.geo.*}
        @return {Flux.view.D3GeographicPanel}
     */
    setProjection: function (proj) {
        proj.translate([
            this.svg.attr('width') * 0.5,
            this.svg.attr('height') * 0.5
        ]);

        this.path = d3.geo.path()
            .projection(proj);

        // Update the data in every currently drawn path
        this.svg.selectAll('path')
            .attr('d', this.path);

        return this;
    }

});
