/*
 * Quake.js
 * For use with Earthquake assignment for Bluewolf
 *
 * Author: Jesse Morin
 * Date: 12/11/2014
*/

// Variables which should be accessible by helper functions without need to pass as a parameter

// Primary map variable
var map;

// Array to store the list of top quakes
var topMarkers = [];

// The icon to be used for markers
var quakeIcon = {
	url: 'style/quakeimage.png',
	  size: new google.maps.Size(32, 32),
	  origin: new google.maps.Point(0, 0),
	  anchor: new google.maps.Point(17, 34),
	  scaledSize: new google.maps.Size(25, 25)
};

// Function to initialize the page and map
function initialize() {
	var markers = [];
	var mapOptions = {
		center: { lat: -34.397, lng: 150.644 },
		zoom: 8,
		disableDefaultUI: true,
		disableDoubleClickZoom: true,
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	var input = document.getElementById('searchboxinput');
	var searchBox = new google.maps.places.SearchBox(input);
	var infoWindow = new google.maps.InfoWindow();
	
	var topQuakeWindow = document.getElementById('largestquakes');
	
	populateTopQuakesContent(map, infoWindow);
	
	// Prevent autocomplete from finding establishments
	var acOptions = {
		types: ['(cities)']
	};
	var autoComplete = new google.maps.places.Autocomplete(input, acOptions);
	
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(topQuakeWindow);
	
	
	google.maps.event.addListener(searchBox, 'places_changed', function() {
		var places = searchBox.getPlaces();

		if (places.length == 0) {
			return;
		}
		for (var i = 0, marker; marker = markers[i]; i++) {
			marker.setMap(null);
		}

		// Create a marker for each returned place
		markers = [];
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0, place; place = places[i]; i++) {
			var image = {
				url: place.icon,
				size: new google.maps.Size(64, 64),
				origin: new google.maps.Point(0, 0),
				anchor: new google.maps.Point(16, 32),
				scaledSize: new google.maps.Size(25, 25)
			};

			var marker = new google.maps.Marker({
				map: map,
				icon: image,
				title: place.name,
				position: place.geometry.location
			});

			markers.push(marker);
			bounds.extend(place.geometry.location);
		}		
		map.fitBounds(bounds);
		
		
		// Query the GeoNames service for nearby earthquakes
		var center = map.getCenter();
		var quakes = "http://api.geonames.org/earthquakesJSON?north=" + (center.lat() + 10) + "&south=" + (center.lat() - 10) + "&east=" + (center.lng() + 10) + "&west=" + (center.lng() - 10) + "&maxRows=500&username=iamscience"
		$.getJSON(quakes, function(data) {
			// Create a marker for each point returned
			$.each(data, function(key, val) {
				if (data.earthquakes.length == 0 ) { return; }
				for (var i = 0; i < data.earthquakes.length; i++) {
					var latlng = new google.maps.LatLng(val[i].lat, val[i].lng);
					var marker = new google.maps.Marker( {
						map: map,
						icon: quakeIcon,
						title: 'Magnitude: ' + val[i].magnitude,
						position: latlng
					});

					markers.push(marker);
					bounds.extend(marker.getPosition());
					
					// When the marker is clicked display an InfoWindow with the quake information at the marker location
					var contentString = '<div id="content">'+
						  '<div id="infoHeading">Earthquake Details</div>'+
						  '<div id="bodyContent">'+
						  '<p>' + 'Date: ' + val[i].datetime + '<br>' + 'Magnitude: ' + val[i].magnitude + '<br>' + 'Depth: ' + val[i].depth + '</p>' +
						  '</div>'+
						  '</div>';
					google.maps.event.addListener(marker, 'click', clickMarker(marker, contentString, infoWindow));
				}
			});
		});
		
		map.fitBounds(bounds);
		map.setZoom(8);
	});
}
google.maps.event.addDomListener(window, 'load', initialize);

// Function to pre-populate the 10 largest earthquakes
function populateTopQuakesContent(map, infoWindow) {
	// Query GeoNames for top 10 magnitude earthquakes in last 12 months
	var date = new Date();
	var yyyy = date.getFullYear().toString();                                    
	var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based         
	var dd  = date.getDate().toString();
	
	// Make sure the date string is formatted correctly before submitting JSON request
	var datefinal = yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
	
	var topquakes = "http://api.geonames.org/earthquakesJSON?north=90&south=-90&east=-90&west=90&username=iamscience&date=" + datefinal;
	$.getJSON(topquakes, function(data) {
		$.each(data, function(key, val) {
			if (data.earthquakes.length == 0) { return; }						
			var topquakeContent = '<div id="topQuakeContent" ><center><div id="topQuakeHeader" onclick="toggleTopQuakeDisplay()">Click to Expand<br><h2>Largest Quakes in last 12 Months</h2></div><div id="topQuakeList" style="height:0px;"><p>'
			for (var i = 0; i < data.earthquakes.length; i++) {
				var marker = new google.maps.Marker( {
					map: map,
					icon: quakeIcon,
					title: 'Magnitude: ' + val[i].magnitude,
					position: new google.maps.LatLng(val[i].lat, val[i].lng)
				});
				
				topMarkers.push(marker);
				
				topquakeContent += '<div name="topQuakeList" onclick="selectTopMarker(' + i + ')" style="visibility:hidden">' + (i + 1) + ': ' + val[i].datetime + '<br>Magnitude: ' + val[i].magnitude + '</div><br>';

				var contentString = '<div id="content">'+
				  '<div id="infoHeading">Earthquake Details</div>'+
				  '<div id="bodyContent">'+
				  '<p>' + 'Date: ' + val[i].datetime + '<br>' + 'Magnitude: ' + val[i].magnitude + '<br>' + 'Depth: ' + val[i].depth + '</p>' +
				  '</div>'+
				  '</div>';
				google.maps.event.addListener(marker, 'click', clickMarker(marker, contentString, infoWindow));
			}
			topquakeContent += '</p></div></center></div>'
			document.getElementById('largestquakes').innerHTML = topquakeContent;
		});
	});
}

// Marker click function to handle InfoWindow updates
function clickMarker(marker, contentString, infoWindow) {
	return function () {
		infoWindow.setContent (contentString);
		infoWindow.open(map, marker);
	}
}

// Function used when clicking items in the Largest Earthquakes list
function selectTopMarker(i) {
	google.maps.event.trigger(topMarkers[i], "click");
	map.setCenter(topMarkers[i].getPosition())
}

// Expands or shrinks the Largest Quakes window on click
function toggleTopQuakeDisplay() {
	var quakeContent = document.getElementsByName('topQuakeList');
	
	if (quakeContent[0].style.visibility == "visible") {	
		for (var i = 0; i < quakeContent.length; i++) {
			quakeContent[i].style.visibility = "hidden";
			quakeContent[i].style.height = "0px";
			document.getElementById('topQuakeList').style.height = "0px";
		}
	}
	else {
		for (var i = 0; i < quakeContent.length; i++) {
			quakeContent[i].style.visibility = "visible";
			quakeContent[i].style.height = "auto";
			document.getElementById('topQuakeList').style.height = "auto";
		}
	}
}