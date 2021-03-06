Ext.define('Flux.view.D3GeographicMap', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geomap',
    requires: [
        'Ext.Function',
        'Ext.tip.QuickTip',
        'Ext.toolbar.Toolbar',
        'Flux.store.Rasters'
    ],

    // An internal reference to the legend selection.
     _legend: {},

    // The size of the markers to use for displaying vector overlays.
    _markerSize: 10,

    // The scaling factor for a Mercator projection.
    _mercatorFactor: function (phi) {
        return 1/Math.cos((Math.PI * phi) / 180);
    },

    // The stroke color for nongridded overlay
    _overlayStroke: '#555',

    // The stroke-width size for nongridded overlay
    _overlayStrokeWidth: 1.0,

    // The stroke-width size for ROI polygon
    _polygonStrokeWidth: 1.5,

    // Flag to determine whether or not units should be displayed in the legend.
    _showLegendUnits: true,

    _syncZoom: false,
    _transOffset_x: 0,
    _transOffset_y: 0,
    _initZoomFactor: 1,
    _originalHeight: null,
    _originalWidth: null,

    // The radius and stroke-width size for ROI polygon vertices
    _vertexRadius: 5,
    _vertexStrokeWidth: 20, // A larger stroke-width means an easier to 'grab' vertex

    // Configuration and state for the basemap(s).
    basemaps: {
        boundaries: 'both'
    },

    // Enables the heads-up-display to show timestamps, mouseover events, etc.
    enableDisplay: true,

    // Flag to indicate whether or not the <rect> elements have already
    // been added to the map.
    isDrawn: false,

    // The moment.js time display format to use.
    timeFormat: 'YYYY MM-DD HH:mm',
    
    popup: undefined,

    // Initializes the component.
    initComponent: function () {
        this.addEvents('mouseover', 'mouseout');

        // The scale used for coloring map elements.
        this._colorScale = d3.scale.quantile();

        // The Flux.store.Rasters instance associated with this view.
        this.store = Ext.create('Flux.store.Rasters');

        // Rewrite the updateDisplay() function to update the Panel's header
        //  title if displays are disabled
        if (!this.enableDisplay) {
            this.updateDisplay = function (data) {
                if (this.isDrawn) {
                    data = data[0] || data;
                    this.setTitle(Ext.String.format('{0}: {1}',
                        this.getMetadata().get('_id'), data.text));
                }
            };
        }

        this.on('draw', function (v, grid, showAsOverlay) {
            // Figure out what timestamp description to display at the top
            if (!showAsOverlay) { // Don't reset HUD if an overlay was just drawn
                this._display = grid.getTimestampDisplay(this.timeFormat);
                if (this.title != 'Single Map') { // Set the title if in Coordinated View
                    this.setTitle(Ext.String.format('{0}: {1}', grid.get('source'), grid.getTimestampDisplay(this.timeFormat)));
                }
            }
            this.updateDisplay([{
                id: 'timestamp',
                text: this._display
            }]);
        });

        this.on('render', function () {
            var view = this;

            if (this.enableZoomControls) {
                this.addDocked(Ext.create('Ext.toolbar.Toolbar', {
                    dock: 'left',
                    defaultType: 'button',
                    cls: 'map-tbar',
                    defaults: {
                        cls: 'btn-zoom',
                        scale: 'large',
                        height: 34,
                        width: 34
                    },
                    items: [{
                        itemId: 'btn-zoom-in',
                        iconCls: 'icon-zoom-in',
                        tooltip: 'Zoom In',
                        listeners: {
                            click: Ext.bind(this.setZoom, this, [1.3])
                        }
                    }, {
                        itemId: 'btn-zoom-out',
                        iconCls: 'icon-zoom-out',
                        tooltip: 'Zoom Out',
                        listeners: {
                            click: Ext.bind(this.setZoom, this, [0.7])
                        }
                    }, {
                        itemId: 'btn-zoom-way-out',
                        iconCls: 'icon-zoom-extend',
                        tooltip: 'Zoom to Layer',
                        listeners: {
                            click: Ext.bind(this.setZoom, this, [0.1])
                        }
                    }, {
            	        itemId: 'btn-cancel-drawing',
                        iconCls: 'icon-draw',
                        tooltip: 'Cancel drawing',
                        style: 'background: #ffcc00;',
                        hidden: true
            	    }, {
                        itemId: 'btn-roi-tools',
                        iconCls: 'icon-add-roi',
                        arrowCls: 'icon-add-roi',
                        style: 'background: #E9B8B8;',
                        menuAlign: 'l-r?',
                        hidden: true,
                        menu: {
                            xtype: 'menu',
                            cls: 'add-roi-menu',
                            bodyCls: 'add-roi-menu-body',
                            plain: true,
                            columns: 1,
                            padding: 4,
                            margin: 0,
                            shadow: false,
                            defaults: {
                                xtype: 'button',
                                scale: 'small',
                                textAlign: 'left',
                                height: 20,
                                cls: 'add-roi-menu-item'
                            },
                            items: [{
                                itemId: 'btn-fetch-roi-time-series',
                                text: 'Fetch time series',
                                tooltip: 'Check "Show line plot" to enable'
                            }, {
                                itemId: 'btn-remove-roi',
                                text: 'Remove'
                            }]
                        },
                        listeners: {
                            mouseover: function() {
                                this.showMenu();
                            },
                            menushow: function() {
                                this.mouseLeaveMonitor = this.menu.el.monitorMouseLeave(0, this.hideMenu, this);
                            }
                        }
                    }, {
                        itemId: 'btn-add-roi',
                        iconCls: 'icon-add-roi',
                        arrowCls: 'icon-add-roi',
                        menuAlign: 'l-r?',
                        hidden: false,
                        menu: {
                            xtype: 'menu',
                            cls: 'add-roi-menu',
                            bodyCls: 'add-roi-menu-body',
                            plain: true,
                            columns: 1,
                            padding: 4,
                            margin: 0,
                            shadow: false,
                            defaults: {
                                xtype: 'button',
                                scale: 'small',
                                textAlign: 'left',
                                height: 20,
                                cls: 'add-roi-menu-item'
                            },
                            items: [{
                                xtype: 'label',
                                text: 'Add ROI...',
                                cls: 'add-roi-menu-title'
                            }, {
                                itemId: 'btn-add-roi-draw',
                                text: 'Draw'
                            }, {
                                itemId: 'btn-add-roi-wkt',
                                text: 'From WKT'
                            }, {
                                itemId: 'btn-add-roi-geojson',
                                text: 'From GeoJSON'
                            }]
                        },
                        listeners: {
                            mouseover: function() {
                                this.showMenu();
                            },
                            menushow: function() {
                                this.mouseLeaveMonitor = this.menu.el.monitorMouseLeave(0, this.hideMenu, this);
                            }
                        }
                    }, {
                        itemId: 'btn-save-image',
                        iconCls: 'icon-disk',
                        arrowCls: 'icon-add-roi',
                        menuAlign: 'l-r?',
                        tooltip: 'Save Image/Data',
                        menu: {
                            xtype: 'menu',
                            cls: 'add-roi-menu',
                            bodyCls: 'add-roi-menu-body',
                            plain: true,
                            columns: 1,
                            padding: 4,
                            margin: 0,
                            shadow: false,
                            defaults: {
                                xtype: 'button',
                                scale: 'small',
                                textAlign: 'left',
                                height: 20,
                                cls: 'add-roi-menu-item'
                            },
                            items: [{
                                xtype: 'label',
                                text: 'Save as...',
                                cls: 'add-roi-menu-title'
                            }, {
                                itemId: 'btn-save-png',
                                text: 'PNG',
                                tooltip: 'Export an image of the current view'
                            }, {
                                itemId: 'btn-save-ascii',
                                text: 'ESRI ASCII',
                                tooltip: 'Gridded data only',
                                disabled: true
                            }, {
                                itemId: 'btn-save-geotiff',
                                text: 'GeoTiff',
                                tooltip: 'Gridded data only',
                                disabled: true
                            }, {
                                itemId: 'btn-save-csv',
                                text: 'CSV',
                                tooltip: 'Non-gridded data only',
                                disabled: true
                            }]
                        },
                        listeners: {
                            mouseover: function() {
                                this.showMenu();
                            },
                            menushow: function() {
                                this.mouseLeaveMonitor = this.menu.el.monitorMouseLeave(0, this.hideMenu, this);
                            }
                        }
                    }
                ]
            }), 0);
            }
        });

        this.callParent(arguments);
    },

    // Add event listeners to the drawn elements.
    //
    //     @param  sel {d3.selection}
    //     @return     {Flux.view.D3GeographicMap}

    addListeners: function (sel, showAsOverlay) {
        var proj = this.getProjection();
        var view = this;

        sel = sel || this.panes.datalayer.selectAll('.cell');

        // Add listeners for zooming/panning.
        // Here, we're passing the drag behavior to the filler pane (where
        // the other zoom behavior is enacted) b/c putting pan behavior
        // on the same layer as the SVG element will be sludgy/unresponsive
        // because registered mouse position is constantly changing.
        sel.on('mousedown.zoom', function () {
                view.filler.on('mousedown.zoom').apply(view.filler[0][0]);
            })
            .on('mousemove.zoom', function () {
                view.filler.on('mousemove.zoom').apply(view.filler[0][0]);
            })
            .on('touchstart.zoom', function () {
                view.filler.on('touchstart.zoom').apply(view.filler[0][0]);
            })
            .on('touchmove.zoom', function () {
                view.filler.on('touchmove.zoom').apply(view.filler[0][0]);
            })
            .on('touchend.zoom', function () {
                view.filler.on('touchend.zoom').apply(view.filler[0][0]);
            })
            .on('wheel.zoom', function () {
                view.zoom.center(d3.mouse(view.filler[0][0]));
                view.filler.on('wheel.zoom').apply(view.filler[0][0]); // Does not matter which svg element used here
            });

        sel.on('mouseover', function (d) {
            var c, m, p, ll, v;

            if (Ext.isEmpty(d)) {
               return;
            }

            p = view.getMetadata().get('precision');
            if (showAsOverlay) {
                p = view.getMetadataOverlay().get('precision');
            }
            m = d3.mouse(view.svg[0][0]);
            c = [
                this.attributes.x.value,
                this.attributes.y.value
            ];

            if (view.getMetadata().get('gridded') && !showAsOverlay) {
                // Need to add half the grid spacing as this was subtracted to obtain
                //  the upper-left corner of the grid cell
                ll = view.getMetadata().calcHalfOffsetCoordinates(proj.invert(c));
                v = d;

            } else {
                ll = Ext.Array.map(proj.invert(c), function (l) {
                    return l.toFixed(5);
                });
                v = d.properties.value; // For non-gridded data, choose the value property
            }

            // Heads-up-display
            view.updateDisplay([{
                id: 'tooltip',
                text: Ext.String.format('{0} @({1},{2})', v.toFixed(p),
                    ll[0].trim('00'), ll[1].trim('00'))
            }]);

            // Near-cursor tooltip
            view.panes.tooltip.selectAll('.tip')
                .text(v.toFixed(p))
                .attr({
                    'x': m[0] + 20,
                    'y': m[1] + 30
                })

            view.fireEventArgs('mouseover', [view, c, d]);
        });

        sel.on('mouseout', function () {
            view.updateDisplay([{
                id: 'timestamp',
                text: view._display
            }]);
            view.panes.tooltip.selectAll('.tip').text('');
            view.fireEventArgs('mouseout', [view]);
        });

        if (this.getMetadata() && this.getMetadata().get('gridded') && !showAsOverlay) {
            sel.on('click', function () {
                view.fireEventArgs('plotclick', [view, [
                    this.attributes.x.value,
                    this.attributes.y.value
                ]]);
            });
        }

        return this;
    },

    // Add event listeners related to drawing roi polygons
    //
    //     @param  sel  {d3.selection}
    //     @param	tbar {Ext.Toolbar}
    //     @return      {Flux.view.D3GeographicMap}

    addListenersForDrawing: function (sel, tbar) {
        var proj = this.getProjection();
        var view = this;
	    var line, polygon, c, vindex;

        sel = sel || this.selectAll('.roiCanvas');

        // Temporarily disable zooming while drawing is active
        view.filler.style('pointer-events', 'none');
	    view.zoom.on('zoom',null);

        sel.on('mousemove', mousemove);

        // Add vertex on click
        sel.on('click', function () {
    	    var m = d3.mouse(view.wrapper[0][0]);

            c = view.constrainLatLong(m);
            c = view.constrainOneHemisphere(c);

    	    // Store the current representation of the polygon in screen coords
    	    if (!view._tmpRoiCoords) {
                view._tmpRoiCoords = [];
    	    }

    	    view._tmpRoiCoords.push(c);

    	    // Add polygon if it doesn't yet exist
    	    if (!polygon) {
        		polygon = view.wrapper.append('polygon')
                .attr({
    			    'class': 'roi-polygon',
    			    'points': view.getSVGPolyPoints(view._tmpRoiCoords.slice(0)),
    			    'pointer-events': 'none'
    			})
                .style('stroke-width', view._polygonStrokeWidth / view.zoom.scale());

                vindex = 0;
    	    }

    	    // Add vertex
    	    view.wrapper.append('circle').attr(view.getVertexAttrs(vindex,c));

    	    // `vindex` is used to track the order vertices are placed
    	    // which is essential for implementing drag functionality
    	    vindex += 1;

    	    // Once clicked, activate a different mousemove function
    	    sel.on('mousemove', mousemoveDraw);
        });

    	sel.on('dblclick', finishPolygon);

        // Registers drawing on double-click
    	function finishPolygon() {
            // Set temporary drawing coords to official drawing coords
            view._roiCoords = view._tmpRoiCoords.slice(0);
            delete view._tmpRoiCoords;

            // Remove any remaining tool tip text
            view.panes.tooltip.selectAll('.tip').text('');

            // Reset HUD font size
            view.panes.hud.selectAll('.info').style('font-size',view.setHudFontSize().toString() + 'px');

            // Remove tracker vertex
            view.wrapper.selectAll('.roi-tracker').remove();

    	    // An extra vertex is added on the first click of the double-click
    	    // Remove the vertex as well as the coordinate from the poly definition
    	    view.wrapper.selectAll('circle[vindex="' + (vindex-1) + '"]').remove();
    	    view._roiCoords.pop();

    	    var cs = view._roiCoords.slice(0);

            var bbox = view.getSVGPolyBbox(cs);
            polygon.attr('points', view.getSVGPolyPoints(cs));
            polygon.attr('centroid', view.getSVGPolyCentroid(bbox));
            polygon.attr('bbox', bbox);

    	    // Reset listeners
    	    sel.on('mousemove', null);
    	    sel.on('click', null);
    	    sel.on('dblclick', null);

            // Reset summary stats
            delete view._currentSummaryStats;

    	    // Grow/shrink/drag listeners to vertices
    	    view.addListenersForVertices();

            // Return summary stats
            view.fireEvent('fetchstats');

    	    // Make UI changes
    	    tbar.down('button[itemId="btn-cancel-drawing"]').hide();
            view.setTbarForDrawnROI(tbar);

    	    // Reset cursor (turn off crosshairs)
            view.panes.roiCanvas.selectAll('rect').style('cursor','auto');

    	    // Remove canvas to awaken sleeping listeners underneath
            d3.selectAll('.roiCanvas').remove();

            // Reenable zoom and zoom to ROI center
            view.filler.style('pointer-events', 'all');
            view.zoom.on('zoom', Ext.bind(view.zoomFunc, view));
            view.setZoomToRoiCenter();

            view.updateDisplay([{
                id: 'timestamp',
                text: view._display
            }]);
        }

    	// Add a floating vertex under the mouse pointer when drawing
        function mousemove() {
            var m = d3.mouse(view.wrapper[0][0]);
            var c = view.constrainLatLong(m);
            c = view.constrainOneHemisphere(c);

            if (view.wrapper.selectAll('.roi-tracker')[0].length === 0) {
                view.wrapper.append('circle').attr({
                    'class': 'roi-tracker',
                    'cx': m[0],
                    'cy': m[1],
                    'r': view._vertexRadius / view.zoom.scale(),
                    'stroke-width': view._vertexStrokeWidth / view.zoom.scale(),
                    'fill': '#800000',
                    'pointer-events': 'none' // otherwise double-click won't register);
                });
            }
            // Update tracker vertex
            view.wrapper.selectAll('.roi-tracker').attr({'cx':c[0],'cy':c[1]});

        }

    	// When drawing, update polygon as mouse moves
    	function mousemoveDraw() {
    	    var m = d3.mouse(view.wrapper[0][0]);
                var c = view.constrainLatLong(m);
                c = view.constrainOneHemisphere(c);

    	    var cs = view._tmpRoiCoords.slice(0);

    	    cs.push([c[0],c[1]]);

    	    polygon.attr('points', view.getSVGPolyPoints(cs));

            mousemove();
    	}

        return this;
    },

    // Creates listeners for vertices to grow/shrink
    // and enable dragging

    addListenersForVertices: function () {
    	var view = this;
    	var vertices = this.wrapper.selectAll('.roi-vertex');
    	var polygon = this.wrapper.selectAll('polygon');

    	vertices.attr('pointer-events','all');

        // Update mouseover/mouseout listeners
        view.updateListenersForVertices();

        // Define drag behavior
    	var drag = d3.behavior.drag()
    	    .on('drag', function () {
                view.zoom.on('zoom',null);

                m = d3.mouse(view.wrapper[0][0]);
                var x = m[0]
                var y = m[1];

                dragged = true;

                c = view.constrainLatLong(m);
                c = view.constrainOneHemisphere(c)//, [d3.select(this).attr('cx'),d3.select(this).attr('cy')]);

                x = c[0];
                y = c[1];

                // Update polygon
                view._roiCoords[d3.select(this).attr('vindex')] = [x,y];
                polygon.attr('points', view.getSVGPolyPoints(view._roiCoords.slice(0)));

                // Update vertex
                d3.select(this)
                    .attr('cx', x)
                    .attr('cy', y);

                // Since polygon is being modified,
                // delete current summaryStats so that it will trigger a database ping
                delete view._currentSummaryStats;

            }).on('dragend', function() {
                view.panes.tooltip.selectAll('.tip').text('');
                view.zoom.on('zoom', Ext.bind(view.zoomFunc, view));
                if (dragged) {
                view.fireEvent('fetchstats');
                view.fireEvent('removeTimeSeries');
            }});

        vertices.call(drag);

        return this;
    },

    updateListenersForVertices: function () {
        var view = this;
        var vertices = this.wrapper.selectAll('.roi-vertex');
        var zoomScale = this.zoom.scale();

        vertices.on('mouseover', function () {
            d3.select(this).transition()
                .duration(40)
                .ease('linear')
                .attr({
                    'fill':'#CC0000',
                    'r': view._vertexRadius*2 / zoomScale,
                    'stroke-width': view._vertexStrokeWidth*2 / zoomScale
                });
            });

        vertices.on('mouseout', function () {
            d3.select(this).transition()
                .duration(80)
                .ease('linear')
                .attr({
                    'fill':'#800000',
                    'r': view._vertexRadius / zoomScale,
                    'stroke-width': view._vertexStrokeWidth / zoomScale
                });
            });

    },

    // Removes the drawn elements from the drawing plane.
    //
    //     @return {Flux.view.D3GeographicMap}

    clear: function () {
        this._model = undefined;
        this.svg.selectAll('.info').text('');
        this.svg.selectAll('.backdrop').attr('fill-opacity', 0.0);
        this.svg.selectAll('.bin').remove();
        this.svg.selectAll('.axis').remove();
        this.svg.selectAll('.units').text('');
        this.svg.selectAll('.cell').remove();
        this.isDrawn = false;
        return this;
    },

    // Constrains a set of mouse coordinates to valid lat/long values
    // e.g. lat values > 90 will be set to 90

    constrainLatLong: function (m) {
        var proj = this.getProjection();

        ll = Ext.Array.map(proj.invert([m[0],m[1]]), function(l) {return l;});

        var x = ll[0];
        var y = ll[1];

        if (ll[1] >= 90) {
            y = 89.9;
        }

        if (ll[1] <= -89.9) {
            y = -89.9;
        }

        if (ll[0] >= 180) {
            x = 179.9;
        }

        if (ll[0] <= -180) {
            x = -179.9;
        }

        return proj([x,y]);
    },

    // We also need to apply constraint to vertices so that polygon does not span multiple
    // hemispheres because MongoDB cannot handle spatial queries larger than that.
    // See here:
    // http://stackoverflow.com/questions/18773482/geointersect-seems-to-limit-polygon-query-to-180%C2%B0-width-why
    constrainOneHemisphere: function (c) {
        var view = this;
        var proj = this.getProjection();
        var ll = Ext.Array.map(proj.invert([c[0],c[1]]), function(l) {return l;});
        var x = ll[0];


        if (view._roiCoords) {
            var xs = view._roiCoords.map(function (q) {
                return Ext.Array.map(proj.invert(q), function(l) {return l;});
            }).map(function (z) {return z[0];});


            var min_x = Math.min.apply(Math, xs);
            var max_x = Math.max.apply(Math, xs);

            var exceeds = false;

            [min_x, max_x].forEach( function (extreme) {

                if (Math.abs(ll[0] - extreme) > 180) {
                    exceeds = true;
                    if (x >= extreme) {
                        x = extreme + 179;
                    } else {
                        x = extreme - 179;
                    }
                    ;
                }

            });

            if (exceeds) {
                // Near-cursor tooltip
                view.panes.tooltip.selectAll('.tip')
                    .text("ROI width cannot exceed one hemisphere")
                    .attr({
                        'x': proj([x, ll[1]])[0] + 20,
                        'y': c[1] + 30,
                        'font-size': '8px'
                    });
            } else {
                view.panes.tooltip.selectAll('.tip').text('');
            }
        }

        return proj([x, ll[1]]);

    },

    // Creates (or updates) an ROI summary stats display
    // on the map.
    //
    //     @param  series  {roi.json response Object}
    //     @param  view    {Flux.view.D3GeographicMap}

    displaySummaryStats: function (series, view) {
        view._currentSummaryStats = series;

        // Object w/ display attributes indicating
        // display precision and whether or not to apply offset
        // if anomalies view is selected
        var display_attrs = {
            'Mean': {
                    'precision': 2,
                    'offset': true
            },
            'Min': {
                    'precision': 2,
                    'offset': true
            },
            'Max': {
                    'precision': 2,
                    'offset': true
            },
            'STD': {
                    'precision': 2,
                    'offset': false
            },
            'N': {
                    'precision': 0,
                    'offset': false
            }
        }

        var offset = view.getTendencyOffset();

        // Summary stats display - create if it doesn't already exist
        if (d3.selectAll('.roi-stats')[0].length === 0) {
            view.panes.roistats = view.svg.append('g').attr('class', 'pane roi-stats');

            var backdrop_w = 100;
            var backdrop_h = 110;
            var y_init = view.svg.attr('height') - backdrop_h - 30;//- (0.05 * view._height);
            var x_init = view.svg.attr('width') - backdrop_w - 50;

            view.panes.roistats.append('rect')
                .attr({
                    'class': 'roi-stats-backdrop',
                    'width': backdrop_w,
                    'height': backdrop_h,
                    'x': x_init,
                    'y': y_init + 4, // this places it just underneath the HUD
                    'pointer-events': 'all'
                });

            Object.keys(display_attrs).forEach(function (s, i) {
                view.panes.roistats.append('text').text(s).attr({
                    'class': 'roi-stats-text-labels',
                    'text-anchor': 'left',
                    'x': x_init + 6,
                    'y': y_init + 22 +(i*19)
                });

                view.panes.roistats.append('text').text('').attr({
                    'class': 'roi-stats-text-data ' + s,
                    'text-anchor': 'end',
                    'x': x_init + 94,
                    'y': y_init + 22 +(i*19)
                });
            });
        }

        // Update the values
        Object.keys(display_attrs).forEach(function (s, i) {
            var fs = '16px';
            var val = view._currentSummaryStats.properties['all' + s];

//             if (view._showAnomalies && display_attrs[s]['offset']) {
//                 val = val - offset;
//             }

            // Set some fancy D3 transition animation for when number change
            view.panes.roistats.selectAll('.' + s)
                .transition()
                .duration(400)
                .tween('text', function() {
                    var start_num = 0;
                    if (this.textContent != 'NaN') {
                        start_num = this.textContent;
                    }
                    var i = d3.interpolate(start_num, val),
                        prec = (val + "").split("."),
                        round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;

                    return function(t) {
                        this.textContent = (Math.round(i(t) * round) / round)
                                            .toFixed(display_attrs[s]['precision']);

                };
            });
        });

    },

    // Draws the visualization features on the map given input data and the
    // corresponding metadata.
    //
    //     @param  data    {Flux.model.Raster}
    //     @param  zoom    {Boolean}
    //     @return         {Flux.view.D3GeographicMap}

    draw: function (data, showAsOverlay) {
        var bbox, lat, lng, meta, c1, c2, pane, rectClass, sel;
        var proj = this.getProjection();
        delete this._rTree;

        if (!data) {
            return this;
        }

        // If not using population statistics, calculate the new summary stats
        //  for the incoming data
        if (!this._usePopulationStats) {
            if (!showAsOverlay) {
                meta = this.getMetadata().copy();
                meta.set('stats', {
                    values: data.summarize()
                });

                this.setMetadata(meta);
            } else {
                meta = this.getMetadataOverlay().copy();
                meta.set('stats', {
                    values: data.summarize()
                });

                this.setMetadataOverlay(meta);
            }

        }

        // Retain references to last drawing data and metadata; for instance,
        //  resize events require drawing again with the same (meta)data
        if (!showAsOverlay) {
            this._model = data;
            pane = this.panes.datalayer;
        } else {
            this._modelOverlay = data;
            pane = this.panes.overlay;
        }

        // Disallow zooming by default
        // zoom = (zoom === true);

        // **Selection and Attributes**

        // Sets the enter or update selection's data
        sel = pane.selectAll('.cell')
                .data(data.get('features'), function (d, i) {
                    return i; // Use the cell index as the key
                });

        // Append a <rect> for every grid cell so long as the features haven't
        //  been drawn before or the layer is non-gridded
        if (!this.isDrawn || !this.getMetadata().get('gridded') || showAsOverlay) {
            sel.exit().remove();
            sel.enter().append('rect');

            // Add mouseover and mouseout event listeners
            this.addListeners(sel, showAsOverlay);
        }

        // Calculate the position and dimensions attributes of the elements
        sel.attr(this.getDrawingAttrs(showAsOverlay))
            .style('cursor', 'pointer'); // Show link pointer when hovering over

        // Applies the color scale to the current selection
        this.update(sel, showAsOverlay);


        // Display Marker outlines if checked
        this.fireEvent('toggleOutline');

        // **Zoom to Feature**

        // Skip zooming to the data if they've been drawn or if map is already zoomed
        if (!this.isDrawn && this.zoom.scale() === 1) {
            bbox = this._metadata.get('bbox');

            // Calculate the center of the view
            c1 = [
                Number(this.svg.attr('width')) * 0.5,
                Number(this.svg.attr('height')) * 0.5
            ];

            // Average the respective coordinate pairs in the bounds (xmin, ymin, xmax, ymax)
            lat = (bbox[1] + bbox[3]) * 0.5;
            lng = (bbox[0] + bbox[2]) * 0.5;

            if (this._projId === 'mercator') {
                lat = this._mercatorFactor(lat) * lat;
            }

            c2 = proj([lng, lat]);

            this.setZoom(this.getZoomScaleFromBbox(bbox), [
                (c1[0] - c2[0]) + this._transOffset_x,
                (c1[1] - c2[1]) + this._transOffset_y
            ]);

        }

        this.isDrawn = true;
        this.fireEventArgs('draw', [this, data, showAsOverlay]);
        return this;
    },

    // Returns attributes for SVG circle element of
    // the ROI polygon vertex class

    getVertexAttrs: function(vindex, coords) {
    	var attrs = {
    	    'class': 'roi-vertex',
    	    'vindex': vindex,
    	    'cx': coords[0],
    	    'cy': coords[1],
    	    'r': this._vertexRadius / this.zoom.scale(),
    	    'stroke-width': this._vertexStrokeWidth / this.zoom.scale(),
    	    'fill': '#800000',
    	    'pointer-events': 'none' // otherwise double-click won't register
    	};
    	return attrs;
    },

    // Returns the retained reference to the underlying grid geometry.
    //
    //     @return {Flux.model.RasterGrid}

    getRasterGrid: function () {
        return this._grid;
    },

    // Creates an Object of attributes for the drawing features.
    //
    //     @return {Object}

    getDrawingAttrs: function (showAsOverlay) {
        var attrs, grid, gridxy;
        var proj = this.getProjection();
        var scaling = this._mercatorFactor;
        var sz = this._markerSize / this.zoom.scale();

        if (!this._metadata) {
            return;
        }

        // **Non-gridded Overlay**
        if (!this._metadata.get('gridded') || showAsOverlay) {

            return attrs = {
                'x': function (d) {
                    return proj(d.coordinates)[0] - (0.5 * sz);
                },

                'y': function (d) {
                    return proj(d.coordinates)[1] - (0.5 * sz);
                },

                'width': sz,
                'height': sz,
                'class': 'cell'
            };
        }

        // **Gridded Raster**
        if (!this.getRasterGrid()) {
            return;
        }
        grid = this.getRasterGrid().get('coordinates');
        gridxy = this._metadata.get('grid'); // Assumes grid spacing in degrees
        attrs = {
            'x': function (d, i) {
                // We want to start drawing at the upper left (half the cell
                //  width, or half a degree)
                if (grid[i] === undefined) {
                    return;
                }
                return proj(grid[i].map(function (j) {
                    // Subtract half the grid spacing from longitude (farther west)
                    return (j - (gridxy.x * 0.5));
                }))[0];
            },

            'y': function (d, i) {
                if (grid[i] === undefined) {
                    return;
                }
                return proj(grid[i].map(function (j) {
                    // Add half the grid spacing from latitude (farther north)
                    return (j + (gridxy.y * 0.5));
                }))[1];
            },

            'width': Math.abs(proj([gridxy.x, 0])[0] - proj([0, 0])[0]),

            'height': Math.abs(proj([0, gridxy.y])[1] - proj([0, 0])[1]),

            'class': 'cell'
        };

        // Use a scaling factor for non-equirectangular projections
        // http://en.wikipedia.org/wiki/Mercator_projection#Scale_factor
        if (this._projId === 'mercator') {
            attrs.height = function (d, i) {
                return scaling(grid[i][1]) * Math.abs(proj([0, gridxy.y])[1] - proj([0, 0])[1]);
            };
        }

        return attrs;
    },

    // Returns the current map projection.
    //
    //     @return {d3.geo.*}

    getProjection: function () {
        return this._proj;
    },

    // Returns the current map scale.
    //
    //     @return {d3.scale.*}

    getColorScale: function () {
        return this._colorScale;
    },

    // Returns SVG polygon "bbox" attribute from an array of coordinates
    //
    //     @param coords   {Array}
    //     @return         {String}

    getSVGPolyBbox: function (coords) {
        var bbox, max_x, max_y, min_x, min_y;

        coords.forEach(function(c) {
            max_x = Math.max(max_x || c[0], c[0]);
            max_y = Math.max(max_y || c[1], c[1]);
            min_x = Math.min(min_x || c[0], c[0]);
            min_y = Math.min(min_y || c[1], c[1]);
        });

        bbox = [min_x, min_y, max_x, max_y];

        return bbox;
    },

    // Returns SVG polygon "centroid" attribute from a bbox
    //
    //     @param coords   {Array}
    //     @return         {String}

    getSVGPolyCentroid: function (bbox) {
        return  [
                    bbox[0] + ((bbox[2] - bbox[0]) / 2.0),
                    bbox[1] + ((bbox[3] - bbox[1]) / 2.0)
                ];
    },

	// Returns SVG polygon "points" attribute from a list
	// of paired coordinates
    //
    // 	@param  coords 	{Array}
    // 	@return         {String}

    getSVGPolyPoints: function (coords) {
    	var poly = '';

    	coords.push(coords[0]);

    	coords.forEach(function(c) {
    	    poly += c.join() + ' ';
    	});

    	return poly;
    },

    // Returns WKT Polygon representation from a list
    // of paired coordinates
    //
    //     @param coords   {Array}
    //     @return         {String}

    getWKTfromRoiCoords: function (coords) {
        var wkt = 'POLYGON((';

        coords.push(coords[0]);

        coords.forEach(function(c) {
            // limit precision
            c[0] = parseFloat(c[0].toPrecision(5));
            c[1] = parseFloat(c[1].toPrecision(5));
            wkt += c.join(' ') + ',';
        });

        wkt += '))';

        return wkt;
    },

    getZoomScaleFromBbox: function(bbox) {
        var proj = this.getProjection();
        var width = this.filler.attr('width');
        var projx1 = proj([0,0])[0];
        var projx2 = proj([bbox[2] - bbox[0], 0])[0];
        var factor = 0.8;

        // If projected max x is greater than projected min x,
        // the target feature is close to global in scope, and so
        // just zoom all the way out
        if (projx2 < projx1) {
            return 1;
        }

        // Get the pixel coordinates of the longitude maximum and minmum,
        //  then take the difference to get the pixel width of the scene.
        //
        // Then, take the ratio of the SVG width to this scene width to find
        //  the zoom factor; scale it slightly so we don't zoom in too far

        return factor * (width / Math.abs(projx1 - projx2));
    },

    // Attempts to display the value at the provided map coordinates; if the
    // coordinates do not exactly match any among the current instance's grid
    // geometry, nothing is done.
    //
    //     @param  coords  {Array}
    //     @return         {D3GeographicMap}

    highlightMapLocation: function (coords) {
        var i;

        if (!this.isDrawn || Ext.isEmpty(this.getRasterGrid())) {
            return;
        }

        i = this.getRasterGrid().getCoordIndex(coords);
        if (i < 0 || i > this._model.get('features').length) {
            return;
        }

        return this.updateDisplay([{
            id: 'tooltip',
            text: this._model.get('features')[i]
        }]);
    },

    // Sets font size for HUD text according to height/width
    // of the map component.
    //
    //     @return         {Number}

    setHudFontSize: function () {
        var fs = this.svg.attr('height') * 0.04;
        if (this.svg.attr('height') / this.svg.attr('width') > 1) {
            fs = this.svg.attr('width') * 0.04;
        }
        return fs;
    },

    // Initializes drawing; defines and appends the SVG element(s). The drawing
    // panes are set up and SVG element(s) are initialized, sometimes with
    // empty data sets.
    //
    //     @param  width   {Number}
    //     @param  height  {Number}
    //     @return         {Flux.view.D3GeographicMap}

    init: function (width, height, projection) {//, zoomFactor, zoomTranslate) {
        var elementId = '#' + this.items.getAt(0).id;

        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            this.svg.remove();
        }

        this.svg = d3.select(elementId).append('svg')
            .attr('width', width)
            .attr('height', height);

        // Function to run when zooming
    	this.zoomFunc = function (event, suppressSync) {
            if (!event) {
                event = d3.event;
            }

            var scale = Number(event.scale);

            if (event.translate) {
                this.wrapper.attr('transform', Ext.String.format('translate({0},{1})scale({2})',
                    event.translate[0] - (this._transOffset_x*event.scale),
                    event.translate[1] - (this._transOffset_y*event.scale),
                    event.scale));
            }

            // Update drawing scale for auxiliary drawn components (ROI, Nongridded markers)
            this.scaleAuxiliaryMapComponents(event.scale);

            // Since the "zoom event" may sometimes come from a neighboring map, we need to
            // ensure that the current zoom params are manually set
            this.zoom.scale(event.scale);
            this.zoom.translate(event.translate)


            // Alert UI a map has been zoomed to facilitate binding pan/zoom w/ other maps
            if (!suppressSync && this._syncZoom) {
                this.fireEventArgs('mapzoom', [this, event, this._mostRecentZoomScale]);
            }

            this._mostRecentZoomScale = scale;

        };

        this.zoom = d3.behavior.zoom()
            .scaleExtent([0.01, 60])
            .on('zoom', Ext.bind(this.zoomFunc, this));

        this._mostRecentZoomScale = this.zoom.scale();

        var view = this;

        // Add a transparent background element overlaying the "wrapper" element
        // to handle zoom/pan behavior
        this.filler = this.svg.append('rect')
            .attr({
                'class': 'filler',
                'width': width,
                'height': height,
                'fill': 'none',
                'x': 0,
                'y': 0
            })
            .style('pointer-events', 'all')
            .call(this.zoom)
            .on('mousemove', function () {
                view.zoom.center(d3.mouse(view.filler[0][0]));
            })
            .on('dblclick.zoom', null)

        // This container will apply zoom and pan transformations to the entire
        //  content area; NOTE: layers that need to be zoomed and panned around
        //  must be appended to the wrapper
        this.wrapper = this.svg.append('g')
                .attr('class', 'wrapper');

        // Create panes in which to organize content at difference z-index
        //  levels using painter's algorithm (first drawn on bottom; last drawn
        //  is on top); NOTE: layers that need to be zoomed and panned around
        //  must be appended to the wrapper layer; layers that should NOT zoom
        //  and pan should be appended to something else (e.g this.svg)
        this.panes = {
            basemap: this.wrapper.append('g').attr('class', 'pane')
        };
        this.panes.datalayer = this.wrapper.append('g').attr('class', 'pane datalayer');
        this.panes.overlay = this.wrapper.append('g').attr('class', 'pane overlay');
        this.panes.hud = this.svg.append('g').attr('class', 'pane hud');
        this.panes.legend = this.svg.append('g').attr('class', 'pane legend');
        this.panes.tooltip = this.svg.append('g').attr('class', 'pane tooltip');

        // **Tooltip**
        this.panes.tooltip.selectAll('.tip')
            .data([0])
            .enter()
            .append('text')
            .text('')
            .attr('class', 'info tip');

        // **Heads-Up-Display (HUD) Date/Time Info**
        if (this.enableDisplay) {
            this.panes.hud.selectAll('.backdrop')
                .data([0])
                .enter()
                .append('rect')
                .attr({
                    'fill': '#fff',
                    'fill-opacity': 0.0,
                    'class': 'backdrop',
                    'x': 0,
                    'y': 0,
                    'width': width,
                    'height': (0.05 * height)
                });
        }

        this.panes.hud.selectAll('.info')
            .data([
                { text: '', id: 'timestamp' }
            ], function (d) {
                return d.id;
            })
            .enter()
            .append('text')
            .text(function (d) {
                return d.text;
            })
            .style('font-size', this.setHudFontSize().toString() + 'px')
            .attr({
                'class': function (d) {
                    return 'info ' + d.id;
                },
                'text-anchor': 'middle'
            });

        // **Legend**
        this._legend.yScale = d3.scale.linear();
        this._legend.yAxis = d3.svg.axis()
            .scale(this._legend.yScale)
            .orient('right');

        // Add background to legend
        this.panes.legend.selectAll('.backdrop')
            .data([0])
            .enter()
            .append('rect')
            .attr({
                'fill': '#aaaaaa',
                'fill-opacity': 0.0,
                'class': 'backdrop',
                'x': 0,
                'y': 0,
                'width': 0,
                'height': 0
            });
            
        // Add the empty legend units text element
        this.panes.legend.selectAll('.units')
            .data([''])
            .enter()
            .append('text')
            .attr('class', 'units');

        this.isDrawn = false;

        return this;
    },

    // Draws the view again with the same data it already has bound to it.
    //
    //     @param  zoom    {Boolean}
    //     @return         {Flux.view.D3GeographicMap}

    redraw: function (showOverlay) {
        if (this._model) {
            this.draw(this._model).updateLegend();
        }

        if (this._modelOverlay && showOverlay) {
            this.draw(this._modelOverlay, showOverlay);
        }

        // If a drawn polygon existed and has not been destroyed, it needs to be redrawn too
        if (this._roiCoords && this.wrapper.selectAll('.roi-polygon')[0].length === 0) {
	       this.redrawRoi();
        }

        return this;
    },

    // Redraws an ROI, needed e.g. after changing dimensions causes
    // the map to reset. Assumes exsiting _roiCoords.

    redrawRoi: function () {
        if (!this._roiCoords) {
            return;
        }

        var view = this;

        // Add the SVG polygon elements
        var bbox = this.getSVGPolyBbox(this._roiCoords.slice(0));
        this.wrapper.append('polygon')
            .attr({
                'class': 'roi-polygon',
                'points': this.getSVGPolyPoints(this._roiCoords.slice(0)),
                'bbox' : bbox,
                'centroid': this.getSVGPolyCentroid(bbox),
                'pointer-events': 'none'
            })
            .style('stroke-width', this._polygonStrokeWidth / this.zoom.scale());

        // Add vertices
        var vindex = 0;
        this._roiCoords.forEach( function (c) {
            view.wrapper.append('circle').attr(view.getVertexAttrs(vindex, c));
            vindex += 1;
        });

        // Add grow/shrink and drag listeners for vertices
        this.addListenersForVertices();

        // Refetch summary stats
        // TODO: this is suboptimal b/c triggers another request when it could reuse existing stats
        delete view._currentSummaryStats;
        d3.selectAll('.roi-stats').remove();
        view.fireEvent('fetchstats');
    },

    // Returns an array of pixel coordinates projected
    // to the specified new map projection.
    //
    //     @param  cs           {Array} e.g. [[0,4],[0,2],[3,2],[3,4]]
    //     @param  oldproj      {d3.geo.*}
    //     @param  newproj      {d3.geo.*}
    //     @return              {Array}

    reprojectRoiCoords: function (cs, oldproj, newproj) {
        // Conversts coordinates to lat/long using old projection and then
        // back to pixel coordinates useing the new projection
        return Ext.Array.map(cs, function (c) {
            return newproj(Ext.Array.map(oldproj.invert([c[0],c[1]]), function(l) {
                    return l;
            }));
        });

    },

    // Updates drawing scale (size) of auxiliary map components
    // (incl. ROI vertices/polygon, Nongridded markers) according
    // to the provided zoom scale.
    //
    //     @param  scale    {}

    scaleAuxiliaryMapComponents: function (scale) {
        var sel;
        var proj = this.getProjection();
        var sz = this._markerSize/scale;
        var overlay_sel = this.panes.overlay.selectAll('.cell');
        
        // Scale stroke-width and position for nongridded data appropriately, whether it exists...
        // ...as a primary model instance OR...
        if (this._model && this._model.id.indexOf('Flux.model.Nongridded') > -1) {
            sel = this.panes.datalayer.selectAll('.cell');
        // ...as an overlay...
        } else if (overlay_sel.length > 0) {
            sel = overlay_sel;
        }
        if (sel) {
            sel.style({
                    'stroke-width': this._overlayStrokeWidth / scale
                })
                .attr({
                    'x': function (d) {
                        return proj(d.coordinates)[0] - (0.5 * sz);
                    },

                    'y': function (d) {
                        return proj(d.coordinates)[1] - (0.5 * sz);
                    },
                    'height' : sz,
                    'width' : sz
                });
        }

        // Scale the ROI vertices appropriately
        this.wrapper.selectAll('.roi-vertex').attr({
            'r': this._vertexRadius / scale,
            'stroke-width': this._vertexStrokeWidth / scale
        });

        // Scale the ROI polygon appropriately
        this.wrapper.selectAll('.roi-polygon').style('stroke-width', this._polygonStrokeWidth / scale);

        // Update the scaling for the mouseover/mouseout listeners on ROI polygon vertices
        this.updateListenersForVertices();
    },

    // Draws or redraws the basemap given the URL of a new TopoJSON file.
    //
    //     @param  basemapUrl      {String}
    //     @param  drawBoundaries  {Boolean}
    //     @return                 {Flux.view.D3GeographicMap}

    setBasemap: function (basemapUrl, boundaries) {
        var view = this;
        var clearBasemap = Ext.Function.bind(function () {
            this.panes.basemap.select('#basemap').remove();
        }, this);

        var drawBasemap = Ext.bind(function (json) {
            var sel = this.panes.basemap.append('g')
                .attr('id', 'basemap');

            sel.append('g')
                .attr('class', (boundaries === 'outer') ? 'political empty' : 'political region')
                .selectAll('path')
                .data(topojson.feature(json, json.objects.basemap).features)
                .enter().append('path')
                .attr('d', this.path)
                .style('pointer-events', 'none');

            if (boundaries === 'inner' || boundaries === 'both') {
                sel.append('path')
                    .datum(topojson.mesh(json, json.objects.basemap, function (a, b) {
                        return a !== b; // Inner boundaries
                    }))
                    .attr('class', 'political boundary inside')
                    .attr('d', this.path);
            }

            if (boundaries === 'outer' || boundaries === 'both') {
                sel.append('path')
                    .datum(topojson.mesh(json, json.objects.basemap, function (a, b) {
                        return a === b; // Outer boundaries
                    }))
                    .attr('class', (function () {
                        var c = 'political boundary ';
                        if (boundaries === 'both') {
                            return c + 'inside';
                        }

                        return c + 'outside';
                    }()))
                    .attr('d', this.path);
            }

        }, this);

        boundaries = boundaries || this.basemaps.boundaries;

        // Remove the old basemap, if one exists
        this.panes.basemap.select('#basemap').remove();

        if (Ext.isEmpty(basemapUrl)) {
            return clearBasemap();
        }

        if (this.basemaps.hasOwnProperty(basemapUrl)) {
            // If the requested basemap was loaded before, just re-draw it
            drawBasemap(this.basemaps[basemapUrl]);

        } else {
            // Execute XMLHttpRequest for new basemap data
            d3.json(basemapUrl, Ext.bind(function (error, json) {
                drawBasemap(json);
                this.basemaps[basemapUrl] = json;
            }, this));
        }

        // Remember boundaries settings
        if (boundaries !== undefined) {
            this.basemaps.boundaries = boundaries;
        }

        return this;
    },

    // Changes the marker size for overlays.
    //
    //     @param  size    {Integer}

    setMarkerSize: function (size) {
        this._markerSize = size;
        return this;
    },

    // Given a new projection, the drawing path is updated.
    //
    //     @param  proj    {String}
    //     @param  width   {Number}
    //     @param  height  {Number}
    //     @return         {Flux.view.D3GeographicMap}

    setProjection: function (proj, width, height) {
        var projOld = this._proj;
        width = width || this.svg.attr('width');
        height = height || this.svg.attr('height');

        this._projId = proj;
        this._proj = d3.geo[proj]()
            .scale(width * 0.15)
            .translate([
                Number(width) * 0.5,
                Number(height) * 0.5
            ]);

        this.path = d3.geo.path()
            .projection(this._proj);

        // Update the data in every currently drawn path
        this.svg.selectAll('path')
            .attr('d', this.path);

        // If a drawn polygon existed reproject those coordinates
        if (this._roiCoords && projOld) {
            this.fireEvent('removeRoi');
            this._roiCoords = this.reprojectRoiCoords(this._roiCoordsMostRecent.slice(0), projOld, this._proj);
            this.redrawRoi();
        }
        return this;
    },

    // Sets the grid geometry; retains a reference to the Flux.model.RasterGrid
    // instance.
    //
    //     @param  grid    {Flux.model.RasterGrid}
    //     @return         {Flux.view.D3GeographicMap}

    setRasterGrid: function (grid) {
        this._grid = grid;
        this.svg.selectAll('.cell').remove();
        this.isDrawn = false;
        return this;
    },

    // Sets the color scale used by the map.
    //
    //     @param  scale   {d3.scale.*}
    //     @return         {Flux.fview.D3GeographicMap}

    setColorScale: function (scale, opts) {
        this._colorScale = scale;
        var suppress = false;
        if (opts) {
            suppress = opts.suppressUpdate;
        }

        if (this.panes.datalayer) {
    	    if (!suppress) {
                this.update(this.panes.datalayer.selectAll('.cell'));

                if (this.panes.overlay.selectAll('.cell').length > 0) { // better way of determining if overlay???
                    this.update(this.panes.overlay.selectAll('.cell'), true);
                }
    	    }

            this.updateLegend();
        }

        this.fireEvent('scalechange');

        return this;
    },

    // Sets the zoom level by a specified factor; also accepts a specified
    // duration of time for the transition to the new zoom level.
    //
    //     @param  factor      {Number}
    //     @param  translation {Array}
    //     @param  duration    {Number}
    //     @return             {Flux.view.D3GeographicMap}
    setZoom: function (factor, translation, duration) {
        
        var scale = this.zoom.scale();
        var extent = this.zoom.scaleExtent();
        var newScale = scale * factor;
        var t = translation || this.zoom.translate();
        var c = [
            this.filler.attr('width') * 0.5,
            this.filler.attr('height') * 0.5
        ];

        duration = 500;//duration || 500; // Duration in milliseconds
           
        if (extent[0] <= newScale && newScale <= extent[1]) {
            this.zoom.scale(newScale)
                .translate([
                    (c[0] + (t[0] - c[0]) * factor),
                    (c[1] + (t[1] - c[1]) * factor)
                ])
                .event((this._transitions) ? this.wrapper.transition().duration(duration) : this.wrapper);

        } else {
            this.zoom.scale(1)
                .translate([
                    (c[0] + (t[0] - c[0]) / scale),
                    (c[1] + (t[1] - c[1]) / scale)
                ])
                .event((this._transitions) ? this.wrapper.transition().duration(duration) : this.wrapper);
        }
        
        return this;
    },

    // Sets the initial zoom level for working with multiple map frames
    // in Coordinate View
    
    setZoomInit: function (factor, translation) {
        var scale = 1;//this.zoom.scale();
        var newScale = scale * factor;
        var width = this.filler.attr('width');
        var height = this.filler.attr('height');
        var t = translation || this.zoom.translate();
        var c = [
            width * 0.5,
            height * 0.5
        ];

        var translate = [
                    c[0] + (t[0] - c[0]) * factor,
                    c[1] + (t[1] - c[1]) * factor
                    ];
                    
        this.wrapper.attr('transform', 'translate(' + translate + ')scale(' + newScale + ')');

        // Let the zoomer know that we've changed zoom/location
        this.zoom.scale(newScale);
        this.zoom.center([width/2, height/2]);
        this.zoom.translate([translate[0] + this._transOffset_x,
                             translate[1] + this._transOffset_y]);

        this._mostRecentZoomScale = newScale;

        return this;
    },

    // Set the zoom level to that of the currently loaded ROI polygon.

    setZoomToRoiCenter: function() {
        var x, y;
        var centroid = d3.selectAll('.roi-polygon').attr('centroid').split(',').map(Number);
        var bbox = d3.selectAll('.roi-polygon').attr('bbox').split(',').map(Number);
        var width = this.filler.attr('width');
        var height = this.filler.attr('height');
        var scale = this.getZoomScaleFromBbox(bbox);

        x = centroid[0];
        y = centroid[1];

        this.wrapper.transition()
            .duration(750)
            .attr('transform', 'translate(' + width/2 + ',' + height/2 + ')scale(' + scale + ')translate(' + -x + ',' + -y + ')');

        // Let the zoomer know that we've changed zoom/location
        this.zoom.scale(scale);
        this.zoom.center([width/2, height/2]);
        this.zoom.translate([-x*scale+width/2, -y*scale+height/2]);

        // Scale ROI vertices/polygon and Nongridded markers to new scale
        this.scaleAuxiliaryMapComponents(scale);

    },

    // When an ROI is loaded, make necessary UI changes to toolbar
    setTbarForDrawnROI: function() {
        var tbar = this.down('toolbar[cls=map-tbar]');
        var meta = this.getMetadata();

        // Hide the "Add ROI" menu
        tbar.down('button[itemId="btn-add-roi"]').hide();

        // Show the "ROI Tools" menu
        tbar.down('button[itemId="btn-roi-tools"]').show();

        // Conditionally display the fetch-roi-time-series button
        var cmp = tbar.down('button[itemId="btn-fetch-roi-time-series"]');

        if (meta && meta.get('gridded')) {
            cmp.show();
        }
        cmp.setDisabled(!Ext.ComponentQuery.query('checkbox[name="showLinePlot"]')[0].checked);
    },

    // Toggles the display of the legend on/off.
    //
    //     @param  state   {Boolean}
    //     @return         {Flux.view.D3GeographicMap}

    toggleLegend: function (state) {
        if (state) {
            this.panes.legend.attr('class', 'pane legend');
        } else {
            this.panes.legend.attr('class', 'pane legend hidden');
        }

        return this;
    },

    // Toggles on/off the display of the legend's measurement units.
    //
    //     @param  state   {Boolean}
    //     @param  update  {Boolean}
    //     @return         {Flux.view.D3GeographicMap}

    toggleLegendUnits: function (state, update) {
        update = (update === true); // Default to false
        this._showLegendUnits = state;

        if (update) {
            this.updateLegend();
        }

        return this;
    },

    // Toggles on/off the HTML encoding of the legend's units; necessary to
    // encode the characters before serializing to a PNG.
    //
    //     @param  encode  {Boolean}
    //     @return         {Flux.view.D3GeographicMap}

    toggleLegendUnitsEncoding: function (encode) {
        this.panes.legend.selectAll('.units')
            .text(Ext.Function.bind(function (d) {
                if (encode) {
                    return Ext.String.htmlEncode(this._legendUnitsText || d)
                        .replace(/&mu;/, 'u')
                        .replace(/&sup2;/, '^2');
                }

                this._legendUnitsText = d;
                return Ext.String.htmlDecode(d);
            }, this));

        return this;
    },

    // Draws again the visualization features of the map by updating their
    // SVG attributes. Accepts optional D3 selection which it will style.
    //
    //     @param  selection   {d3.selection}
    //     @return             {Flux.view.D3GeographicMap}

    update: function (selection, showAsOverlay) {
        var pane = this.panes.datalayer;

        // If a selection was provided, update color attributes
        if (selection) {
            if (this.getMetadata().get('gridded') && !showAsOverlay) {
                selection.attr('fill', Ext.bind(function (d) {
                    if (Ext.isEmpty(d)) {
                        return 'transparent';
                    }

                    return this.getColorScale()(d);
                }, this));

            } else {
                selection.attr('fill', Ext.bind(function (d) {
                    return this.getColorScale()(d.properties.value);
                }, this));

            }

            return this;
        }

        // If no selection was provided, update location attributes
        if (showAsOverlay) {
            pane = this.panes.overlay;
        }

        pane.selectAll('.cell').attr(this.getDrawingAttrs(showAsOverlay));

        return this;
    },

    // Updates the on-map info text in the heads-up-display; only used when
    // enableDisplay is set to true.
    //
    //     @param  data    {Array}
    //     @return         {Flux.view.D3GeographicMap}

    updateDisplay: function (data) {
        var scale = 0.039 * this.svg.attr('height');

        if (!this._model) {
            return this;
        }

        if (Ext.isEmpty(data)) {
            data = this.panes.hud.selectAll('.info').data();
        }

        // Font-size is partially dependent on length of
        // text to display (to avoid cutting off particularly
        // long text, e.g. aggregate views showing [t1] >>> [t2])
        var fs = this.setHudFontSize();
        if (data[0] && data[0].text && data[0].text.length > 28) {
            fs = fs * (28 / data[0].text.length);
        }

        this.panes.hud.selectAll('.backdrop')
            .attr('fill-opacity', (Ext.isEmpty(data)) ? 0.0 : 0.6);

        this.panes.hud.selectAll('.info')
            .data(data)
            .text(function (d) { return d.text; })
            .attr({
                'x': this.svg.attr('width') * 0.5,
                'y': function (d, i) {
                    return (i + 1) * scale;
                }
            })
            .style({
                'font-size' : fs.toString() + 'px'
            });

        return this;
    },

    // Updates the legend based on the current color scale; can be called with
    // or without an Array of breakpoints (bins) for the scale.
    //
    //     @return         {Flux.view.D3GeographicMap}

    updateLegend: function () {
        var bins, h, ordinal, unitsLabel, boxHeight;
        var p = this.getMetadata().get('precision');
        var s = 0.025 * this.svg.attr('width'); // Length on a side of the legend's bins
        var x0 = 4; // Number of pixels by which to buffer legend entries from left edge of map
        var colors = this._colorScale.range();
        var units = this.getMetadata().get('units');

        // Add on the measurement units for the data values or nothing
        if (this._showLegendUnits) {
            if (units) {
                unitsLabel = units.values || units.value ||  '';
            }
        } else {
            unitsLabel = '';
        }

        // Subtract the header width from the legend's y-offset so that it
        //  is displaced relative to the bottom of the Panel's header, not the
        //  top of the Panel's header
        var yOffset = this.svg.attr('height') - this.getHeader().getHeight() - 3;

        if (this._colorScale.domain().length === 0) {
            return this;
        }

        if (typeof this._colorScale.quantiles === 'function') {
            bins = bins || this._colorScale.quantiles();
            ordinal = false;
        } else {
            bins = bins || this._colorScale.domain();
            ordinal = true;
            if (bins.length === 1) {
                bins = [Math.floor(bins[0]), (Math.floor(bins[0]) + 1)];
            }
        }

        // Calculate intended height of the legend
        h = s * bins.length;
        
        // Update scale 
        this._legend.yScale
            .domain([0, bins.length])
            .range([h, 0]);
            
        // Update backdrop based on height
        boxHeight = h + s + 34
        this.panes.legend.selectAll('.backdrop')
            .attr({
                'fill-opacity': 0.6,
                'x': 0,
                'y': yOffset - boxHeight + 4,
                'width': s + 50,
                'height': boxHeight
            });

        this._legend.yAxis
            .tickFormat(function (x) {
                var t = Number(bins[x]).toFixed(p).toString();
                return (t === 'NaN') ? '' : t;
            })
            .scale(this._legend.yScale);

        this.panes.legend.selectAll('.bin').remove();
        this.panes.legend.selectAll('.bin')
            .data(colors)
            .enter()
            .append('rect')
            .attr({
                'x': x0,
                'y': function (d, i) {
                    if (ordinal) {
                        return yOffset - ((i + 2) * s);
                    }
                    return yOffset - ((i + 1) * s);
                },
                'width': s,
                'height': s,
                'fill': function (d) {
                    return d;
                },
                'class': 'bin'
            });

        this.panes.legend.selectAll('.units')
            .data([unitsLabel])
            .text(function (d) {
                return Ext.String.htmlDecode(d);
            })
            .attr({
                'x': s * 0.5,
                'y': function (d, i) {
                    return yOffset - (h + s + ((i + 1) * 14));
                },
                'class': 'units'
            });

        // NOTE: Possible performance hit in removing the axis every time the
        //  legend is updated; could render it in init() ensuring it is last
        //  in the drawing order
        this.panes.legend.selectAll('.axis').remove();
        this.panes.legend.append('g').attr({
            'class': 'ramp y axis',
            'transform': 'translate(' + (s + x0).toString() + ',' +
                (yOffset - this._legend.yScale(bins.length) - h - s).toString() + ')'
        }).call(this._legend.yAxis);

        return this;
    },

    // TODO This function is called 3 times when global settings are: Mean-Current-Anomalies
    // Updates the color scale configuration of a specific view, as provided.
    // Creates a new color scale based on changes in the scale configuration
    // (measure of central tendency, number of standard deviations, or a switch
    // between sequential and diverging palette types).
    //
    //     @param  opts    {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
    //
    // TODO Could add a "_lastOptions" property to this view that stores
    // the opts argument and makes it optional? That ways the view could
    // call this method on its own

    updateColorScale: function (opts) {
        var palette, scale;
        var metadata;

        if (!this.getMetadata()) {
            return;
        }

        metadata = this.getMetadata();

    	// Resets tendency to custom value if selected
    	opts.tendency = this._tendency;

        // Get the color palette
        palette = Ext.StoreManager.get('palettes').getById(opts.palette);

    	// Get offset values to use if anmomalies are selected
    	var offset = 0;
    	if (this._showAnomalies) {
    	    offset = this.getTendencyOffset();
    	}

        if (opts.threshold) {
            scale = metadata.getThresholdScale(opts.thresholdValues,
					       palette.get('colors')[0],
					       offset
					      );
        } else {
            scale = metadata.getQuantileScale(opts,offset).range(palette.get('colors'));
        }

        return this.setColorScale(scale, opts);
    }

});
