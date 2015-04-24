// This model represents Metadata associated with a certain dataset (a scenario). The unique `_id` is the scenario name. Otherwise, the fields of this model correspond to the Metadata model documented in the Python API.

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
        name: 'grid',
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

    // Calculates the true grid cell centroids by adding half the grid spacing;
    // this was subtracted to obtain the upper-left corner of the grid cell, so
    // this calculation basically restores the grid cell centroid from the SVG
    // <rect> element's upper-corner.

    calcHalfOffsetCoordinates: function (g) {
        g[0] = (g[0] < 0) ? (g[0] + (Number(this.get('grid').x) * 0.5)) :
            (g[0] - (Number(this.get('grid').x) * 0.5));
        g[1] = (g[1] < 0) ? (g[1] + (Number(this.get('grid').y) * 0.5)) :
            (g[1] - (Number(this.get('grid').y) * 0.5))

        return Ext.Array.map(g, function (v) {
            return v.toFixed(5);
        });
    },

    // Constructs an Array of all of the dates for which the data are available.
    //
    //     @return {Array}

    getAllDates: function () {
        var dates;
        var datesArray = [];
        var bkpts = this.getTimeOffsets();

        if (!Ext.isEmpty(this._dates)) {
            return this._dates;
        }

        if (Ext.isEmpty(bkpts)) {
            return this.get('dates');
        }

        dates = this.get('dates');

        // Start with 1st date
        datesArray.push(dates[0]);

        Ext.each(bkpts, function (step, i) {
            var d = dates[i].clone();

            // Keep adding dates until the next breakpoint is reached
            while (dates[i + 1] && d.isBefore(dates[i + 1])) {
                d.add(step, 's'); // Add the specified number of seconds
                datesArray.push(d.clone());
            }
        });

        this._dates = datesArray;

        return datesArray;
    },

    // Find the "nearest" date in the dates Array to the given date; date could
    // be before or after the given date.
    //
    //     @param  date    {moment|Date}
    //     @return         {moment}

    getNearestDate: function (date) {
        var ds = this.getAllDates();
        var ms = Ext.Array.map(ds, function (d) {
            return Math.abs(d.valueOf() - date.valueOf());
        });

        return ds[ms.indexOf(Ext.Array.min(ms))];
    },

    // Returns an Array of Regular Expressions that describe dates that are
    // outside the range of the data described by this Metadata instance.
    //
    //     @param  fmt {String}    A moment.js format string
    //     @return     {Array}

    getDisabledDates: function (fmt) {
        fmt = fmt || 'YYYY-MM-DD';

        var dates = Ext.Array.map(this.getAllDates(), function (d) {
            return d.format(fmt);
        });

        return ["^(?!" + dates.join("|") + ").*$"];
    },

    // Returns a new quantile scale (d3.scale.quantile instance) that fits the
    // data according to the summary statistics and any specified configuration
    // options.
    //
    //     @param  config  {Object}
    //     @return {d3.scale.quantile}

    getQuantileScale: function (config, offset) {
        var sigmas = config.sigmas || 2;
        var domain = config.domain; // Default to defined bounds
        var stats = this.getSummaryStats();
        var tendency = config.tendency;

        // Reset the offset to zero if Current Data Frame is being used
        // if (config.statsFrom === 'data') {
        //     offset = 0;
        // }

    	if (typeof tendency === 'undefined') {
    	    tendency = 'mean';
    	}

    	// If mean/median is the selected central tendency, get from stats
    	if (['mean','median'].indexOf(tendency) > -1) {
    	    var central_tendency = stats[tendency];
    	} else { // otherwise set to the user-provided value
    	    var central_tendency = tendency;
    	}

        if (config.autoscale) { // If no defined bounds...
    	    domain = [
        		(central_tendency - offset - (sigmas * stats.std)), // Lower bound
        		(central_tendency - offset + (sigmas * stats.std))  // Upper bound
	       ]
        }

    	// Diverging scales are symmetric about the measure of central tendency
    	// For anomalies, diverging scales are symmetric about 0 (what offset is for);
        if (config.paletteType === 'diverging') {
	       domain.splice(1, 0, central_tendency - offset);
        }

        return d3.scale.quantile().domain(domain);
    },

    // A convenience function for returning the summary stats for a given data
    // series--a non-trivial operation as the series might be named `values` or
    // or `value` or something else entirely.

    getSummaryStats: function (p) {
        var stats;

        Ext.each([p, 'values', 'value'], function (k) {
            // If it can be found, return false to stop iteration
            stats = this.get('stats')[k];
            return !stats;
        }, this);

        return stats;
    },

    // Returns the Array of time steps or spans, depending on which is used;
    // enforces the policy of preferring steps over spans (checks for steps first).
    //     @return {Array}

    getTimeOffsets: function () {
        if (!Ext.isEmpty(this.get('steps'))) {
            return this.get('steps');
        }
        if (!Ext.isEmpty(this.get('spans'))) {
            return this.get('spans');
        }

        return; // Or return undefined
    },

    // Returns an Array of times (as `moment` instances) for which data in this scenario are available.

    getTimes: function (forDate) {
        var i, mins;
        var step = Ext.Array.min(this.getTimeOffsets() || []);
        var d0 = moment.utc(Ext.Array.min(this.get('dates')));
        var times = [];
        var m = 0;

        // If a Date is given, return the times available for that date
        if (forDate) {
            forDate = moment.utc(forDate);
            times = Ext.Array.map(
                Ext.Array.filter(
                    Ext.Array.map(this.get('dates'), function (d) {
                        return moment.utc(d);

                    }), function (d) {
                    return (forDate.format('YYYYMMDD') === d.format('YYYYMMDD'));

                }), function (d) {
                return d.format('HH:mm');
            });

        // Otherwise, we must use the minimum step/span to interpolate times
        } else if (!Ext.isEmpty(step)) {
            // Calculate the minutes between each datum
            mins = (step / 60);
            for (i = 0; i < (1440 / mins); i += 1) {
                times.push([
                    d0.clone().add(m, 'minutes').format('HH:mm')
                ]);
                m += mins;
            }
        }

        return times;
    },

    // Creates a threshold scale; a hack that acts like a d3.scale.* object.
    // The result is a function that returns the specified color value for
    // input numeric values that fall within the integer bounds of the given
    // breakpoint(s).
    //
    //     @param  bkpts   {Array}     The breakpoint(s) for the binary mask
    //     @param  colors  {String}    The color to use for the binary mask
    //     @return         {Function}

    getThresholdScale: function (bkpts, color, offset) {
        var scale;

        if (!Ext.isArray(bkpts)) {
            bkpts = [bkpts];
        }

        if (bkpts.length === 1) {
            scale = function (d) {
                if (d >= Math.floor(bkpts[0])) {// && d < (Math.floor(bkpts[0]) + 1)) {
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
