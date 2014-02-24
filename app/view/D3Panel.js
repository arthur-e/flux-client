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
        }
    },

    bodyStyle: {
        backgroundColor: '#ffffff'
    }

});
