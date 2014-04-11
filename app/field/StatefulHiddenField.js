Ext.define('Flux.field.StatefulHiddenField', {
    extend: 'Ext.form.field.Hidden',
    alias: 'widget.rehidden',
    stateful: true,
    stateEvents: ['change'],

    initComponent: function () {
        this.callParent(arguments);
    },

    getState: function () {
        return {
            value: this.value
        };
    },

    applyState: function (state) {
        if (state && state.value) {
            this.setValue(state.value);
        }
    }
});
