$(document).ready(function () {
    var app = {
        // Initialize Firebase
        config: {
            apiKey: "AIzaSyAfBYczMzjAWVxeckDjYLrb2iYlHgr2xk8",
            authDomain: "find-my-event-1545521790660.firebaseapp.com",
            databaseURL: "https://find-my-event-1545521790660.firebaseio.com",
            projectId: "find-my-event-1545521790660",
            storageBucket: "find-my-event-1545521790660.appspot.com",
            messagingSenderId: "28890143775"
        },
        database: undefined,
        databaseRef: undefined,
        userName: "",

        // Eventful API Config
        radius: 30,
        numResults: 12,
        numEventsPerRow: 6,
        startDate: undefined,
        stopDate: undefined,
        dateRange: undefined,
        eventfulAPIKey: "r2vFfFjjZFBGm9D5",
        eventArray: [],
        savedArray: [],
        savedKeys: [],
        savedEventIds: [],

        // CORS proxy server
        proxyURL: "https://cors-anywhere.herokuapp.com/",

        // Eventful Search Function
        searchEvents: function () {
            var eventfulSearchURL = "https://api.eventful.com/json/events/search?app_key=" + app.eventfulAPIKey + "&where=" + pos.lat + "%2C" + pos.lng + "&within=" + app.radius + "&page_size=" + app.numResults + "&date=" + app.dateRange + "&sort_order=popularity";

            // Eventful API AJAX Call
            $.ajax({
                url: app.proxyURL + eventfulSearchURL,
                method: "GET",
                dataType: "json",
                crossDomain: true
            }).done(function (response) {

                // AJAX Call Response Event Array & Append Arguments Function
                app.eventArray = response.events.event;
                app.eventAppend(app.eventArray);
            });
        },
        // Append Arguments To The DOM Function
        eventAppend: function (array) {

            // Empty Events Div
            $("#events").empty();

            // Row # Variable
            var rowNum = 0;


            // Build and append event divs from array argument (For Each Statement)
            array.forEach(function (item, index) {

                // Create New Row If Needed
                if (index % app.numEventsPerRow === 0) {
                    var rowDiv = $("<div>");
                    rowDiv.addClass("row");
                    rowNum = (index / app.numEventsPerRow) + 1;
                    rowDiv.attr("id", "eventRow" + rowNum);
                    $("#events").append(rowDiv);
                };

                // Declare and set variables
                var title = item.title;
                var placeURL = item.venue_url;
                var description = item.description;
                var eventStart = item.start_time;
                var start_time = moment(eventStart, 'YYYY/MM/DD HH:ss:ss').format("M/DD h:mm a");
                var eventStop = item.stop_time;
                var stop_time = moment(eventStop, 'YYYY/MM/DD HH:ss:ss').format("M/DD h:mm a");
                var endLat = item.latitude;
                var endLong = item.longitude;

                // Set Width For Divs (Bootsrap Columns)
                var numCols = Math.ceil(12 / app.numEventsPerRow);

                // Event Info Variables
                var totEventDiv = $("<div>").addClass("col-md-" + numCols + " eventCont");
                var eventDiv = $("<div>").addClass("location");
                var title_p = $("<p>").text(title);
                var eventStart_p = $("<p>").text("Start: " + start_time);
                var eventStop_p = $("<p>");

                // Determine if event ends text is required?
                if (item.stop_time != null) {
                    eventStop_p.text("End: " + stop_time);
                } else {
                    eventStop_p.text("");
                };
                var eventImg = $("<img>");

                // Depending on arguments passed dispaly propper image
                if (item.image === null || item.images === null) {
                    var eventImgURL = "assets/img/placeholder.png"
                }
                else if (array === app.savedArray) {

                    // Remove Events Button
                    eventDiv.attr("id", app.savedKeys[index]);
                    var remBtn = $("<button>");
                    remBtn.attr("data-key", app.savedKeys[index]);
                    remBtn.attr("class", "btn btn-default btn-sm remove")
                    remBtn.text("Remove");

                    // Mutliple Imagages If Else Statement
                    if (item.images.image[0] === undefined) {
                        var eventImgURL = "https://" + item.images.image.medium.url.replace("http:", "").replace("https:", "").replace("//", "");
                    } else {
                        var eventImgURL = "https://" + item.images.image[0].medium.url.replace("http:", "").replace("https:", "").replace("//", "");
                    };
                } else {
                    var eventImgURL = "https://" + item.image.medium.url.replace("http:", "").replace("https:", "").replace("//", "");
                };

                // Image and div elements required attributes
                eventImg.attr("src", eventImgURL);
                eventDiv.attr("data-eventID", item.id)
                    .attr("data-loc", endLat + "," + endLong)
                    .attr("data-target", "#myModal")
                    .attr("data-toggle", "modal")
                    .attr("data-title", title)
                    .attr("data-start", eventStart)
                    .attr("data-end", eventStop)
                    .attr("data-url", placeURL)
                    .attr("data-description", description);
                // builds the div to hold the event information
                eventDiv.append(eventImg, title_p, eventStart_p, eventStop_p);

                // Determine if remove event button is needed and build final div
                if (remBtn === undefined) {
                    totEventDiv.append(eventDiv);
                } else {
                    totEventDiv.append(eventDiv, remBtn);
                };
                // Append Div to Correct Row
                $("#eventRow" + rowNum).append(totEventDiv);
            });
        },

        // Count Saved Events Function
        savedEvents: function () {
            $("#savedEvents").attr("data-status", "saved");
            app.databaseRef.on("value", function (snap) {
                if ($("#savedEvents").attr("data-status") === "saved") {
                    $("#savedEvents").text("Saved Events: " + snap.numChildren());
                };
            });
        },

        // Get Saved Firebase Events Function
        getEvents: function (eventfulID) {
            var eventfulGetURL = "https://api.eventful.com/json/events/get?app_key=" + app.eventfulAPIKey + "&id=" + eventfulID;

            // Eventful API AJAX Call
            $.ajax({
                url: app.proxyURL + eventfulGetURL,
                method: "GET",
                dataType: "json",
                crossDomain: true,
                async: false,
            }).done(function (response) {

                // Push events returned into array
                app.savedArray.push(response);
            });

            // Call eventAppend function (completed array argument)
            app.eventAppend(app.savedArray);
        }
    };

    // Initialize Firebase
    firebase.initializeApp(app.config);
    app.database = firebase.database();

    // User Input On Click Event
    $("#init-button").on("click", function (event) {
        event.preventDefault();

        // User Input Name
        app.userName = $("#name-input").val().trim();

        // Set reference location for saved events
        app.databaseRef = app.database.ref("/" + app.userName);

        // User Input Date Range
        app.startDate = moment($("#start-input").val(), "MM-DD-YYYY h:mm A").format("YYYYMMDD");
        app.stopDate = moment($("#stop-input").val(), "MM-DD-YYYY h:mm A").format("YYYYMMDD");

        // Set Date Range From User Input
        if (app.startDate === "Invalid date" || app.stopDate === "Invalid date") {
            app.dateRange = "Future";
        } else {
            app.dateRange = app.startDate + "00-" + app.stopDate + "00";
        };

        // Confirm User Input
        if (app.userName != "") {

            // Call Event Search Function
            app.searchEvents();

            // Call Saved Events Function
            app.savedEvents();
        };
    });

    // Display Saved Or New Events On Click Event
    $("#savedEvents").on("click", function () {
        if ($(this).attr("data-status") === "saved") {

            // Clear Saved Data
            app.savedKeys = [];
            app.savedArray = [];
            app.savedEventIds = [];

            // Build Firebase Saved Keys Array & Send Stored Events Into Saved Events Array
            app.databaseRef.on("child_added", function (shot) {
                app.savedKeys.push(shot.key);
                app.savedEventIds.push(shot.val().eventID);
            });

            // Build Saved Array
            // Send Saved Event IDs To Get Events Function
            app.savedEventIds.forEach(function (element) {
                app.getEvents(element);
            });

            // Change Button (Save To Refresh)
            $(this).attr("data-status", "refresh");
            $(this).text("Refresh");
        } else {
            app.eventAppend(app.eventArray);
            app.savedEvents();
        };
    });

    $("#about-button").on("click", function() {
        var newP = $("<p>").text("Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis, quo! Ad delectus voluptas obcaecati eos repudiandae quaerat quasi mollitia iusto sint incidunt sunt impedit cupiditate error repellendus, cum magnam fuga.");
        newP.addClass("text-center")
            .addClass("new-p");
        $(".about").append(newP);
        // ID and append
        $("#about-button").fadeOut("slow");
      });

    // Save To Firebase On Click Event
    $("#save-event").on("click", function () {

        // Clear Saved Events IDs Array
        app.savedEventIds = [];

        // Access Firebase DB
        app.databaseRef.on("value", function (snapshot) {

            // Local Array of Saved Event IDs For Each Statement
            snapshot.forEach(function (item) {
                app.savedEventIds.push(item.val().eventID);
            });

            // Pull Event IDs From Active Modal
            var x = $("#modal-label").data("eventid");

            // Determine If (Already Saved Events)
            // If Not (Push To Firebase)
            if (app.savedEventIds.indexOf(x) === -1) {
                app.databaseRef.push({
                    eventID: x
                });
            };
        });
    });

    // Remove Events On Click Function
    $(document).on("click", ".remove", function () {

        // Stored Event Data Key Attribute
        var k = $(this).attr("data-key");

        // Remove Correct Event
        app.databaseRef.child(k).remove();

        // Get Saved Key Index
        var i = app.savedKeys.indexOf(k);

        // Remove Correct Event From Saved Array & Keys
        app.savedArray.splice(i, 1);
        app.savedKeys.splice(i, 1);

        // Send & Display Remaining Saved Events
        app.eventAppend(app.savedArray);
    });

});

// Eventful & Google Maps Global Variables
var pos = {};
var savedEventsRef;
var map;
var infoWindow;

// Initailize Google Maps
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {

        // Zoom In User Location
        center: { lat: 0, lng: 0 },
        zoom: 1
    });

    // Night Time Map Style
    var styles = [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }]
        },
        {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }]
        },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }]
        },
        {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }]
        },
        {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2835' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }]
        },
        {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }]
        },
        {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
        },
        {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }]
        },
        {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }]
        }
    ]

    // Night Time Display
    var mapOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: styles
    };

    // Daytime Display
    var retro = {
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    // Time of Day
    var currentTime = moment();

    // Day & Night Times
    var morning = moment("07:00:00", "hh:mm:ss");
    var night = moment("18:00:00", "hh:mm:ss");

    // If Else Day/Night Display
    if (currentTime.isBetween(morning, night)) {
        map.setOptions(retro);
    } else {
        map.setOptions(mapOptions);
    }

    // Google Maps Dispay
    infoWindow = new google.maps.InfoWindow;

    // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Set Info Window Position
            infoWindow.setPosition(pos);

            // Google Directions Variables
            var directionsDisplay = new google.maps.DirectionsRenderer({
                map: map,
            });
            var directionsService = new google.maps.DirectionsService();
            directionsDisplay.setMap(map);
            directionsDisplay.setPanel(document.getElementById('right-panel'));

            // Update Modal Event Info On Click Event
            $(document).on("click", ".location", function () {

                // Show Modal First Then Request Directions
                $('#myModal').modal('show');

                var request = {
                    destination: $(this).attr("data-loc"),
                    origin: pos,
                    travelMode: 'DRIVING'
                };

                // Event Specific Data Attributes
                var modalEventId = $(this).data("eventid");
                var modalTitle = $(this).data("title");
                var modalURL = $(this).data("url");
                var modalStart = $(this).data("start");
                var modalEnd = $(this).data("end");
                var modalDescription = $(this).data("description");
                var latLong = $(this).data("data-loc");

                // Resize Google Maps Modal Function
                $("#myModal").on("shown.bs.modal", function (e) {

                    google.maps.event.trigger(map, "resize");

                    // Center User Location
                    map.setCenter(pos);

                    // Locate User Zoom
                    map.setZoom(10);

                    // Posistion Marker
                    var marker = new google.maps.Marker({
                        position: pos,
                        map: map
                    });

                    // Modal Title
                    $("#modal-label").data("eventid", modalEventId).text(modalTitle);

                    // Run Maps URL Funcion On Click
                    $("#map").on("click", function () {

                        // Maps URL, Users Lat & Long and Destination Lat & Long Variable
                        var googleURL = "https://www.google.com/maps/dir/?api=1&origin=" + pos.lat + "," + pos.lng + "&destination=" + request.destination;

                        // Display Destination Directions
                        window.location.href = googleURL;
                    });




                    // Event Start & End Times
                    var timeStart = moment(modalStart, 'YYYY/MM/DD HH:ss:ss').format("dddd, MMMM Do YYYY, h:mm a");
                    var timeEnd = moment(modalEnd, 'YYYY/MM/DD HH:ss:ss').format("dddd, MMMM Do YYYY, h:mm a");

                    // No Event End Time If Statement
                    if (timeEnd === "Invalid date") {
                        $("#time").html(timeStart + " - " + " Until");
                    } else if (timeStart === "Invalid date") {
                        $("#time").html(timeStart + " - " + " Anytime");

                        // No Event Start Time?
                        $("#time").html(timeStart + " - " + timeEnd)
                    } else {

                        // Add Time to DOM
                        $("#time").html(timeStart + " - " + timeEnd)
                    };

                    // Venue Website
                    $("#button-url").text("Venue Website");
                    $("#button-url").click(function () {
                        window.location.href = modalURL;
                    });

                    // Venue Description
                    if (modalDescription === undefined) {
                        $("#info").text("");
                    } else {
                        $("#info").text(modalDescription);
                    };
                });

                // Directions Service Request
                directionsService.route(request, function (response, status) {
                    if (status == 'OK') {

                        // Display Route
                        directionsDisplay.setDirections(response);
                    }
                });
            });

            // Error Function
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Geolocation Support?
        handleLocationError(false, infoWindow, map.getCenter());
    };
};

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
};