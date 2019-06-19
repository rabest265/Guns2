var mapboxAccessToken = API_KEY;
var ShootList = ["mass shooting", "no injuries", "injuries only", "some dead"]


// L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
//     id: 'mapbox.light'
// }).addTo(map);

var positron = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap, ©CartoDB'
});//.addTo(map);

// Create a new map
var myMap = L.map("map", {
  center: [
    37.09, -95.71
  ],
  zoom: 4,
  layers: [positron]
});

var url = "/jsonifiedstates";
d3.json(url, function(response) {

  for (var i = 0; i < response.length; i++) {
    var state  = response[i].state.toLowerCase();
    var population = response[i]['pop_estimate_2015'];
    var income = response[i]['2015_median_income'];

    for (var j = 0; j< statesData.features.length; j++) {
      if (state == statesData.features[j].properties.name.toLowerCase()) {
        statesData.features[j]["population"] = population;
        statesData.features[j]["income"] = income;
      }
    }  
  }


  function getColor(d) {
    var myColor = d3.scaleSequential().domain([1,8]).interpolator(d3.interpolatePuBu);
    return d > 75 ? myColor(8) ://'#000099' :
          d > 65  ? myColor(7) ://'#0000cc' :
          d > 60  ? myColor(6) ://'#0000ff' :
          d > 55  ? myColor(5) ://'#3333ff' :
          d > 50  ? myColor(4) ://'#6666ff' :
          d > 45  ? myColor(3) ://'#9999ff' :
          d > 40  ? myColor(2) ://'#ccccff' :
                    myColor(1);//'#e6e6ff';
  }

  

  function style(data) {
    return {
        fillColor: getColor(data.income/1000),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '',
        fillOpacity: 0.5
    };
  }


  function highlightFeature(e) {
    var layer = e.target;
  
    layer.setStyle({
        weight: 1,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
  
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    info.update(layer.feature)
  }

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
  }

  

  function zoomToFeature(e) {
    myMap.fitBounds(e.target.getBounds());
  }

  function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
  }

  var geojson = L.geoJson(statesData, {
      style: style,
      onEachFeature: onEachFeature
  }).addTo(myMap);

  var info = L.control({position: 'bottomleft'});

  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      this.update();
      return this._div;
  };

  // method that we will use to update the control based on features passed
  info.update = function (feat) {
      this._div.innerHTML = '<h4>2015 US Median Income</h4>' +  (feat ?
          '<b>' + feat.properties.name + '</b><br />' + feat.income/1000 + 'K median income'
          : '<br>Hover over a state');
  };

  

  var legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {
  
      var div = L.DomUtil.create('div', 'info legend'),
          grades = [0, 40, 45, 50, 55, 60, 65, 75];
          // labels = [];
  
      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
              grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + 'K<br>' : 'K +');
      }
  
      return div;
  };
  info.addTo(myMap);
  legend.addTo(myMap);

  

  // Assemble guns URL
  var yr=2014;

  
  getViolence(yr);

function getViolence(yr){

  var newurl = "/jsonifiedguns/"+yr;
  // Grab the data with d3
  $('.mapstat').html("Loading "+yr+" data...");
  d3.json(newurl, function(response2) {
    var markers = L.markerClusterGroup();
    var len=response2.length;
    response2.forEach(function(el,i){
        var loc = [+el.latitude,+el.longitude];
        var mstr=el.incident_characteristics || "";
        mstr=mstr.split("||").join("</br>");
        var dt = el.date;
        // Check for location property
        if (el.latitude) {

          // Add a new marker to the cluster group and bind a pop-up
          markers.addLayer(L.marker(loc)
            .bindPopup("<h3><span>"+dt+"</span><br>"+el.n_killed+" killed<br>"+el.n_killed+" injured</h3>"+mstr));
        }
      });

    myMap.addLayer(markers);
    $('.mapstat').html(len+" incidents in "+yr);

    // Define a baseMaps object to hold our base layers
    // var baseMaps = {
    //   "Map": positron
    // };

    // var overlayMaps = {};
    // overlayMaps[yr+" Incidents"]= markers;
    

    // var options = {
    //   collapsed: false
    // };

    // Create a layer control containing our baseMaps
    //var layerscontrol=L.control.layers(baseMaps, overlayMaps, options).addTo(myMap);

    $('ul.yearbtns li').off('mousedown touchstart').on('mousedown touchstart',function(e){
        e.preventDefault();
        $(this).addClass('mactive').siblings('li').removeClass('mactive');
        myMap.removeLayer(markers);
        markers=undefined;
        getViolence($(this).text());
    });
    
  });

  }
})