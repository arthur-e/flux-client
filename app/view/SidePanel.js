Ext.define('Flux.view.SidePanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.sidepanel',
    requires:[
        'Ext.layout.container.Fit'
    ],

    collapsible: true,
    resizable: true,
    titleCollapse: true,

    layout: {
        type: 'fit'
    },

    maxWidth: 300,
    stateful: true,

    getState: function () {
        return {
            collapsed: this.collapsed,
            width: this.getWidth()
        }
    },

    initComponent: function () {
        // Create a new state Provider if one doesn't already exist
        if (Ext.state.Manager.getProvider().path === undefined) {
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
        }

        this.on('render', function () {
            if (Ext.getBody().getWidth() > 1000) {
                this.setWidth(250);
            } else {
                this.setWidth('20%');
            }
        });

        this.callParent(arguments);
    }
});
