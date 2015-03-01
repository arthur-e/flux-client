// A menu CheckItem that remembers its state.

Ext.define('Flux.field.StatefulCheckItem', {
    extend: 'Ext.menu.CheckItem',
    alias: 'widget.recheckitem',
    stateful: true,
    stateEvents: ['checkchange'],

    initComponent: function () {
        this.callParent(arguments);
    },

    getState: function () {
        return {
            checked: this.checked
        };
    },

    applyState: function (state) {
        if (state && state.checked !== undefined) {
            this.setChecked(state.checked);
        }
    }
});
