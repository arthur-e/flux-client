chroma = require('./node_modules/chroma-js/chroma.min.js');

function generatePalettes (type, reversed) {
    var n, m;
    var paletteNames;
    var palettes = {};

    if (type === 'sequential') {
        paletteNames = [
            'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu',
            'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd'
        ];

        // Create all possible sequential palettes
        paletteNames.forEach(function (name) {
            if (!palettes[name]) {
                palettes[name] = {};
            }

            [3,4,5,6,7,8,9].forEach(function (segments) {
                var scale = chroma.scale(name).domain([
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                ], (segments), 'quantiles').out('hex');

                palettes[name][segments] = (function () {
                    var colors, domain, i;

                    colors = [];
                    domain = scale.domain();
                    i = 0;
                    while (i < (domain.length - 1)) {
                        colors.push(scale(domain[i]))
                        i += 1;
                    }

                    if (reversed) {
                        colors.reverse();
                    }

                    return colors;
                }());

            });

        });

    } else {
        paletteNames = [
            'BrBG', 'PiYG', 'PRGn', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu'
        ];

        // Create all possible diverging palettes
        paletteNames.forEach(function (name) {
            if (!palettes[name]) {
                palettes[name] = {};
            }

            [3,4,5,6,7,8,9,10,11].forEach(function (segments) {
                var scale = chroma.scale(name).domain([
                    -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                ], (segments), 'quantiles').out('hex');

                palettes[name][segments] = (function () {
                    var colors, domain, i;

                    colors = [];
                    domain = scale.domain();
                    i = 0;
                    while (i < (domain.length - 1)) {
                        colors.push(scale(domain[i]))
                        i += 1;
                    }

                    if (reversed) {
                        colors.reverse();
                    }

                    return colors;
                }());

            });

        });
    }

    return palettes;

};

exports.generatePalettes = generatePalettes;

