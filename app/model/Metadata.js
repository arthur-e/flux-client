Ext.define('Flux.model.Metadata', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.Date'
    ],

    fields: [
        'bboxmd5',
        '_id', {

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

        name: 'stats',
        type: 'auto'
    }, {

        name: 'gridded',
        type: 'boolean'
    }, {

        name: 'bbox',
        type: 'auto'
    }, {

        name: 'intervals',
        type: 'auto'
    }, {

        name: 'gridres',
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

        Ext.each(this.get('intervals'), function (interval, i) {
            var d = dates[i];

            // Keep adding dates until the next breakpoint is reached
            while (d < dates[i + 1]) {
                d = Ext.Date.add(d, Ext.Date.SECOND, interval);
                datesArray.push(Ext.Date.format(d, 'Y-m-d'));
            }                
        });

        return ["^(?!" + datesArray.join("|") + ").*$"];
    }

});
