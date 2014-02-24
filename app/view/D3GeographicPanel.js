Ext.define('Flux.view.D3GeographicPanel', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geopanel',
    requires: [
        'Ext.Function'
    ],

    initComponent: function () {
        this.callParent(arguments);
    },

    /**
        Configuration and state for the basemap(s).
     */
    basemaps: {},

    /**
        The URL of the current (currently loaded) basemap.
     */
    basemapUrl: undefined,

    /**
        Main drawing function; defines and appends the SVG element.
        @param  proj    {d3.geo.*}
        @param  width   {Number}
        @param  height  {Number}
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

        this.panes = {}; // Organizes visualization features into "panes"

        // This container will apply zoom and pan transformations to the entire
        //  content area
        this.panes.wrapper = this.svg.append('g').attr('class', 'pane wrapper')
            .call(d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on('zoom', Ext.Function.bind(function () {
                this.panes.wrapper.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            }, this)));

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

        return this;
    },

    /**
        Draws or redraws the basemap given the URL of a new TopoJSON file.
        @param  basemap     {String}    Unique identifier (name) for the basemap
        @param  basemapUrl  {String}
     */
    setBasemap: function (basemap, basemapUrl) {
        var drawBasemap = Ext.Function.bind(function (json) {
            var sel = this.panes.basemap.append('g')
                .attr('id', 'basemap')

            sel.append('g')
                .attr('class', 'political region')
                .selectAll('path')
                .data(topojson.feature(json, json.objects.basemap).features)
                .enter().append('path')
                .attr('d', this.path);

            sel.append('path')
                .datum(topojson.mesh(json, json.objects.basemap, function (a, b) {
                    return a !== b; // Inner boundaries
                }))
                .attr('class', 'political boundary')
                .attr('d', this.path);
        }, this);

        // Remove the old basemap, if one exists
        this.panes.basemap.select('#basemap').remove()

        if (this.basemapUrl === basemapUrl) {
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

        return this;
    },

    /**
        Given a new projection, the drawing path is updated.
        @param  proj    {d3.geo.*}
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
