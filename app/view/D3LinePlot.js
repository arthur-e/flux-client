Ext.define('Flux.view.D3LinePlot', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3lineplot',
    requires: [
        'Flux.store.TimeSeries'
    ],

    bodyStyle: {
        backgroundColor: '#aaa'
    },

    /**
        Flag to indicate whether or not the <rect> elements have already
        been added to the map.
        @private
     */
    _isDrawn: false,

    /**
        An internal reference to the legend selection.
        @private
      */
    _legend: {},

    /**TODO
     */
    margin: {
        top: 10,
        right: 0,
        bottom: 0,
        left: 40
    },

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
         */
        this.scales = {};

        /**
         */
        this.axis = {};

        /**
            The Flux.Store.Grids instance associated with this view.
         */
        this.store = Ext.create('Flux.store.TimeSeries');

        this.callParent(arguments);
    },

    /**TODO
     */
    addListeners: function (sel) {
    },

    /**TODO
     */
    draw: function (model) {
        var x = this.scales.x;
        var y = this.scales.y;
        var data = d3.zip(model.getInterpolation(1, 'day'),
            model.get('series'));
        var path = d3.svg.line()
            .x(function (d) { return x(d[0]); })
            .y(function (d) { return y(d[1]); });

        // Retain references to last drawing data and metadata; for instance,
        //  resize events require drawing again with the same (meta)data
        this._model = model;

        this.getEl().unmask();

        this.scales.x.domain(d3.extent(data, function (d) {
            return d[0];
        }));
        this.scales.y.domain(d3.extent(data, function (d) {
            return d[1];
        }));

        this.panes.axis.x.call(this.axis.x);
        this.panes.axis.y.call(this.axis.y);

        this.panes.plot.append('path')
            .datum(data)
            .attr({
                'class': 'line',
                'd': path
            });

        return this;
    },

    /**TODO
     */
    init: function (width, height) {
        var elementId = '#' + this.items.getAt(0).id;
        var xPadding = (this.margin.left + this.margin.left);
        var yPadding = (this.margin.bottom + this.margin.top);

        // Scales //////////////////////////////////////////////////////////////
        this.scales.x = d3.time.scale()
            .range([0, width - xPadding]);
        this.scales.y = d3.scale.linear()
            .range([height - yPadding, 0]);

        // Axes ////////////////////////////////////////////////////////////////
        this.axis.x = d3.svg.axis()
            .scale(this.scales.x)
            .orient('top')
            .tickPadding(6);

        this.axis.y = d3.svg.axis()
            .scale(this.scales.y)
            .orient('left')
            .ticks(5)
            .tickPadding(6);

        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            console.log('Removing SVG', this.svg);//FIXME
            this.svg.remove()
        }

        this.svg = d3.select(elementId).append('svg')
            .attr({
                'width': width,
                'height': height
            })

        // Create panes in which to organize content at difference z-index
        //  levels using painter's algorithm (first drawn on bottom; last drawn
        //  is on top)
        this.panes = {
            plot: this.svg.append('g').attr({
                'class': 'plot',
                'transform':
                    'translate(' + this.margin.left + ',' + this.margin.top + ')'
            })
        };

        this.panes.axis = {
            x: this.panes.plot.append('g').attr({
                'class': 'axis x',
                'transform': 'translate(0,' + (height - yPadding).toString() + ')'
            }),
            y: this.panes.plot.append('g').attr('class', 'axis y')
        };

        this._isDrawn = false;

        return this;
    },

    /**TODO
     */
    redraw: function () {
        return this.draw(this._model);
    },

    /**
        Set the metadata; retains a reference to Flux.model.Metadata instance.
        @param  metadata    {Flux.model.Metadata}
        @return             {Flux.view.D3LinePlot}
     */
    setMetadata: function (metadata) {
        this._metadata = metadata;
        this.getEl().mask('Loading...');
        return this;
    },

    /**TODO
     */
    toggleLegend: function (state) {
        if (state) {
            this.panes.legend.attr('class', 'pane legend');
        } else {
            this.panes.legend.attr('class', 'pane legend hidden');
        }

        return this;
    },

    /**TODO
     */
    update: function (selection) {
    },

    /**TODO
     */
    updateLegend: function () {
    },

    /**
        Updates the color scale configuration of a specific view, as provided.
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  view    {Ext.Component}
        @param  opts    {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
        //TODO Could add a "_lastOptions" property to this view that stores
        //  the opts argument and makes it optional? That ways the view could
        //  call this method on its own
     */
    updateScale: function (opts) {
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

        //TODO Update scales
    },

});


