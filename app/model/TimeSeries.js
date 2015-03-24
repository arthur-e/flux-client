// This model describes a Time Series like the line plot at the bottom of Single Map visualizations.

Ext.define('Flux.model.TimeSeries', {
    extend: 'Ext.data.Model',

    idProperty: '_id',

    fields: ['_id', {
        name: 'series',
        type: 'auto'
    }, {
        name: 'properties',
        type: 'auto'
    }],

    // Calculates the time stamps corresponding to each data point in the time series.
    // This assumes a uniform distribution of data i.e. steps never vary. This is not always the case
    getInterpolation: function (steps, stepSize) {
        var parser = d3.time.format.utc('%Y-%m-%dT%H:%M:%S.%LZ').parse;
        var end = moment.utc(this.get('properties').end);
        var t = moment.utc(this.get('properties').start).clone();
        var times = [];

        steps = steps || 1;
        stepSize = stepSize || ({ // Convert e.g. 'hourly' to 'hour'
            'hourly': 'hour',
            'daily': 'day',
            'monthly': 'month'
        })[this.get('properties').interval];

        while (t.isBefore(end)) {
            times.push(parser(t.toISOString()));
            t.add(steps, stepSize);
        }

        return d3.zip(times, this.get('series'));
    }

});
