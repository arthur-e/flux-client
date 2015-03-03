Ext.define('Flux.view.SavePopup', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.SavePopup',
    requires: [
        Ext.toolbar.Spacer
    ],
    layout: 'fit',
    floating: true,
    centered: true,
    modal: true,
    width: 300,
    height: 200,
    
    initComponent: function() {
        var me = this;
        this.dockedItems =  [{
            xtype: 'toolbar',
            title: 'PopUp',
            items: [{
                xtype: 'tbspacer'
            },{
                text: 'Close',
                handler: function(){
                    me.hide();
                }
            }]
        }];
        this.callParent();
        
        this.down('#output').down().state = 'image';
    },
    
    items: [{
        xtype: 'formpanel',
        layout: {
            type: 'border'
        },
            
        items: [{
            xtype: 'panel',
            itemId: 'output',
            region: 'west',
            border: true,
            items: [{
                xtype: 'reradiogroup',
                layout: 'vbox',
                stateId: 'saveType',
                state: 'image',
                items: [{
                    boxLabel: 'Image',
                    name: 'saveType',
                    inputValue: 'image',
                    id: 'image',
                    checked: true
                    }, {
                    boxLabel: 'Gridded Data',
                    name: 'saveType',
                    inputValue: 'data',
                    id: 'data',
                    }, {
                    boxLabel: 'Non-gridded Data',
                    name: 'saveType',
                    inputValue: 'overlay',
                    id: 'overlay',
                    hidden: true,
                }],
            
                propagateChange: function (sel) {
                    
                    if (this.up('form') === undefined) {
                        return;
                    }
                    
                    this.state = sel.saveType;
                    this.up('form').down("#filetype").getLayout().setActiveItem(sel.saveType);
                }
            }]
        },{
            xtype: 'panel',
            itemId: 'filetype',
            border: true,
            region: 'center',
            layout: 'card',

            items: [{
                xtype: 'reradiogroup',
                itemId: 'image',
                layout: 'vbox',
                stateId: 'imageFileType',
                state: 'png',
           
                items: [{
                    boxLabel: 'PNG',
                    name: 'imageFileType',
                    inputValue: 'png',
                    id: 'png',
                    checked: true
                }],
            
                propagateChange: function (sel) {
                    //console.log(sel);
                }
            },
            {
                xtype: 'reradiogroup',
                itemId: 'data',
                layout: 'vbox',
                stateId: 'dataFileType',
                state: 'ascii',
           
                items: [{
                    boxLabel: 'ESRI ASCII',
                    name: 'imageFileType',
                    inputValue: 'ascii',
                    id: 'ascii',
                    checked: true
                }],
            
                propagateChange: function (sel) {
                    //console.log(sel);
                }
            }, 
            {
                xtype: 'reradiogroup',
                itemId: 'overlay',
                layout: 'vbox',
                stateId: 'overlayFileType',
                state: 'csv',

                items: [{
                    boxLabel: 'CSV',
                    name: 'imageFileType',
                    inputValue: 'csv',
                    id: 'csv',
                    checked: true
                }],

                propagateChange: function (sel) {
                    //console.log(sel);
                }
            }]
        }, {
            xtype: 'panel',
            region: 'south',
            items: [{
                xtype: 'button',
                itemId: 'btn-save-file',
                text: 'Save',
            }]
        }]
    }]
});