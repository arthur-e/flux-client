Ext.define('Flux.model.Metadata', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.Date'
    ],

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
                dates.push(new Date(str));
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
        type: 'auto',
    }, {
        name: 'uncertainty',
        type: 'auto'
    }],

    /**
        Returns an Array of Regular Expressions that describe dates that are
        outside the range of the data described by this Metadata instance.
     */
    getInvalidDates: function () {
        var dates = this.get('dates');
        var datesArray = [
            Ext.Date.format(dates[0], 'Y-m-d')
        ]; // Start with 1st date

        Ext.each(this.get('steps'), function (step, i) {
            var d = dates[i];

            // Keep adding dates until the next breakpoint is reached
            while (d < dates[i + 1]) {
                d = Ext.Date.add(d, Ext.Date.SECOND, step);
                datesArray.push(Ext.Date.format(d, 'Y-m-d'));
            }                
        });

        return ["^(?!" + datesArray.join("|") + ").*$"];
    }

});
