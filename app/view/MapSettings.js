Ext.define('Flux.view.MapSettings', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.mapsettings',

    requires: [
        'Ext.form.field.Checkbox',
        'Ext.form.field.ComboBox'
    ],

    items: [{
        xtype: 'combo',
        name: 'projection',
        fieldLabel: 'Map projection'

    }, {
        xtype: 'combo',
        name: 'basemap',
        fieldLabel: 'Basemap'

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show legends'

    }, {
        xtype: 'checkbox',
        boxLabel: 'Show line plot'

    }]
});


