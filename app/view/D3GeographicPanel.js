Ext.define('Flux.view.D3GeographicPanel', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geopanel',
    requires: [
    ],

    initComponent: function () {
        this.projection = d3.geo.albersUsa();
        this.callParent(arguments);
    },

    /**
        Main drawing function; defines and appends the SVG element.
        @param  targetEl    {Ext.Component} The Component in whose body the visualization is to be rendered
     */
    render: function (targetEl) {
        foo = this;//FIXME

        this.projection.scale(targetEl.getWidth())
            .translate([targetEl.getWidth() * 0.5, targetEl.getHeight() * 0.5]);

        this.svg = d3.select('#d3content').append('svg')
            .attr('width', targetEl.getWidth())
            .attr('height', targetEl.getHeight());

        this.path = d3.geo.path()
            .projection(this.projection);

        this.panes = { // Organizes visualization features into "panes"
            basemap: this.svg.append('g').attr('class', 'pane basemap'),
        };

        this.updateBasemap('/flux-client/us-states.json');

    },

    /**
        Draws or redraws the basemap given the URL of a new TopoJSON file.
        @param  basemapUrl  {String}
     */
    updateBasemap: function (basemapUrl) {
        var panes = this.panes;
        var path = this.path;

        panes.basemap.select('#basemap').remove()

        // TODO Currently testing an implementation of http://bl.ocks.org/mbostock/2206590
        d3.json(basemapUrl, function (error, us) {
            var sel = panes.basemap.append('g')
                .attr('id', 'basemap')
                .selectAll('path')
                .data(topojson.feature(us, us.objects.states).features)
                .enter().append('path')
                .attr('d', path);

            sel.append('path')
                .datum(topojson.mesh(us, us.objects.states, function (a, b) {
                    return a !== b; // Inner boundaries
                }))
                .attr('id', 'state-borders')
                .attr('d', path);
        });
    }

});
