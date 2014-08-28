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

    /**
        The margin, in pixels, around the SVG that is drawn inside this panel.
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
            Container for scales.
         */
        this.scales = {};

        /**
            Container for axis objects.
         */
        this.axis = {};

        /**
            The Flux.store.Rasters instance associated with this view.
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
        sel.on('mousemove', Ext.bind(function () {
            var p = this.getMetadata().get('precision');
            var c = d3.mouse(sel[0][0]);
            var d = this.scales.y.invert(c[1]);
            var t = Ext.String.format('{0}: {1}',
                moment.utc(this.scales.x.invert(c[0])).format('YYYY-MM-DD'),
                d.toFixed(p));

            this.panes.tooltip.selectAll('.tip')
                .text(t)
                .attr({
                    'x': c[0] + 20 + (this.d3margin.left - this.d3margin.right),
                    'y': c[1] + 30 + (this.d3margin.top - this.d3margin.bottom)
                });
        }, this));

        sel.on('mouseout', Ext.bind(function () {
            this.panes.tooltip.selectAll('.tip').text('');
        }, this));

        sel.on('click', Ext.bind(function () {
            var c = d3.mouse(sel[0][0]);
            this.fireEventArgs('plotclick', [this, c]);
        }, this));

        return this;
    },

    /**
        Plots an additional line from a given time series.
        @param  series      {Array}
        @param  displayText {String}
     */
    addSeries: function (series, displayText) {
        var t0, t1, sel;
        var x = this.scales.x;
        var y = this.scales.y;
        var data = series.getInterpolation();
        var path = d3.svg.line()
            .x(function (d) { return x(d[0]); })
            .y(function (d) { return y(d[1]); });

        this.panes.plot.selectAll('.series')
            .data([0])
            .enter()
            .append('path')
            .attr({
                'class': 'series'
            });

        t0 = this.panes.plot.transition().duration(250);
        t1 = t0.transition().duration(250);

        // Plot line ///////////////////////////////////////////////////////////
        sel = this.panes.plot.selectAll('.series')
            .datum(data);

        t0.selectAll('.series').attr('d', path);
        t0.selectAll('.trend').attr('d', path);
        this.scales.y.domain(d3.extent(data, function (d) {
            return d[1];
        }));

        t1.selectAll('.series').attr('d', path);
        t1.selectAll('.trend').attr('d', path);
        t1.selectAll('.y.axis').call(this.axis.y);

        // Grid lines //////////////////////////////////////////////////////////
	
        t1.selectAll('.gridy').attr('class', 'gridy').call(this.axis.y0);
	t1.selectAll('.gridx').attr('class', 'gridx').call(this.axis.x0);

        this.panes.title.selectAll('.legend-entry')
            .text(displayText || '')
            .attr({
                'x': Ext.Function.bind(function () {
                    // Estimate the width of the characters
                    return Number(this.svg.attr('width')) - (this.d3margin.left + this.d3margin.right);
                }, this),
                'y': 0,
                'text-anchor': 'end', // Display right end of text at right end of plot
                'class': 'legend-entry'
            });

        // Add mouseover and mouseout event listeners
        this.addListeners(sel);
    },

    /**
        Clears the plot.
        TODO This implementation has errors.
     */
    clear: function () {
        this.panes.plot.selectAll('.series').remove();
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
        var data = model.getInterpolation();
        var meta = this.getMetadata();
        var path = d3.svg.line()
            .x(function (d) { return x(d[0]); })
            .y(function (d) { return y(d[1]); });

        // Retain references to last drawing data and metadata; for instance,
        //  resize events require drawing again with the same (meta)data
        this._model = model;

        this.getEl().unmask();

        this.panes.title.selectAll('.legend-title')
            .text(Ext.String.format('{0}all-time {1} {2} of {2}',
                (Ext.isEmpty(meta.get('title'))) ? '' : (meta.get('title') + ': '),
                model.get('properties').interval || '',
                model.get('properties').aggregate) || '')
            .attr({
                'x': 0,
                'y': 0,
                'class': 'legend-title'
            });

        this.scales.x.domain(d3.extent(data, function (d) {
            return d[0];
        }));
        this.scales.y.domain(d3.extent(data, function (d) {
            return d[1];
        }));

        this.panes.axis.x.call(this.axis.x)
	    .selectAll("text")
		.attr('transform', function(d) {
		    return 'translate(10, 0),rotate(-45)'
		});
		//.attr('transform', 'translate(0, 10)');
        this.panes.axis.y.call(this.axis.y);
            //.attr('transform', 'translate(0,-8)');

        // Grid lines //////////////////////////////////////////////////////////
	this.panes.plot.selectAll('.gridx')
	    .attr('class','gridx')
	    .call(this.axis.x0);
		//.attr('transform','translate(0,' +
		//(this.d3margin.top).toString() + ')');
	
        this.panes.plot.selectAll('.gridy')
            .attr('class', 'gridy')
            .call(this.axis.y0);
            //.attr('transform', 'translate(-' +
            //    (this.d3margin.left * 0.5).toString() + ',0)');

        // Plot line ///////////////////////////////////////////////////////////
        sel = this.panes.plot.selectAll('.trend')
            .datum(data)
            .attr({
                'class': 'trend',
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
            .tickPadding(14)
	    .tickSize(0, 0, 0)
	    .tickFormat(d3.time.format("%b"));

        this.axis.y = d3.svg.axis()
            .scale(this.scales.y)
            .orient('left')
            .ticks(5)
            .tickSize(0, 0, 0)
            .tickPadding(10);

        // This one's for the grid lines
	this.axis.x0 = d3.svg.axis()
	    .scale(this.scales.x)
	    .orient('top')
	    .tickSize(-(height - yPadding - 30), 0, 0)
	    .tickPadding(2)
	    .tickFormat('');
	    
        this.axis.y0 = d3.svg.axis()
            .scale(this.scales.y)
            .orient('left')
            .ticks(5)
            //.tickSize(-(width - xPadding + (this.d3margin.left * 0.5)), 0, 0)
	    .tickSize(-(width - xPadding), 0, 0)
            .tickPadding(0)
            .tickFormat('');

        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            this.svg.remove();
        }

        // Drawing /////////////////////////////////////////////////////////////
        this.svg = d3.select(elementId).append('svg')
            .attr({
                'width': width,
                'height': height
            });

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

        // Grid lines //////////////////////////////////////////////////////////
        this.panes.plot.append('g')
            .attr('class', 'gridx');

	this.panes.plot.append('g')
            .attr('class', 'gridy');

        // Overlays ////////////////////////////////////////////////////////////
        this.panes.overlay = this.panes.plot.append('g')
            .attr('class', 'pane overlay');
        this.panes.overlay.selectAll('.slice')
            .data([0])
            .enter()
            .append('rect')
            .attr('class', 'slice');

        // Plot line ///////////////////////////////////////////////////////////
        this.panes.plot.selectAll('.trend')
            .data([0])
            .enter()
            .append('path')
            .attr({
                'class': 'trend'
            });

        // Title ///////////////////////////////////////////////////////////////
        this.panes.title.selectAll('.legend-entry')
            .data([0])
            .enter()
            .append('text')
            .text('')
            .attr('class', 'legend-entry');

        this.panes.title.selectAll('.legend-title')
            .data([0])
            .enter()
            .append('text')
            .text('')
            .attr('class', 'legend-title');

        // Tooltip /////////////////////////////////////////////////////////////
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

        // Clear the plot before drawing on it again
        return this.clear().redraw();
    },

    /**
        Updates the overlay annotation; typically a vertical line drawn on
        the time series at a given time.
        @param  moments {Array} Array of moment instances
        @return         {Flux.view.D3LinePlot}
     */
    updateAnnotation: function (moments) {
        var attr = {
            'x': Ext.Function.bind(function (d) {
                return this.scales.x(d) + 1;
            }, this),
            'y': 0,
            'width': 1,
            'height': this._plotHeight,
            'class': 'slice',
            'fill-opacity': 1
        };
        var data = Ext.Array.map(moments, function (m) {
            return d3.time.format.utc('%Y-%m-%dT%H:%M:%S.%LZ')
                .parse(m.toISOString());
        });

        if (data.length > 1) {
            attr['fill-opacity'] = 0.2;
            attr.width = this.scales.x(data[1]) - this.scales.x(data[0]);
            data = [data[0]];
        }

        this.panes.overlay.selectAll('.slice')
            .data(data)
            .attr(attr);

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
    updateScale: function () {
        var metadata;

        if (!this.getMetadata()) {
            return;
        }

        if (!this._usePopulationStats && this.getModel()) {
            metadata = this.getMetadata().copy();
            metadata.set('stats', {
                values: this.getModel().summarize()
            });

            this.setMetadata(metadata);

        } else {
            metadata = this.getMetadata();
        }

        //TODO Update scales
    }

});


