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

        this.panes = { // Organizes visualization features into "panes"
            basemap: this.svg.append('g').attr('class', 'pane')
        };

        this.setProjection(proj);

        this.setBasemap('global', '/flux-client/political.topo.json');

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
    },

    /**
        Given a new projection, the drawing path is updated.
     */
    setProjection: function (proj) {
        proj.translate([this.svg.attr('width') * 0.5, this.svg.attr('height') * 0.5])

        this.path = d3.geo.path()
            .projection(proj);

        // Update the data in every currently drawn path
        this.svg.selectAll('path')
            .attr('d', this.path);
    }

});
