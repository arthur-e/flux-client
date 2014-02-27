Ext.define('Flux.view.D3Panel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.d3panel',
    requires: [
        'Ext.Component',
        'Ext.layout.container.Fit',
        'Ext.toolbar.Item',
        'Ext.toolbar.Toolbar'
    ],

    layout: {
        type: 'fit'
    },

    bbar: {
        border: true,
        style: { borderColor: '#157fcc' },
        items: ['->', {
            xtype: 'tbitem',
            width: 150,
            height: 45,
            html: '<a href="http://mtu.edu"><img src="/flux-client/resources/MTRI_logo.png" /></a>'
        }]
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
