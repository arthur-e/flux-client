// The Store where all TimeSeries instances are stored.

Ext.define('Flux.store.TimeSeries', {
    extend: 'Flux.store.AbstractStore',
    autoLoad: false,
    model: 'Flux.model.TimeSeries',
    resource: 't.json'
});
