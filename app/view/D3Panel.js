Ext.define('Flux.view.D3Panel', {
    extend: 'Ext.panel.Panel',
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
//        listeners: {
//            boxready: function () {
//                this.up('panel').on('boxready', function () {
//                    this.fireEvent('ready');
//                });
//            }
//        }
    },

    initComponent: function () {
//        this.addEvents('ready');
        this.callParent(arguments);
    }

});
