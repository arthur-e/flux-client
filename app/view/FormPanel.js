Ext.define('Flux.view.FormPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.formpanel',
    requires: [
        'Ext.form.FieldContainer',
        'Ext.form.FieldSet',
        'Ext.form.field.Checkbox',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Date',
        'Ext.form.field.Radio',
        'Ext.form.field.Number',
        'Ext.form.field.Time',
        'Ext.layout.container.Form',
        'Ext.slider.Multi',
        'Flux.field.EnumeratedSlider'
    ],

    layout: {
        type: 'form'
    },

    bodyPadding: '0 7px 0 7px',

    defaults: {
        labelAlign: 'top',
        labelStyle: 'font-weight: bold;'
    }

});
