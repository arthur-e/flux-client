Ext.define('Flux.view.RoiOverlayForm', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.roioverlayform',
    requires: [
        'Ext.layout.container.Column'
    ],
    floating: true,
    modal: true,
    width: 580,
    closable: true,
    closeAction: 'hide',
    draggable: true,
    enableDisplay: true,
    resizable: true,
    styleHtmlContent: true,
    layout: 'fit',
    initComponent: function () {
        var view = this;
        this.callParent(arguments);
        
        view.on('render', function () {
            
            this.add(Ext.create('Ext.toolbar.Toolbar', {
                xtype: 'radiogroup',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [{
                    xtype: 'radiofield',
                    name: 'roi_radio',
                    inputValue: 'url',
                    checked: false,
                    boxLabel: 'From URL:',
                    hideOnClick: false,
                    handler: function(cmp) {
                        cmp.nextSibling('[xtype=textfield]').setDisabled(!cmp.checked);
                        cmp.nextSibling('[name=roi_text]').setDisabled(cmp.checked);    
                    }
                }, {
                    xtype: 'textfield',
                    name: 'roi_url',
                    padding: 2,
                    disabled: true,
                    enableKeyEvents: true,
                    listeners: {
                        keypress: function(textfield, eo) {
                            if (eo.getCharCode() == Ext.EventObject.ENTER) {
                                this.up('panel').down('button[itemId=submit]').handler();
                            }
                        }       
                   }
                }, {
                    xtype: 'radiofield',
                    name: 'roi_radio',
                    inputValue: 'text',
                    checked: true,
                    boxLabel: 'From text:',
                    hideOnClick: false
                }, {
                    xtype: 'button',
                    name: 'load_recent',
                    text: 'Load most recently drawn ROI',
                    disabled: true,
                    handler: function() {
                        view.fireEvent('loadRoi', this);
                    }
                    
                }, {
                    xtype: 'textarea',
                    name: 'roi_text',
                    padding: 2,
                    flex: 1,
                    enableKeyEvents: true,
                    listeners: {
                        keypress: function(textfield, eo) {
                            if (eo.getCharCode() == Ext.EventObject.ENTER) {
                                this.up('panel').down('button[itemId=submit]').handler();
                            }
                        }       
                   }
                }]
                
            }));
            
            this.addDocked(Ext.create('Ext.toolbar.Toolbar', {
                xtype: 'toolbar',
                layout: {
                    type: 'vbox',
                    align: 'right',
                    padding: 2
                },
                dock: 'bottom',
                ui: 'footer',
                items: [{
                    xtype: 'button',
                    text: 'Submit',
                    itemId: 'submit',
                    cls: 'add-roi-menu-item',
                    width: 120,
                    handler: function() {                              
                        this.up('panel').hide();
                        
                        // The 'submit' event is handled in UserInteraction.js
                        view.fireEvent('submit', this);
                    }  
                }]
            }));
            
        })
    }
});

