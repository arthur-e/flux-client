Ext.define('Flux.type.Moment', {
    requires: ['Ext.data.Types']
}, function () {
    Ext.data.Types.Moment = {
        convert: function (v) {
            return moment.utc(v);
        },
        sortType: function (v) {
            return v.toString();
        },
        type: 'Moment'
    };
});
