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

    /**TODO
     */
    getInterpolation: function (steps, stepSize) {
        var parser = d3.time.format.utc('%Y-%m-%dT%H:%M:%S.%LZ').parse;
        var start = moment.utc(this.get('properties').start);
        var end = moment.utc(this.get('properties').end);
        var t = start.clone();
        var times = [];
        
        while (t.isBefore(end)) {
            t.add(steps, stepSize);
            times.push(parser(t.toISOString()));
        }

        return times;
    }

});
