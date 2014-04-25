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
        An internal reference to the legend selection.
        @private
      */
    _legend: {},

    /**
        Flag to indicate whether or not the <rect> elements have already
        been added to the map.
        @private
     */
    isDrawn: false,

    /**TODO
     */
    d3margin: {
        top: 50,
        right: 10,
        bottom: 0,
        left: 100
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

    /**
        Add event listeners to the drawn elements.
        @param  sel {d3.selection}
        @return     {Flux.view.D3LinePlot}
     */
    addListeners: function (sel) {
        sel.on('mouseover', Ext.bind(function () {
            var c = d3.mouse(sel[0][0]);
            var d = this.scales.y.invert(c[1]);
            this.panes.tooltip.selectAll('.tip')
                .text(d.toFixed(2))
                .attr({
                    'x': c[0] + 20 + (this.d3margin.left - this.d3margin.right),
                    'y': c[1] + 30 + (this.d3margin.top - this.d3margin.bottom)
                });
        }, this));

        sel.on('mouseout', Ext.bind(function () {
            this.panes.tooltip.selectAll('.tip').text('');
        }, this));

        return this;
    },

    /**
        Draws the visualization features on the map given input data and the
        corresponding metadata.
        @param  model   {Flux.model.TimeSeries}
        @return         {Flux.view.D3LinePlot}
     */
    draw: function (model) {
        var sel;
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

        this.panes.title.selectAll('.title')
            .text(Ext.String.format('{0}: Daily Mean',
                this.getMetadata().get('_id')))
            .attr({
                'x': 0,
                'y': 0,
                'class': 'title'
            });

        this.scales.x.domain(d3.extent(data, function (d) {
            return d[0];
        }));
        this.scales.y.domain(d3.extent(data, function (d) {
            return d[1];
        }));

        this.panes.axis.x.call(this.axis.x);
        this.panes.axis.y.call(this.axis.y)
            .attr('transform', 'translate(0,-10)');

        // Grid lines //////////////////////////////////////////////////////////
        this.panes.plot.append('g')
            .attr('class', 'grid')
            .call(this.axis.y0)
            .attr('transform', 'translate(-' +
                (this.d3margin.left * 0.5).toString() + ',0)');

        // Plot line ///////////////////////////////////////////////////////////
        sel = this.panes.plot.append('path')
            .datum(data)
            .attr({
                'class': 'line',
                'd': path
            });

        if (!this.isDrawn) {
            // Add mouseover and mouseout event listeners
            this.addListeners(sel);
        }

        this.isDrawn = true;

        return this;
    },

    /**
        Initializes drawing; defines and appends the SVG element(s). The drawing
        panes are set up and SVG element(s) are initialized, sometimes with
        empty data sets.
        @param  width   {Number}
        @param  height  {Number}
        @return         {Flux.view.D3LinePlot}
     */
    init: function (width, height) {
        var elementId = '#' + this.items.getAt(0).id;
        var xPadding = (this.d3margin.left + this.d3margin.right);
        var yPadding = (this.d3margin.bottom + this.d3margin.top);

        // Remember the plot height for the .marker selection
        this._plotHeight = height - (yPadding + 30);

        // Scales //////////////////////////////////////////////////////////////
        this.scales.x = d3.time.scale()
            .range([0, width - xPadding]);
        this.scales.y = d3.scale.linear()
            .range([this._plotHeight, 0]);

        // Axes ////////////////////////////////////////////////////////////////
        this.axis.x = d3.svg.axis()
            .scale(this.scales.x)
            .orient('top')
            .tickPadding(6);

        this.axis.y = d3.svg.axis()
            .scale(this.scales.y)
            .orient('left')
            .ticks(5)
            .tickSize(0, 0, 0)
            .tickPadding(10);

        this.axis.y0 = d3.svg.axis()
            .scale(this.scales.y)
            .orient('left')
            .ticks(5)
            .tickSize(-(width - xPadding + (this.d3margin.left * 0.5)), 0, 0)
            .tickPadding(0)
            .tickFormat('');

        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            this.svg.remove()
        }

        // Drawing /////////////////////////////////////////////////////////////
        this.svg = d3.select(elementId).append('svg')
            .attr({
                'width': width,
                'height': height
            })

        // Create panes in which to organize content at difference z-index
        //  levels using painter's algorithm (first drawn on bottom; last drawn
        //  is on top)
        this.panes = {
            title: this.svg.append('g').attr({
                'class': 'pane title',
                'transform': 'translate(50,25)'
            })
        };

        this.panes.plot = this.svg.append('g').attr({
            'class': 'pane plot',
            'transform':
                'translate(' + this.d3margin.left + ',' + this.d3margin.top + ')'
        });

        this.panes.axis = {
            x: this.panes.plot.append('g').attr({
                'class': 'axis x',
                'transform': 'translate(0,' + (height - yPadding).toString() + ')'
            }),
            y: this.panes.plot.append('g').attr('class', 'axis y')
        };

        this.panes.overlay = this.panes.plot.append('g')
            .attr('class', 'pane overlay');

        this.panes.overlay.selectAll('.slice')
            .data([0])
            .enter()
            .append('rect')
            .attr('class', 'slice');

        this.panes.title.selectAll('.title')
            .data([0])
            .enter()
            .append('text')
            .text('')
            .attr('class', 'title');

        this.panes.tooltip = this.svg.append('g').attr('class', 'pane tooltip');
        this.panes.tooltip.selectAll('.tip')
            .data([0])
            .enter()
            .append('text')
            .text('')
            .attr('class', 'info tip');

        this.isDrawn = false;

        return this;
    },

    /**
        Redraws the current plot using a reference to the existing data model.
        @return {Flux.view.D3LinePlot}
     */
    redraw: function () {
        if (Ext.isEmpty(this._model)) {
            return this;
        }
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

    /**
        Updates the overlay annotation; typically a vertical line drawn on
        the time series at a given time.
        @param  moments {Array} Array of moment instances
        @return         {Flux.view.D3LinePlot}
     */
    updateAnnotation: function (moments) {
        var parser = this._model.parser;

        this.panes.overlay.selectAll('.slice')
            .data(Ext.Array.map(moments, function (m) {
                return parser(m.toISOString());
            }))
            .attr({
                'x': Ext.Function.bind(function (d) {
                    return this.scales.x(d) + 1;
                }, this),
                'y': 0,
                'width': 1,
                'height': this._plotHeight,
                'class': 'slice'
            });

        return this;
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


