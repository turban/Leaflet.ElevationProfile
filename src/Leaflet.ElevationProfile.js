/*

Highcharts.dateformat 
Simplify when zoomed out
Not 1k, 2k for alitude

http://www.highcharts.com/demo/dynamic-click-to-add
http://www.highcharts.com/demo/dynamic-update

Crossfilter
http://blog.rusty.io/2012/09/17/crossfilter-tutorial/

Nearest point
https://github.com/mapbox/leaflet-knn


*/
L.ElevationProfile = L.Control.extend({
	options: {
		clickZoom: 13, 
		minDistance: 10, // km - TODO: meters?
        marker: L.circleMarker(null, {
            radius: 6,
            stroke: false,
            fillColor: '#333',
            fillOpacity: 0.8
        }),
        polyline: {
            color: '#333',
            opacity: 0.8           
        }
	},

	initialize: function (data, options) {	
		this._data = data;
        this._knnData = sphereKnn(data);
		L.Util.setOptions(this, options);
	},

	onAdd: function (map) {
        //this._drawLine(this._data);

        var polyline = L.polyline(this._data, this.options.polyline).addTo(map);
        map.fitBounds(polyline.getBounds());

		this._drawChart(this._getPoints(this._data));
        this._createFilter(this._data); 
		map.on('drag', L.bind(this._onMapChange, this));
        map.on('zoomend', L.bind(this._onMapChange, this));

        polyline.on('mouseover', L.bind(this._onPolylineMouseOver, this));




		//this._layer.on('mouseover', L.bind(this._onMarkerMouseOver, this));
		//this._layer.on('mouseout', L.bind(this._onMarkerMouseOut, this));
		//this._zoomChart();
		return L.DomUtil.create('div'); // Chart is placed outside the map
	},

    _drawLine: function (data) {

    },

    // Returns array with chart points
	_getPoints: function (data) {
		var points = [],
			distance = 0,
			prevPoint;

        this._plotLines = [];

        for (var i = 0, len = data.length; i < len; i++) {
            var item = data[i],
                point = L.latLng(data[i]);

            if (prevPoint !== undefined) {
                distance += Math.round(point.distanceTo(prevPoint));
            }

            item.x = distance;
            points.push([distance, item.alt]);
			prevPoint = point;

            if (item.type === 'OK') {
                //console.log("distance", distance);
                this._plotLines.push({
                    value: distance,
                    width: 1,
                    color: '#333',
                    dashStyle: 'Dot',
                    label: {
                        text: item.name || ''
                    },
                    zIndex: 5
                });
            }

		}

        // Add last point
		if (this.options.end) {
			var end = this.options.end,
				point = L.latLng(end);

			distance += point.distanceTo(prevPoint);

            points.push([distance, null]); // Creates gap in chart
            points.push([distance, end.alt]);

            end.x = distance;
            data.push(end); // Add to crossfilter
		}

		return points;
	},

	_createFilter: function (points) {
		var filter = crossfilter(points);
		return this._filter = {
			byDist: filter.dimension(function(d) { return d.x; }),
			byLat:  filter.dimension(function(d) { return d.lat; }),
			byLng:  filter.dimension(function(d) { return d.lng; })
		}; 
	},

    // Better way to clear all filters?
    _clearFilter: function () {
        this._filter.byDist.filterAll();
        this._filter.byLat.filterAll();
        this._filter.byLng.filterAll();
        return this._filter;
    },

	_drawChart: function (points) {
		var self = this;

        this._chart = new Highcharts.Chart({
            chart: {
                type: 'areaspline',
                renderTo: 'elevation-chart',
                className: 'elevation-profile',
                plotBorderWidth: 1,   
                zoomType: 'x' ,
                events: {
                    selection: L.bind(this._onChartSelection, this)
                },
                resetZoomButton: {
			        theme: {
			            display: 'none'
			        }                	
                },
                animation: {
                    //duration: 500
                }
            },
            title: {
                text: '<span class="west">&nbsp;<- Bergen</span><span class="east">Oslo ->&nbsp;</span>',
                text: null,
                useHTML: true
            },
            /*
            subtitle: {
                text: document.ontouchstart === undefined ? 'Click and drag to zoom in' : 'Pinch the chart to zoom in'
            },
            */
            credits: {
                enabled: false
            },       
            xAxis: {
                //categories: ['Apples', 'Bananas', 'Oranges']
                reversed: true,
                minPadding: 0,
                maxPadding: 0,
                labels: {
                    formatter: function () {
                        return Math.round(this.value / 1000) + ' km';
                    }
                },
                plotLines: this._plotLines                
            },
            yAxis: [{
                title: {
                    text: null
                },
                labels: {
                    formatter: function () {
                        return this.value;
                    }
                },                
                min: 0//,
                //max: 200
            }, {
                title: {
                    text: null
                },
                labels: {
                    formatter: function () {
                        return this.value;
                    }
                },                   
                opposite: true,
                linkedTo: 0
            }],
            legend: {
                enabled: false
            },
            tooltip: {
            	formatter: function () {
                	return self._showTooltip(this);
                }
            },
            plotOptions: {
                series: {
                    //turboThreshold: 3000, // TODO: remove!!!!!
                    cursor: 'pointer',
                    animation: false,
					//color: '#FF0000',
	                //negativeColor: '#0088FF',
	                //threshold: 22,                         
                    point: {
                        events: {
                            click: function () {
                            	self._onChartClick(this);
                            },
                            mouseOver: function () { 
                            	self._onChartMouseOver(this);
                            },                            	
                            mouseOut: function () { 
                            	self._onChartMouseOut(this);
                            },
                        }
                    }
                }
            },  

            series: [{
                name: 'Altitude',
                data: points           
            }]
        });
	},

	// Zoom chart to map bounds
	_zoomChart: function () {
        var bounds = this._map.getBounds(),
        	filter = this._filter;

        this._clearFilter();
        //filter.byLat.filter([bounds.getSouth(), bounds.getNorth()]);
        filter.byLng.filter([bounds.getWest(), bounds.getEast()]);

        if (filter.byDist.bottom(1).length) {
        	//console.log(filter.byDist.top(1)[0]);
        	var firstPoint = filter.byDist.bottom(1)[0],
        		lastPoint = filter.byDist.top(1)[0],
        		start = firstPoint.x,
        		stop = lastPoint.x,
        		minDistance = this.options.minDistance;

        	// Don't allow span to be less than minDistance
        	if (stop < minDistance) {
        		start = 0;
        		stop = minDistance;
        	} else if (stop - start < minDistance) { 
        		start -= minDistance / 2;
        		stop  += minDistance / 2;
        	}

        	// Don't allow stop to be bigger than last point
			if (lastPoint.id === 'end' && stop > lastPoint.x) {
				start = lastPoint.x - (stop - start);
				stop = lastPoint.x;
        		console.log(lastPoint);
        	}

        	stop += 0.001; // Needed to show last point

            this._chart.xAxis[0].setExtremes(start, stop);
            this._chart.showResetZoom();
        } else {
            //console.log('No points!');
        }	
	},

	// Zoom map to chart selection (min/max distance)
	_zoomMap: function (min, max) {
		var filter = this._clearFilter();
        filter.byDist.filter([min, max]);
        if (filter.byLat.bottom(1)[0]) {
	        this._map.fitBounds([
	        	[filter.byLat.bottom(1)[0].lat, filter.byLng.bottom(1)[0].lng],
	        	[filter.byLat.top(1)[0].lat, filter.byLng.top(1)[0].lng]
	        ]);
        }
	},

	_onChartSelection: function (evt) {
    	var xAxis = evt.xAxis;
        if (xAxis) {
        	this._zoomMap(xAxis[0].min, xAxis[0].max);
        }
        return false; // Don't zoom chart, as it will be triggerd by map move
	},

	_onChartClick: function (data) {
        var point = this._getPointFromDistance(data.x),
            marker = L.marker(point).addTo(this._map);

        //console.log(point);

		//if (this._layer._layers[point.id]) {  
		//	this._map.setView(this._layer._layers[point.id].getLatLng(), this.options.clickZoom);
		//}
	},

	_onChartMouseOver: function (data) {
        var point = this._getPointFromDistance(data.x),
            map   = this._map;

        this.options.marker.setLatLng(point).addTo(map);

        if (!map.getBounds().contains(L.latLng(point))) {
            map.panTo(point, {
                animate: true,
                duration: 1
            });
            //this._zoomChart(); // TODO: reduce speed
        }
	},

	_onChartMouseOut: function (data) {
        var point = this._getPointFromDistance(data.x);

		//if (this._layer._layers[point.id]) {		
		//	this._layer._layers[point.id].setRadius(3);	
		//}
	},

	_onMapChange: function (evt) {
		this._zoomChart();
	},

    _onPolylineMouseOver: function (evt) {
        var point = this._getPointFromPosition(evt.latlng); // Nearest point
        this.options.marker.setLatLng(point).addTo(this._map);
    },

    /*
	_onMarkerMouseOver: function (evt) {
        var point = this._chart.get(evt.layer._leaflet_id);
        point.update({ color: '#f00' }, true, false);
	},

	_onMarkerMouseOut: function (evt) {
        var point = this._chart.get(evt.layer._leaflet_id);
        point.update({ color: '#000' }, true, false);	
	},
    */

	_showTooltip: function (data) {
        var point = this._getPointFromDistance(data.x),
            options = this.options,
            tooltip = '';

        if (point.name) tooltip += point.name;
        if (data.y) tooltip += ' ' + data.y + ' moh.';
        //if (tooltip) tooltip += '<br>'; 
        //tooltip +=  Math.round(data.x / 1000) + ' km';
		//if (options.start) tooltip += ' fra ' + (options.start.name || 'start');  
		return tooltip;
	},

    _getPointFromDistance: function (distance) {
        this._clearFilter();
        this._filter.byDist.filter(distance);
        return this._filter.byDist.top(1)[0];        
    },

    _getPointFromPosition: function (latlng) {
        return this._knnData(latlng.lat, latlng.lng, 1)[0];
    }

});

L.elevationProfile = function (data, options) {
	return new L.ElevationProfile(data, options);
};		