Ext.define('Flux.view.SourcesPanel', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.sourcespanel',

    items: [{
        xtype: 'combo',
        emptyText: 'Select dataset...'

    }, {
        xtype: 'datefield',
        emptyText: 'Select date/time...'
    }]
});
