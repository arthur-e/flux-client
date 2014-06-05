Ext.define('Flux.model.Metadata', {
    extend: 'Ext.data.Model',

    idProperty: '_id',

    fields: [
        '_id',
        'bboxmd5',
        'title', {

        name: 'bbox',
        type: 'auto'
    }, {
        name: 'dates',
        type: 'auto',
        convert: function (val) {
            var dates = [];
            Ext.each(val, function (str) {
                dates.push(new moment.utc(str));
            });
            return dates;
        }
    }, {
        name: 'gridded',
        type: 'boolean'
    }, {
        name: 'gridres',
        type: 'auto'
    }, {
        name: 'precision',
        type: 'int',
        defaultValue: 2
    }, {
        name: 'spans',
        type: 'auto'
    }, {
        name: 'stats',
        type: 'auto'
    }, {
        name: 'steps',
        type: 'auto'
    }, {
        name: 'uncertainty',
        type: 'auto'
    }, {
        name: 'units',
        type: 'auto'
    }],

    /**
        Calculates the true grid cell centroids by adding half the grid spacing;
        this was subtracted to obtain the upper-left corner of the grid cell, so
        this calculation basically restores the grid cell centroid from the SVG
        <rect> element's upper-corner.
     */
    calcHalfOffsetCoordinates: function (g) {
        g[0] = (g[0] < 0) ? (g[0] + (Number(this.get('gridres').x) * 0.5)) : 
            (g[0] - (Number(this.get('gridres').x) * 0.5));
        g[1] = (g[1] < 0) ? (g[1] + (Number(this.get('gridres').y) * 0.5)) :
            (g[1] - (Number(this.get('gridres').y) * 0.5))

        return Ext.Array.map(g, function (v) {
            return v.toFixed(5);
        });
    },

    /**
        Returns an Array of Regular Expressions that describe dates that are
        outside the range of the data described by this Metadata instance.
     */
    getDisabledDates: function (fmt) {
        var bkpts;
        var dates = this.get('dates');
        var datesArray = [];

        fmt = fmt || 'YYYY-MM-DD';

        // Start with 1st date
        datesArray.push(dates[0].format(fmt));

        bkpts = this.get('steps');
        if (Ext.isEmpty(this.get('steps'))) {
            bkpts = this.get('spans');
        }

        Ext.each(bkpts, function (step, i) {
            var d = dates[i].clone();

            // Keep adding dates until the next breakpoint is reached
            while (d < dates[i + 1]) {
                d.add(step, 's'); // Add the specified number of seconds
                datesArray.push(d.format(fmt));
            }                
        });

        return ["^(?!" + datesArray.join("|") + ").*$"];
    },

    /**
        Returns a new quantile scale (d3.scale.quantile instance) that fits the
        data according to the summary statistics and any specified configuration
        options.
        @param  config  {Object}
        @return {d3.scale.quantile}
     */
    getQuantileScale: function (config, parameter) {
        var stats;
        var sigmas = config.sigmas || 2;
        var tendency = config.tendency || 'mean';
        var domain = config.domain; // Default to defined bounds

        stats = this.get('stats')[parameter || 'values'];

        if (config.autoscale) { // If no defined bounds...
            domain = [
                (stats[tendency] - (sigmas * stats.std)), // Lower bound
                (stats[tendency] + (sigmas * stats.std))  // Upper bound
            ]
        }

        if (config.paletteType === 'diverging') {
            // Diverging scales are symmetric about the measure of central tendency
            domain.splice(1, 0, stats[tendency]);
        }

        return d3.scale.quantile().domain(domain);

    },

    /**
        Returns the Array of time steps or spans, depending on which is used;
        enforces the policy of preferring steps over spans (checks for steps first).
        @return {Array}
     */
    getTimeOffsets: function () {
        if (Ext.isEmpty(this.get('steps'))) {
            return this.get('spans');
        }

        return this.get('steps');
    },

    /**
        Creates a threshold scale; a hack that acts like a d3.scale.* object.
        The result is a function that returns the specified color value for
        input numeric values that fall within the integer bounds of the given
        breakpoint(s).
        @param  bkpts   {Array}     The breakpoint(s) for the binary mask
        @param  colors  {String}    The color to use for the binary mask
        @return         {Function}
     */
    getThresholdScale: function (bkpts, color) {
        var scale;

        if (!Ext.isArray(bkpts)) {
            bkpts = [bkpts];
        }

        if (bkpts.length === 1) {
            scale = function (d) {
                if (d >= Math.floor(bkpts[0]) && d < (Math.floor(bkpts[0]) + 1)) {
                    return color;
                }

                return 'rgba(0,0,0,0)';
            };

        } else {
            scale = function (d) {
                if (d >= bkpts[0] && d < bkpts[1]) {
                    return color;
                }

                return 'rgba(0,0,0,0)';
            };

        }

        scale._d = bkpts;
        scale._r = [color];
        scale.domain = function (d) {
            if (d) {
                this._d = d;
                return this;
            }
            return this._d;
        };
        scale.range = function (r) {
            if (r) {
                if (Ext.isArray(r)) {
                    r = [r[0]];
                } else {
                    r = [r];
                }
                this._r = r;
                return this;
            }
            return this._r;
        };

        return scale;
    }

});




