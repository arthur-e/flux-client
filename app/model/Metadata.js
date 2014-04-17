Ext.define('Flux.model.Metadata', {
    extend: 'Ext.data.Model',

    idProperty: '_id',

    fields: [
        '_id',
        'bboxmd5', {

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
    }],

    /**
        Returns an Array of Regular Expressions that describe dates that are
        outside the range of the data described by this Metadata instance.
     */
    getInvalidDates: function (fmt) {
        var dates = this.get('dates');
        var datesArray = [];

        fmt = fmt || 'YYYY-MM-DD';

// Should not be necessary to sort them
//        dates.sort(function compare (a, b) {
//            if (a.isBefore(b)) {
//                return -1;
//            }

//            if (a.isAfter(b)) {
//               return 1;
//            }

//            return 0;
//        });

        // Start with 1st date
        datesArray.push(dates[0].format(fmt));

        Ext.each(this.get('steps'), function (step, i) {
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
    getQuantileScale: function (config) {
        var stats = this.get('stats');
        var sigmas = config.sigmas || 2;
        var tendency = config.tendency || 'mean';
        var domain = config.domain; // Default to defined bounds

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

    }

});




