/*
    This file is generated and updated by Sencha Cmd. You can edit this file as
    needed for your application, but these edits will have to be merged by
    Sencha Cmd when upgrading.
*/

Ext.application({
    name: 'Flux',

    extend: 'Flux.Application',
    
    autoCreateViewport: true,

    require: [
        'Ext.Array',
        'Ext.view.View',
    ],

    launch: function () {
        var palettes, range;

        range = function (start, end, step) {
            var range = [];
            var typeofStart = typeof start;
            var typeofEnd = typeof end;

            if (step === 0) {
                throw TypeError('Step cannot be zero.');
            }

            if (typeofStart == 'undefined' || typeofEnd == 'undefined') {
                throw TypeError('Must pass start and end arguments.');
            } else if (typeofStart != typeofEnd) {
                throw TypeError('Start and end arguments must be of same type.');
            }

            typeof step == 'undefined' && (step = 1);

            if (end < start) {
                step = -step;
            }

            if (typeofStart == 'number') {

                while (step > 0 ? end >= start : end <= start) {
                    range.push(start);
                    start += step;
                }

            } else {
                throw TypeError('Only Number types are supported');
            }

            return range;

        };

        palettes = Ext.create('Flux.store.Palettes');

        // Create all possible sequential palettes
        Ext.Array.each([
            'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu',
            'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd'
        ], function (name) {
            var s, scale;
            s = 2; // Minimum of 3 color segments (2 breakpoints)

            while (s <= 8) { // Maximum of 9 color segments
                scale = chroma.scale(name).domain(range(0, 10), s, 'quantiles').out('hex');

                palettes.add(Ext.create('Flux.model.Palette', {
                    name: name,
                    type: 'sequential',
                    segments: s + 1,
                    colors: (function () {
                        var colors, domain, i;

                        colors = [];
                        domain = scale.domain();
                        i = 0;
                        while (i < domain.length) {
                            colors.push(scale(domain[i]))
                            i += 1;
                        }

                        return colors;
                    }())
                }));

                s += 1;
            }
        });

        // Create all possible sequential palettes
        Ext.Array.each([
            'BrBG', 'PiYG', 'PRGn', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu'
        ], function (name) {
            var s, scale;
            s = 2; // Minimum of 3 color segments (2 breakpoints)

            while (s <= 10) { // Maximum of 11 color segments
                scale = chroma.scale(name).domain(range(-10, 10), s, 'quantiles').out('hex');

                palettes.add(Ext.create('Flux.model.Palette', {
                    name: name,
                    type: 'diverging',
                    segments: s + 1,
                    colors: (function () {
                        var colors, domain, i;

                        colors = [];
                        domain = scale.domain();
                        i = 0;
                        while (i < domain.length) {
                            colors.push(scale(domain[i]))
                            i += 1;
                        }

                        return colors;
                    }())
                }));

                s += 1;
            }
        });

    }
});
