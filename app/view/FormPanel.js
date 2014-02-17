Ext.define('Flux.view.FormPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.formpanel',
    requires: [
        'Ext.form.field.ComboBox',
        'Ext.form.field.Date',
        'Ext.layout.container.Form',
    ],

    layout: {
        type: 'form'
    },

    bodyPadding: 5

});
