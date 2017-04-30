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

  /* var infoText = "................";
   * var clinicInfo = new google.maps.InfoWindow({
   *   content: infoText,
   *   maxWidth: 400
   * });

   * marker.addListener('click', function() {
   *   clinicInfo.open(map, marker);
   *   alert("demo");
   * });*/

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
                /*{
                  url: place.icon,
                  size: new google.maps.Size(71, 71),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(17, 34),
                  scaledSize: new google.maps.Size(25, 25)
                };*/

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
        label: ids[i]
      });
    marker.addListener('click', function() {
      console.log(marker.label);
      fetchBloodClinicServer();
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
    })
}

fetchBloodClinicServer()

function launchModal() {

}

function setModalTitle()
{
  if(currentLocation.lat == 47.5719363 && currentLocation.lng == -52.7419408) {
    currentClinic = "HS";
  } else if(currentLocation.lat == 47.6102897 && currentLocation.lng == -52.7249336) {
    currentClinic = "MP";
  } else if(currentLocation.lat == 47.5574587 && currentLocation.lng == -52.7215271) {
    currentClinic = "SC";
  } else if(currentLocation.lat == 47.5287682 && currentLocation.lng == -52.7496391) {
    currentClinic = "WF";
  } else currentClinic = "none";

  console.log(currentClinic);
}

setModalTitle();

  // {47.5719363, -52.7419408},  // healthScience
  // {47.6102897, -52.7249336},  // majorsPath
  // {47.5574587, -52.7215271},  // stClaresMercy
  // {47.5287682, -52.7496391}   // waterford