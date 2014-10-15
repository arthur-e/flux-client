Ext.define('Flux.view.D3GeographicMap', {
    extend: 'Flux.view.D3Panel',
    alias: 'widget.d3geomap',
    requires: [
        'Ext.Function',
        'Ext.tip.QuickTip',
        'Ext.toolbar.Toolbar',
        'Flux.store.Rasters'
    ],
    /**
        An internal reference to the zoom scale.
        @private
      */
    _currentZoomScale: 1,
    /**
        An internal reference to the legend selection.
        @private
      */
    _legend: {},

    /**
        The size of the markers to use for displaying vector overlays.
        @private
     */
    _markerSize: 5,

    /**
        The scaling factor for a Mercator projection.
        @private
     */
    _mercatorFactor: function (phi) {
        return 1/Math.cos((Math.PI * phi) / 180);
    },

     /**
        The stroke-width size for ROI polygon
        @private
     */
    _polygonStrokeWidth: 1, 
    
    
    /**
        Flag to determine whether or not units should be displayed in the legend.
        @private
     */
    _showLegendUnits: true,

     /**
        The radius and stroke-width size for ROI polygon vertices
        @private
     */
    _vertexRadius: 5,
    _vertexStrokeWidth: 20, // a larger stroke-width means an easier to 'grab' vertex
    
    /**
        Configuration and state for the basemap(s).
     */
    basemaps: {
        boundaries: 'both'
    },

    /**
        Enables the heads-up-display to show timestamps, mouseover events, etc.
     */
    enableDisplay: true,

    /**
        Flag to indicate whether or not the <rect> elements have already
        been added to the map.
     */
    isDrawn: false,

    /**
        The moment.js time display format to use.
     */
    timeFormat: 'YYYY MM-DD HH:ss',

    /**
        Initializes the component.
     */
    initComponent: function () {
        this.addEvents('mouseover', 'mouseout');

        /**
            The scale used for coloring map elements.
            @private
         */
        this._scale = d3.scale.quantile();

        /**
            The Flux.store.Rasters instance associated with this view.
         */
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

        this.on('draw', function (v, grid) {
            // Figure out what timestamp description to display at the top
            this._display = grid.getTimestampDisplay(this.timeFormat);
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
                        itemId: 'btn-draw-polygon',
                        iconCls: 'icon-draw',
                        tooltip: 'Draw Polygon to Get ROI Summary Stats',
                    }, {
		        itemId: 'btn-cancel-polygon',
                        iconCls: 'icon-draw',
                        tooltip: 'Cancel drawing',
			style: 'background: #ffcc00;',
			hidden: true
                    }, {
			itemId: 'btn-erase-polygon',
			iconCls: 'icon-erase',
			tooltip: 'Erase Polygon',
			disabled: true      
		    }, {
                        itemId: 'btn-save-image',
                        iconCls: 'icon-disk',
                        tooltip: 'Save Image'
                    }]
                }), 0);
            }
        });

        this.callParent(arguments);
    },

    /**
        Add event listeners to the drawn elements.
        @param  sel {d3.selection}
        @return     {Flux.view.D3GeographicMap}
     */
    addListeners: function (sel) {
        var proj = this.getProjection();
        var view = this;

        sel = sel || this.panes.raster.selectAll('.cell');
        sel.on('mouseover', function (d) {
            var c, m, p, ll, v;

            //if (Ext.isEmpty(d)) {
            //    return;
            //}

            p = view.getMetadata().get('precision');
            m = d3.mouse(view.svg[0][0]);
            c = [
                this.attributes.x.value,
                this.attributes.y.value
            ];

            if (view.getMetadata().get('gridded')) {
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

        if (this.getMetadata() && this.getMetadata().get('gridded')) {
            sel.on('click', function () {
                view.fireEventArgs('plotclick', [view, [
                    this.attributes.x.value,
                    this.attributes.y.value
                ]]);
            });
        }

        return this;
    },

    /**
        Add event listeners related to drawing polygons
        @param  sel  {d3.selection}
        @param	tbar {Ext.Toolbar}
        @return      {Flux.view.D3GeographicMap}
    */
    addListenersForDrawing: function (sel, tbar) {
        var proj = this.getProjection();
        var view = this;
	var line, polygon, c, vindex;

        sel = sel || this.selectAll('.polygonCanvas');
	
	// temporarily disabled zooming while drawing is active
	view.zoom.on('zoom',null);
	
	// there are separate mousemove listeners depending
	// on whether drawing is active or not
        //sel.on('mousemove', mousemove); // this doesn't do anything helpful

	// add vertex on click
	sel.on('click', function () {
	    var m = d3.mouse(view.wrapper[0][0]);
	    
	    // store the current representation of the polygon in screen coords
	    if (!view._drawingCoords) {
		view._drawingCoords = [];
	    }

	    c = [m[0],m[1]];
	    view._drawingCoords.push(c);

	    // add polygon if it doesn't yet exist
	    if (!polygon) {
		polygon = view.wrapper.append('polygon').attr({
			    'class': 'roi-polygon',
			    'points': view.getSVGPolyPoints(view._drawingCoords.slice(0)),
			    'pointer-events': 'none'
			});

		vindex = 0;
	    }
	    
	    // add vertex
	    view.wrapper.append('circle').attr(view.getVertexAttrs(vindex,m));
	    
	    // vindex is used to track the order vertices are placed
	    //  which is essential for implementing drag functionality
	    vindex += 1;
	    
	    // once clicked, activate a different mousemove function
	    sel.on('mousemove', mousemoveDraw);
        });
	
	sel.on('dblclick', finishPolygon);
	
	// TODO: is this needed?
// 	sel.on('mouseout', function () {
//             view.updateDisplay([{
//                 id: 'timestamp',
//                 text: view._display
//             }]);
//             view.panes.tooltip.selectAll('.tip').text('');
//             view.fireEventArgs('mouseout', [view]);
//         });
	
	// Functions specific to polygon drawing listeners
	function finishPolygon() {
	    // Registers drawing on double-click
	  
	    // an extra vertex is add on the second click of a double-click
	    // Remove the vertex as well as the coordinate from the poly def.
	    view.wrapper.selectAll('circle[vindex="' + (vindex-1) + '"]').remove();
	    view._drawingCoords.pop();
	 
	    var cs = view._drawingCoords.slice(0);
	    
	    polygon.attr('points', view.getSVGPolyPoints(cs));

	    // reset listeners
	    sel.on('mousemove', null);
	    sel.on('click', null);
	    sel.on('dblclick', null);
	    
	    // grow/shrink/drag listeners to vertices
	    view.addListenersForVertices();
	    
	    // Make UI changes
	    tbar.down('button[itemId="btn-erase-polygon"]').setDisabled(false);
	    tbar.down('button[itemId="btn-cancel-polygon"]').hide()
	    tbar.down('button[itemId="btn-draw-polygon"]').setDisabled(true);
	    tbar.down('button[itemId="btn-draw-polygon"]').show();
	    
            view.updateDisplay([{
                id: 'timestamp',
                text: view._display
            }]);
	    
	    
	    // now finish the polygon by adding the first element at the end
	    //view._drawingCoords.push(view._drawingCoords[0]); // TODO: necessary?
	    //this._drawingCoords.ll.push(this._drawingCoords.ll[0]);

// 	    // create GeoJSON version and send to server? (needed?)
// 	    var drawingGJ = {
// 		"type": "FeatureCollection",
// 		"features": [
// 		    {
// 			"type":"Feature",
// 			"geometry":{
// 			    "type": "Polygon",
// 			    "coordinates": lls
// 			},
// 		    }]
// 	    };
	    
	};
	
// 	function mousemove() {
// 	    var c, m, ll, t;
// 
//             m = d3.mouse(view.wrapper[0][0]);
//             c = [m[0], m[1]];
// 	    
// 	   // creates lat/long from mouse location
//            ll = Ext.Array.map(proj.invert(c), function (l) {
//                     return l.toFixed(5);
//                 });
// 	    
// 	   t = Ext.String.format('@({0},{1})',
//                       parseFloat(ll[0]).toFixed(2),
// 		      parseFloat(ll[1]).toFixed(2))
// 	   
// //             // Heads-up-display
// //             view.updateDisplay([{
// //                 id: 'tooltip',
// //                 text: t
// //             }]);
// 	}
	
	function mousemoveDraw() {
	    var m = d3.mouse(view.wrapper[0][0]);
	    var cs = view._drawingCoords.slice(0);
	    
	    cs.push([m[0],m[1]]);
	    
	    polygon.attr('points', view.getSVGPolyPoints(cs));
	    
	    // also preserve the original mousemove functionality (tooltip and header)
	    //mousemove(); 
	}
	
        return this;
    },
    
    /** Creates listeners for vertices to grow/shrink
        and enable dragging
    */
    addListenersForVertices: function () {
	var view = this;
	var vertices = this.wrapper.selectAll('.roi-vertex');
	var polygon = this.wrapper.selectAll('polygon');

	vertices.attr('pointer-events','all');
	
	vertices.on('mouseover', function () {
	    // panning will interfere with vertex dragging unless it is disabled
	    // NOTE: if you drag quick enough to "outrun" the vertex being dragged,
	    //       it will trigger 'mouseout' below and therefore briefly re-enable panning.
	    //       Minor bug, but might be worth looking into fixing
	    view.zoom.on('zoom',null);
	    
	    d3.select(this).transition()
		.duration(40)
		.ease('linear')
		.attr({
		    'fill':'#CC0000',
		    'r': view._vertexRadius*2 / view._currentZoomScale,
		    'stroke-width': view._vertexStrokeWidth*2 / view._currentZoomScale,
		});
	    });

	vertices.on('mouseout', function () {
	    view.zoom.on('zoom', Ext.bind(view.zoomFunc, view));
	    d3.select(this).transition()
		.duration(80)
		.ease('linear')
		.attr({
		    'fill':'#800000',
		    'r': view._vertexRadius / view._currentZoomScale,
		    'stroke-width': view._vertexStrokeWidth / view._currentZoomScale,
		});
	    });

	var drag = d3.behavior.drag()
	    .on('drag', function () {
		m = d3.mouse(view.wrapper[0][0]);
		
		// update polygon
		view._drawingCoords[d3.select(this).attr('vindex')] = [m[0],m[1]];
		polygon.attr('points', view.getSVGPolyPoints(view._drawingCoords.slice(0)));
		
		// update vertex
		d3.select(this)
		    .attr('cx', m[0])
		    .attr('cy', m[1]);
	      }
	    );
	
	vertices.call(drag);
      
	return this;
    },
    
    /**
        Removes the drawn elements from the drawing plane.
        @return {Flux.view.D3GeographicMap}
     */
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

    /**
        Draws the visualization features on the map given input data and the
        corresponding metadata.
        @param  data    {Flux.model.Raster}
        @param  zoom    {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
    draw: function (data, zoom) {
        var bbox, lat, lng, meta, c1, c2, sel;
        var proj = this.getProjection();

        if (!data) {
            return this;
        }

        this.fireEventArgs('beforedraw', [this, data, zoom]);

        // If not using population statistics, calculate the new summary stats
        //  for the incoming data
        if (!this._usePopulationStats) {
            meta = this.getMetadata().copy();
            meta.set('stats', {
                values: data.summarize()
            });

            this.setMetadata(meta);
        }

        // Retain references to last drawing data and metadata; for instance,
        //  resize events require drawing again with the same (meta)data
        this._model = data;

        // Disallow zooming by default
        zoom = (zoom === true);

        ////////////////////////////////////////////////////////////////////////
        // Selection and Attributes ////////////////////////////////////////////

        // Sets the enter or update selection's data
        sel = this.panes.raster.selectAll('.cell')
            .data(data.get('features'), function (d, i) {
                return i; // Use the cell index as the key
            });

        // Append a <rect> for every grid cell so long as the features haven't
        //  been drawn before or the layer is non-gridded
        if (!this.isDrawn || !this.getMetadata().get('gridded')) {
            sel.exit().remove();
            sel.enter().append('rect');

            // Add mouseover and mouseout event listeners
            this.addListeners(sel);
        }

        // Calculate the position and dimensions attributes of the elements
        sel.attr(this.getDrawingAttrs())
            .style('cursor', 'pointer'); // Show link pointer when hovering over

        // Applies the color scale to the current selection
        this.update(sel);

        ////////////////////////////////////////////////////////////////////////
        // Zoom to Feature /////////////////////////////////////////////////////

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

            // Get the pixel coordinates of the longitude maximum and minmum,
            //  then take the difference to get the pixel width of the scene:
            //
            //  (proj([bbox[2], 0])[0] - proj([bbox[0], 0])[0])

            // Then, take the ratio of the SVG width to this scene width to find
            //  the zoom factor; scale it slightly so we don't zoom in too far
            this.setZoom(0.8 * (this.svg.attr('width') / (proj([bbox[2], 0])[0] - proj([bbox[0], 0])[0])), [
                (c1[0] - c2[0]),
                (c1[1] - c2[1])
            ]);

        }

        this.isDrawn = true;
        this.fireEventArgs('draw', [this, data]);
        return this;
    },
    
    /** Redraws a polygon after a map reset caused by dimensions of 
	the parent map component changing
    */
    
    redrawPolygon: function () {
	var view = this;
      
	// add the polygon
	this.wrapper.append('polygon').attr({
			    'class': 'roi-polygon',
			    'points': this.getSVGPolyPoints(this._drawingCoords.slice(0)),
			    'pointer-events': 'none'
			});
	
	// add vertices
	var vindex = 0;
	this._drawingCoords.forEach( function (c) {
	    view.wrapper.append('circle').attr(view.getVertexAttrs(vindex, c));
	    vindex += 1;
	});
	
	// add grow/shrink and drag listeners for vertices
	this.addListenersForVertices();
    },
    
    getVertexAttrs: function(vindex, coords) {
	var attrs = {
	    'class': 'roi-vertex',
	    'vindex': vindex,
	    'cx': coords[0],
	    'cy': coords[1],
	    'r': this._vertexRadius / this._currentZoomScale,
	    'stroke-width': this._vertexStrokeWidth / this._currentZoomScale,
	    'fill': '#800000',
	    'pointer-events': 'none' // otherwise double-click won't register
	};
	return attrs;
    },
    
    /**
        Returns the retained reference to the underlying grid geometry.
        @return {Flux.model.RasterGrid}
     */
    getRasterGrid: function () {
        return this._grid;
    },

    /**
        Creates an Object of attributes for the drawing features.
        @return {Object}
     */
    getDrawingAttrs: function () {
        var attrs, grid, gridxy;
        var proj = this.getProjection();
        var scaling = this._mercatorFactor;
        var sz = this._markerSize;

        if (!this._metadata) {
            return;
        }

        ////////////////////////////////////////////////////////////////////////
        // Non-gridded Overlay /////////////////////////////////////////////////

        if (!this._metadata.get('gridded')) {

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

        ////////////////////////////////////////////////////////////////////////
        // Gridded Raster //////////////////////////////////////////////////////

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

    /**
        Returns the current map projection.
        @return {d3.geo.*}
     */
    getProjection: function () {
        return this._proj;
    },

    /**
        Returns the current map scale.
        @return {d3.scale.*}
     */
    getScale: function () {
        return this._scale;
    },
    
    /**
	Returns SVG polygon "points" attribute from a list
	of paired coordinates
	@param coords 	{Array}
	@return 	{String}
     */
    
    getSVGPolyPoints: function(coords) {
	var poly = '';
	
	coords.push(coords[0]);
	
	coords.forEach(function(c) {
	    poly += c.join() + ' ';
	});
	
	return poly;
    },
    
    /**
        Attempts to display the value at the provided map coordinates; if the
        coordinates do not exactly match any among the current instance's grid
        geometry, nothing is done.
        @param  coords  {Array}
        @return         {D3GeographicMap}
     */
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

    /**
        Initializes drawing; defines and appends the SVG element(s). The drawing
        panes are set up and SVG element(s) are initialized, sometimes with
        empty data sets.
        @param  width   {Number}
        @param  height  {Number}
        @return         {Flux.view.D3GeographicMap}
     */
    init: function (width, height) {
        var elementId = '#' + this.items.getAt(0).id;

	this._width = width;
	this._height = height;
	
        // Remove any previously-rendered SVG elements
        if (this.svg !== undefined) {
            this.svg.remove();
        }
        
        this.svg = d3.select(elementId).append('svg')
            .attr('width', width)
            .attr('height', height);

	this.zoomFunc = function () {
                this.wrapper.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
		this.wrapper.selectAll('.roi-vertex').attr({
		    'r': this._vertexRadius / d3.event.scale,
		    'stroke-width': this._vertexStrokeWidth / d3.event.scale
		});
		this.wrapper.selectAll('.roi-polygon').style('stroke-width', this._polygonStrokeWidth / d3.event.scale);
		this._currentZoomScale = d3.event.scale;
            }
	
        this.zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on('zoom', Ext.bind(this.zoomFunc, this));

        // This container will apply zoom and pan transformations to the entire
        //  content area; NOTE: layers that need to be zoomed and panned around
        //  must be appended to the wrapper
        this.wrapper = this.svg.append('g').attr('class', 'wrapper')
            .call(this.zoom);

        // Add a background element to receive pointer events in otherwise
        //  "empty" space
        this.wrapper.append('rect')
            .attr({
                'class': 'filler',
                'width': width,
                'height': height,
                'fill': 'none',
                'x': 0,
                'y': 0
            })
            .style('pointer-events', 'all');

        // Create panes in which to organize content at difference z-index
        //  levels using painter's algorithm (first drawn on bottom; last drawn
        //  is on top); NOTE: layers that need to be zoomed and panned around
        //  must be appended to the wrapper layer; layers that should NOT zoom
        //  and pan should be appended to something else (e.g this.svg)
        this.panes = {
            basemap: this.wrapper.append('g').attr('class', 'pane'),
        };
        this.panes.raster = this.wrapper.append('g').attr('class', 'pane raster');
        this.panes.hud = this.svg.append('g').attr('class', 'pane hud');
        this.panes.legend = this.svg.append('g').attr('class', 'pane legend');
        this.panes.tooltip = this.svg.append('g').attr('class', 'pane tooltip');

        // Tooltip /////////////////////////////////////////////////////////////
        this.panes.tooltip.selectAll('.tip')
            .data([0])
            .enter()
            .append('text')
            .text('')
            .attr('class', 'info tip');

        // Heads-Up-Display (HUD) date/time info ///////////////////////////////
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

	this._hudFontSize = 0.04 * height;
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
            .style('font-size', this._hudFontSize.toString() + 'px')
            .attr({
                'class': function (d) {
                    return 'info ' + d.id;
                },
                'text-anchor': 'middle'
            });

        // Legend //////////////////////////////////////////////////////////////
        this._legend.yScale = d3.scale.linear();
        this._legend.yAxis = d3.svg.axis()
            .scale(this._legend.yScale)
            .orient('right');

        // Add the empty legend units text element
        this.panes.legend.selectAll('.units')
            .data([''])
            .enter()
            .append('text')
            .attr('class', 'units');

        this.isDrawn = false;

        return this;
    },    
    
    /**
        Draws the view again with the same data it already has bound to it.
        @param  zoom    {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
    redraw: function (zoom) {

        if (this._model) {
            this.draw(this._model, zoom).updateLegend();
        }
	
	// If a drawn polygon exists, it needs to be redrawn too
        if (this._drawingCoords) {
	    // reset zoom scale so that polygon vertices show up at the right size
	    this._currentZoomScale = 1;
	    this.redrawPolygon();
	}
        return this;
    },

    /**
        Draws or redraws the basemap given the URL of a new TopoJSON file.
        @param  basemapUrl      {String}
        @param  drawBoundaries  {Boolean}
        @return                 {Flux.view.D3GeographicMap}
     */
    setBasemap: function (basemapUrl, boundaries) {
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
                .attr('d', this.path);

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

    /**
        Changes the marker size for overlays.
        @param  size    {Integer}
     */
    setMarkerSize: function (size) {
        this._markerSize = size;
        return this;
    },

    /**
        Given a new projection, the drawing path is updated.
        @param  proj    {String}
        @param  width   {Number}
        @param  height  {Number}
        @return         {Flux.view.D3GeographicMap}
     */
    setProjection: function (proj, width, height) {
        width = width || this.svg.attr('width');
        height = height || this.svg.attr('height');

        this._projId = proj;
        this._proj = d3.geo[proj]().scale(width * 0.15)
            .translate([
                Number(width) * 0.5,
                Number(height) * 0.5
            ]);

        this.path = d3.geo.path()
            .projection(this._proj);

        // Update the data in every currently drawn path
        this.svg.selectAll('path')
            .attr('d', this.path);

        return this;
    },

    /**
        Sets the grid geometry; retains a reference to the Flux.model.RasterGrid
        instance.
        @param  grid    {Flux.model.RasterGrid}
        @return         {Flux.view.D3GeographicMap}
     */
    setRasterGrid: function (grid) {
        this._grid = grid;
        this.svg.selectAll('.cell').remove();
        this.isDrawn = false;
        return this;
    },

    /**
        Sets the color scale used by the map.
        @param  scale   {d3.scale.*}
        @return         {Flux.fview.D3GeographicMap}
     */
    setScale: function (scale, opts) {
        this._scale = scale;
	
        if (this.panes.raster) {
	    if (opts && !opts.suppressUpdate) {
		this.update(this.panes.raster.selectAll('.cell'));
	    }
	    
            this.updateLegend();
        }

        this.fireEvent('scalechange');

        return this;
    },

    /**
        Sets the zoom level by a specified factor; also accepts a specified
        duration of time for the transition to the new zoom level.
        @param  factor      {Number}
        @param  translation {Array}
        @param  duration    {Number}
        @return             {Flux.view.D3GeographicMap}
     */
    setZoom: function (factor, translation, duration) {
        var scale = this.zoom.scale();
        var extent = this.zoom.scaleExtent();
        var newScale = scale * factor;
        var t = translation || this.zoom.translate();
        var c = [
            this.svg.attr('width') * 0.5,
            this.svg.attr('height') * 0.5
        ];

        duration = duration || 500; // Duration in milliseconds
        if (extent[0] <= newScale && newScale <= extent[1]) {
            this.zoom.scale(newScale)
                .translate([
                    c[0] + (t[0] - c[0]) / scale * newScale, 
                    c[1] + (t[1] - c[1]) / scale * newScale
                ])
                .event((this._transitions) ? this.wrapper.transition().duration(duration) : this.wrapper);

        } else {
            this.zoom.scale(1)
                .translate([
                    c[0] + (t[0] - c[0]) / scale, 
                    c[1] + (t[1] - c[1]) / scale
                ])
                .event((this._transitions) ? this.wrapper.transition().duration(duration) : this.wrapper);

        }

        return this;
    },

    /**
        Toggles the display of the legend on/off.
        @param  state   {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
    toggleLegend: function (state) {
        if (state) {
            this.panes.legend.attr('class', 'pane legend');
        } else {
            this.panes.legend.attr('class', 'pane legend hidden');
        }

        return this;
    },

    /**
        Toggles on/off the display of the legend's measurement units.
        @param  state   {Boolean}
        @param  update  {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
    toggleLegendUnits: function (state, update) {
        update = (update === true); // Default to false
        this._showLegendUnits = state;

        if (update) {
            this.updateLegend();
        }

        return this;
    },

    /**
        Toggles on/off the HTML encoding of the legend's units; necessary to
        encode the characters before serializing to a PNG.
        @param  encode  {Boolean}
        @return         {Flux.view.D3GeographicMap}
     */
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

    /**
        Draws again the visualization features of the map by updating their
        SVG attributes. Accepts optional D3 selection which it will style.
        @param  selection   {d3.selection}
        @return             {Flux.view.D3GeographicMap}
     */
    update: function (selection) {
        if (selection) {
	  
            if (this.getMetadata().get('gridded')) {
                selection.attr('fill', Ext.bind(function (d) {
                    if (Ext.isEmpty(d)) {
                        return 'transparent';
                    }

                    return this.getScale()(d);
                }, this));

            } else {
                selection.attr('fill', Ext.bind(function (d) {
                    return this.getScale()(d.properties.value);
                }, this));

            }

            return this;
        }

        this.panes.raster.selectAll('.cell')
        .attr(this.getDrawingAttrs());

        return this;
    },

    /**
        Updates the on-map info text in the heads-up-display; only used when
        enableDisplay is set to true.
        @param  data    {Array}
        @return         {Flux.view.D3GeographicMap}
     */
    updateDisplay: function (data) {
        var scale = 0.039 * this.svg.attr('height');

//         if (!this._model) {
//             return this;
//         }

        if (Ext.isEmpty(data)) {
            data = this.panes.hud.selectAll('.info').data();
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
            });

        return this;
    },

    /**
        Updates the legend based on the current color scale; can be called with
        or without an Array of breakpoints (bins) for the scale.
        @return         {Flux.view.D3GeographicMap}
     */
    updateLegend: function () {
        var bins, h, ordinal, unitsLabel;
        var p = this.getMetadata().get('precision');
        var s = 0.025 * this.svg.attr('width'); // Length on a side of the legend's bins
        var colors = this._scale.range();
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
        var yOffset = this.svg.attr('height') - this.getHeader().getHeight();

        if (this._scale.domain().length === 0) {
            return this;
        }

        if (typeof this._scale.quantiles === 'function') {
            bins = bins || this._scale.quantiles();
            ordinal = false;
        } else {
            bins = bins || this._scale.domain();
            ordinal = true;
            if (bins.length === 1) {
                bins = [Math.floor(bins[0]), (Math.floor(bins[0]) + 1)];
            }
        }

        // Calculate intended height of the legend
        h = s * bins.length;

        this._legend.yScale
            .domain([0, bins.length])
            .range([h, 0]);

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
                'x': 0,
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
            'transform': 'translate(' + s.toString() + ',' +
                (yOffset - this._legend.yScale(bins.length) - h - s).toString() + ')'
        }).call(this._legend.yAxis);

        return this;
    },

    /** TODO This function is called 3 times when global settings are: Mean-Current-Anomalies
        Updates the color scale configuration of a specific view, as provided.
        Creates a new color scale based on changes in the scale configuration
        (measure of central tendency, number of standard deviations, or a switch
        between sequential and diverging palette types).
        @param  opts    {Object}    Properties are palette configs e.g. sigmas, tendency, paletteType
        //TODO Could add a "_lastOptions" property to this view that stores
        //  the opts argument and makes it optional? That ways the view could
        //  call this method on its own
     */
    updateScale: function (opts) {
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

        return this.setScale(scale, opts);
    }

});


