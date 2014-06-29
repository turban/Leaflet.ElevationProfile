$(function () { 

	var map  = L.map('map').setView([58.99, 6.16], 14);


	L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom={z}&x={x}&y={y}', {
		attribution: '&copy; <a href="http://kartverket.no/">Kartverket</a>'
	}).addTo(map);

    $.getJSON('testdata.json', function(data) {

        // Create the chart
        $('#elevation-chart').highcharts('StockChart', {
            
            chart: {
                className: 'elevation-profile',
                spacing: [10, 0, 0, 0]
            },

            rangeSelector: {
                selected: 1,
                inputEnabled: $('#elevation-chart').width() > 480
            },

            title: {
                text: '<span class="west">&nbsp;<- Bergen</span><span class="east">Oslo ->&nbsp;</span>',
                useHTML: true
            },

            credits: {
                enabled: false
            },

            xAxis: {
                reversed: true
            },

            yAxis: {
                opposite: true
            },            

            series: [{
                name: 'AAPL',
                data: data,
                tooltip: {
                    valueDecimals: 2
                }
            }]
        });
    });

});