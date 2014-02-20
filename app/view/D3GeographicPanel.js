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
    basemap: {
        isLoaded: false
    },

    /**
        Main drawing function; defines and appends the SVG element.
     */
    render: function (projection, width, height) {
        var elementId = '#' + this.items.getAt(0).id;

        foo = this;//FIXME

        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            this.svg.remove()
        }

        // Set the map projection
        projection.scale(width)
            .translate([width * 0.5, height * 0.5]);

        this.svg = d3.select(elementId).append('svg')
            .attr('width', width)
            .attr('height', height);

        this.path = d3.geo.path()
            .projection(projection);

        this.panes = { // Organizes visualization features into "panes"
            basemap: this.svg.append('g').attr('class', 'pane')
        };

        this.updateBasemap('/flux-client/political-usa.topo.json');

    },

    /**
        Draws or redraws the basemap given the URL of a new TopoJSON file.
        @param  basemapUrl  {String}
     */
    updateBasemap: function (basemapUrl) {
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

        // TODO Need to cache whether or not the basemap was loaded BEFORE
        if (this.basemap.isLoaded && this.basemap.url === basemapUrl) {
            drawBasemap(this.basemap.jsonData);
        } else {
            // Execute XMLHttpRequest for new basemap data
            d3.json(basemapUrl, Ext.Function.bind(function (error, json) {
                drawBasemap(json);
                this.basemap.jsonData = json;
            }, this));
        }

        this.basemap.isLoaded = true;
        this.basemap.url = basemapUrl;
    }

});
