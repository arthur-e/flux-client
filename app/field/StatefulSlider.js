Ext.define('Flux.field.StatefulSlider', {
    extend: 'Ext.slider.Single',
    alias: 'widget.reslider',
    stateful: true,
    stateEvents: ['dragend'],

    applyState: function (state) {
        this.setValue(state.value);
    },

    getState: function () {
        return {
            value: this.getValue()
        }
    }
});
