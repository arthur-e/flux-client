Ext.define('Flux.store.TimeSeries', {
    extend: 'Flux.store.AbstractStore',
    autoLoad: false,
    model: 'Flux.model.TimeSeries',
    resource: 't.json'
});
