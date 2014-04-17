Ext.define('Flux.model.Grid', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.Types',
        'Flux.type.Moment'
    ],

    fields: [{
        name: 'timestamp',
        type: Ext.data.Types.Moment
    }, {
        name: 'features',
        type: 'auto'
    }, {
        name: 'properties',
        type: 'auto'
    }],

    /**
        Returns a formatted timestamp that most accurately represents the time
        or span of time of the data.
        @param  fmt {String}    A moment.js format string
        @return     {String}
     */
    getTimestampDisplay: function (fmt) {
        var d0, d1;
        var props = this.get('properties');
        if (props) {
            if (props.start && props.end) {
                d0 = moment.utc(props.start).format(fmt);
                d1 = moment.utc(props.end).format(fmt);
                return Ext.String.format('{0} >>> {1}', d0, d1);
            }
        }

        return this.get('timestamp').format(fmt);
    }

});
