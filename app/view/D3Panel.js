Ext.define('Flux.view.D3Panel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.d3panel',
    requires: [
        'Ext.Component',
        'Ext.layout.container.Fit'
    ],

    layout: {
        type: 'fit'
    },

    items: {
        xtype: 'component',
        id: 'd3content',
        autoEl: {
            tag: 'div'
        },
        listeners: {
            boxready: function () {
                this.up('panel').render(this);
            }
        }
    },

    initComponent: function () {
        this.addEvents('innerboxready');
        this.callParent(arguments);
    }

});
