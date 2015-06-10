Ext.define('Flux.view.NongriddedPanel', {
    extend: 'Flux.view.FormPanel',
    alias: 'widget.nongriddedpanel',

    requires: [
        'Ext.form.field.ComboBox'
    ],

    items: [{
        xtype: 'checkbox',
        name: 'showNongridded',
        stateId: 'showNongridded',
        //stateful: true,
        disabled: true,
        checked: false,
        boxLabel: 'Show'
    }, {
        xtype: 'fieldcontainer',
        layout: 'hbox',
        fieldLabel: 'Select non-gridded data source',
        items: [{
            xtype: 'button',
            itemId: 'btn-info-nongridded',
            tooltip: 'View metadata of the selected source',
            iconCls: 'icon-info',
            cls: 'info-button',
            disabled: true,
            margin: '0 4 0 0',
            listeners: {
                mouseover: function () {
                    this.setIconCls('icon-info-hover');
                },
                mouseout: function () {
                    this.setIconCls('icon-info');
                }   
            }
        }, {
                xtype: 'combo',
                name: 'source_nongridded',
                anchor: '100%',
                emptyText: 'Select...',
                style: {maxWidth: '200px'},
                displayField: '_id',
                valueField: '_id',
                queryMode: 'local',
                editable: false,
                flex: 1,
                tpl: Ext.create('Ext.XTemplate', [
                    '<tpl for=".">',
                        '<div class="x-boundlist-item">',
                            '{title} ({_id})',
                        '</div>',
                    '</tpl>'
                ].join('')),
                listeners: {
                    collapse: function () {
                        this.store.clearFilter(true);
                    },
                    expand: function () {
                        this.store.filter('gridded', false);
                    },
                    render: function () {
                        this.bindStore(Ext.StoreManager.get('scenarios'));
                    },
                    dirtychange: function () {
                        this.up('form').down('field[name=start]').enable();
                        this.up('form').down('field[name=end]').enable();
                    },
                    select: function () {
                    // Enable the source info button
                        if (this.getValue() != 'Select...') {
                            this.up().down('button').enable();
                        } else {
                            this.up().down('button').disable();
                        }
                    }
                }
            }
        ]

    }, {
        xtype: 'datefield',
        name: 'start',
        anchor: '100%',
        disabled: true,
        emptyText: 'Select start date...',
        format: 'Y-m-d H:i',
        fieldLabel: 'From',
        labelAlign: 'left',
        labelWidth: 60,
        listeners: {
            change: function (c, value) {
                this.up('form').down('field[name=end]').setMinValue(value);
            },
            select: function (c, value) {
                this.setValue(moment(value).hours(0).minutes(0).toDate());
                this.fireEventArgs('afterselect', [this]);
            }
        }

    }, {
        xtype: 'datefield',
        name: 'end',
        anchor: '100%',
        disabled: true,
        emptyText: 'Select end date...',
        format: 'Y-m-d H:i',
        fieldLabel: 'To',
        labelAlign: 'left',
        labelWidth: 60,
        listeners: {
            change: function (c, value) {
                this.up('form').down('field[name=start]').setMaxValue(value);
            },
            select: function (c, value) {
                this.setValue(moment(value).hours(23).minutes(59).toDate());
                this.fireEventArgs('afterselect', [this]);
            }
        }
    }, {
        xtype: 'label',
        name: 'uncheck-info',
        cls: 'info-label',
        html: '*When both <b>non-gridded</b> and <b>gridded</b> datasets are showing, <b>gridded</b> attributes are used for map settings and calculations.' ,
        hidden: false
    }]
});


