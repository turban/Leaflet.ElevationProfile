$(function () { 

    var map = L.map('map', {
        maxZoom: 17
    }).setView([59.25, 5.84], 12);

    L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom={z}&x={x}&y={y}', {
        attribution: '&copy; <a href="http://kartverket.no/">Kartverket</a>'
    }).addTo(map);

    $.getJSON('data/sjernaroy-spot.json', function(data) {
        var markers = [];
        for (var i = 0, len = data.rows.length; i < len; i++) {
            var item = data.rows[i],
                marker = 
            markers.push(L.circleMarker([item.latitude, item.longitude], {
                radius: 3,
                stroke: false,
                fillColor: '#333',
                fillOpacity: 0.8,
                index: i,
                altitude: item.altitude,
                name: item.placename
            }));
        }
        markers = L.featureGroup(markers).addTo(map);

        L.elevationProfile(markers, {
            start: {
                name: 'Oslo',
                latlng: [59.943, 10.768]
            }, 
            end: {
                name: 'Bergen',
                lat: 60.31,
                lng: 5.324,
                //latlng: [60.31, 5.324],
                altitude: 22 // TODO
            }
        }).addTo(map);
    });


});

