Ext.define('Flux.view.FormPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.formpanel',
    requires: [
        'Ext.data.ArrayStore',
        'Ext.form.FieldSet',
        'Ext.form.field.Checkbox',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Date',
        'Ext.form.field.Hidden',
        'Ext.form.field.Radio',
        'Ext.form.field.Number',
        'Ext.form.field.Time',
        'Ext.form.RadioGroup',
        'Ext.layout.container.Form',
        'Ext.slider.Multi',
        'Ext.XTemplate',
        'Flux.field.EnumeratedSlider',
        'Flux.field.StatefulCheckbox',
        'Flux.field.StatefulRadioGroup',
        'Flux.field.StatefulComboBox'
    ],

    layout: {
        type: 'anchor'
    },

    autoScroll: true,

    border: false,

    bodyPadding: '3px 7px 0 7px',

    bodyStyle: {
        backgroundColor: '#eeeeee'
    },

    defaults: {
        labelAlign: 'top',
        labelStyle: 'font-weight: bold;'
    }

});
