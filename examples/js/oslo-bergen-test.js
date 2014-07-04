$(function () { 

    var map = L.map('map', {
        maxZoom: 17
    }).setView([59.25, 5.84], 12);

    L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom={z}&x={x}&y={y}', {
        attribution: '&copy; <a href="http://kartverket.no/">Kartverket</a>'
    }).addTo(map);

    var url = "http://turban.cartodb.com/api/v2/sql?q=SELECT latitude AS lat, longitude AS lng, altitude AS alt, placename AS name, message_type AS type, timestamp AS time FROM spot WHERE feed_id='oslo-bergen-test' ORDER BY timestamp";
    //var url = "data/oslo-bergen-test.json";


    $.getJSON(url, function(data) {

        /*
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
                altitude: item.altitude || 0,
                name: item.placename
            }));
        }
        markers = L.featureGroup(markers).addTo(map);
        map.fitBounds(markers.getBounds());
        */

        L.elevationProfile(data.rows, {
            start: {
                name: 'Oslo',
                latlng: [59.943, 10.768]
            }, 
            end: {
                name: 'Bergen',
                lat: 60.31,
                lng: 5.324,
                //latlng: [60.31, 5.324],
                alt: 22 // TODO
            }
        }).addTo(map);
    });


});

