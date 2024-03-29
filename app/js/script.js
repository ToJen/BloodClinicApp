var map, infoWindow, currentLocation, currentClinic;

function initMap() {
  var healthScience = {lat: 47.5719363, lng:-52.7419408};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: healthScience
  });

  var marker = new google.maps.Marker({
    position: healthScience,
    map: map
  });

  var currLocImg = "imgs/bluecircle.png";

  infoWindow = new google.maps.InfoWindow;

  /*************************************************************/
  // get current user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log(currentLocation.lat + "\t" + currentLocation.lng);

      var userMarker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        icon: currLocImg
      });

      infoWindow.setPosition(currentLocation);
      infoWindow.setContent('You are here!');
      infoWindow.open(map);
      map.setCenter(currentLocation);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }

  /*************************************************************/
  // show nearest clinic
  // var service = new google.maps.places.PlacesService(map);
  // service.nearbySearch({
  //   location: currentLocation,
  //   radius: 50,
  //   type: ['hospital', 'health', 'doctor']
  // }, callback);

  /*************************************************************/
  // search feature
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) { // no location match
      return;
    }

    // Clear out the old markers
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = "imgs/marker.png";

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));
      currentLocation = place.geometry.location;
      if (place.geometry.viewport) { // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });

  /*************************************************************/
  // cluster clinic locations
  var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var markers2 = locations.map(function(location, i) {
    console.log(location)
    console.log(ids[i])
    let marker = new google.maps.Marker({
      position: location,
      label: ids[i],
      name: names[i]
    });
    marker.addListener('click', function() {
      console.log(marker.label);
      fetchBloodClinicServer();
      plotChart(store['daily_rates'][marker.label]);
      $('#clinicLabel').text(marker.name);
      updateImage(marker.name);
      $("#infoModal").modal("show");
    });
    return marker;
  });

  var markerCluster = new MarkerClusterer(map, markers2,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

}

function callback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

// necessary?
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}

var locations = [
  {lat: 47.5719363, lng: -52.7419408},  // healthScience
  {lat: 47.6102897, lng: -52.7249336},  // majorsPath
  {lat: 47.5574587, lng: -52.7215271},  // stClaresMercy
  {lat: 47.5287682, lng: -52.7496391}   // waterford
];

var ids = [
  'hs',
  'mp',
  'sc',
  'wf'
];

var names = [
  'Health Science Centre',
  'Major\'s Path',
  'St. Claire\'s Hospital',
  'Waterford'
]

// bloodclinicserver
const initialState = {
  current_rate: {
    'hs': null,
    'mp': null,
    'sc': null,
    'wf': null
  },
  daily_rates: {
    'hs': null,
    'mp': null,
    'sc': null,
    'wf': null
  }
}

var store = initialState
// Update wait times
function updateTimes(store) {
  const hs = store.current_rate['hs'] || null
  const sc = store.current_rate['sc'] || null
  const mp = store.current_rate['mp'] || null
  const wf = store.current_rate['wf'] || null
  if (hs) {
    $('#hs').text(hs + ' minutes')
    $('#sc').text(sc + ' minutes')
    $('#mp').text(mp + ' minutes')
    $('#wf').text(wf + ' minutes')
  }
}

// Update data from backend
const fetchBloodClinicServer = () => {
  const uri = 'https://bloodclinicserver.herokuapp.com/api'
  const date = new Date()
  const payload = {'date': date}
  const headers = new Headers({'Content-Type': 'application/json'})
  fetch(uri, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: headers
  })
    .then((response) =>
      response.json())
    .then(json => {
      console.log(store)
      store = json
      console.log(store)
      updateTimes(store)
    })
}

fetchBloodClinicServer()

function updateImage(clinic)
{
  if(clinic == 'Health Science Centre') {
    $('#clinicImg').attr("src","imgs/hs.jpg");
    $('#addr').text(" 300 Prince Philip Dr, St. John's, NL A1B 3V6");
    $('#contact').text(" (709) 777-6300");
  }
  else if(clinic == 'Major\'s Path') {
    $('#clinicImg').attr("src","imgs/mp.jpg");
    $('#addr').text(" 35 Major's Path, St. John's, NL A1A 4Z9");
    $('#contact').text(" (709) 752-3658");
  }
  else if(clinic == 'Waterford') {
    $('#clinicImg').attr("src","imgs/wf.jpg");
    $('#addr').text(" 306 Waterford Bridge Road. St. John's, NL A1E 4J8");
    $('#contact').text(" (709) 777-3300");
  }
  else if(clinic == 'St. Claire\'s Hospital') {
    $('#clinicImg').attr("src","imgs/sc.jpg");
    $('#addr').text("154 Lemarchant Rd, St. John's, NL A1C 2H6");
    $('#contact').text(" (709) 777-5000");
  }
}

/*******************************************************/
// plot chart

function plotChart(data)
{

  const labels = ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm']
  var ctx = document.getElementById("myChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: data.slice(6, 17),
        backgroundColor: "#679ddb"
      }]
    },
    options: {
      legend: { display: false }
    }
  });

  $("#infoModal").on("hidden.bs.modal", function(){
    myChart.destroy();
  });

}
