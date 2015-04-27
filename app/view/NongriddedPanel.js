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
        xtype: 'combo',
        fieldLabel: 'Select non-gridded data source',
        name: 'source_nongridded',
        anchor: '100%',
        emptyText: 'Select...',
        style: {maxWidth: '200px'},
        displayField: '_id',
        valueField: '_id',
        queryMode: 'local',
        editable: false,
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
            }
        }

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


