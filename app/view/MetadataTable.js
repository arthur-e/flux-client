Ext.define('Flux.view.MetadataTable', {
    extend: 'Ext.grid.property.Grid',
    alias: 'widget.metadatatable',
    floating: true,
    width: 620,
    closable: true,
    closeAction: 'hide',
    draggable: true,
    enableDisplay: true,
    resizable: true,
    styleHtmlContent: true,
    layout: 'fit',
    sortableColumns: false
})