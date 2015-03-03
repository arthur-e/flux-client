// This is a simple model that has some basic information about a scenario; used in populating the drop-down list of available scenarios.

Ext.define('Flux.model.Scenario', {
    extend: 'Ext.data.Model',
    idProperty: '_id',
    fields: ['_id', 'title', 'gridded']
});
