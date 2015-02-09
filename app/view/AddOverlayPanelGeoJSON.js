Ext.define('Flux.view.AddOverlayPanelGeoJSON', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.ao_geojson',
    requires: [
        'Ext.layout.container.Column',
    ],
    floating: true,
    modal: true,
    width: 580,
    draggable: true,
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
                    align: 'stretch',
                },
                items: [{
                    xtype: 'radiofield',
                    name: 'roi_geojson',
                    inputValue: 'url',
                    checked: false,
                    boxLabel: 'From URL:',
                    hideOnClick: false,
                    handler: function(cmp) {
                        cmp.nextSibling('[xtype=textfield]').setDisabled(!cmp.checked);
                        cmp.nextSibling('[name=geojson_text]').setDisabled(cmp.checked);    
                    }
                }, {
                    xtype: 'textfield',
                    name: 'geojson_url',
                    padding: 2,
                    value: 'https://rawgit.com/johan/world.geo.json/master/countries/USA/CA.geo.json',
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
                    name: 'roi_geojson',
                    inputValue: 'text',
                    checked: true,
                    boxLabel: 'From text:',
                    hideOnClick: false
                }, {
                    xtype: 'textarea',
                    name: 'geojson_text',
                    padding: 2,
                    value: '{"type":"Feature","geometry":{ "type": "Polygon","coordinates": [[[-100.0,50.0],[-105.0,50.0],[-105.0,55.0],[-100.0,55.0],[-100.0,50.0]]]}}',
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
                    padding: 2,
                },
                dock: 'bottom',
                ui: 'footer',
                items: [{
                    xtype: 'button',
                    text: 'Submit',
                    itemId: 'submit',
                    cls: 'add-overlay-menu-item',
                    width: 120,
                    handler: function() {                              
                        this.up('panel').hide();
                        
                        // The 'submit' event is handled in UserInteraction.js
                        view.fireEvent('submit', this);
                    }  
                }],
            }));
            
        })
    }
});

