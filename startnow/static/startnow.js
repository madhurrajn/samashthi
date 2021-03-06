  angular.module('startnow', [])
  .controller('FetchController', [
    '$scope',
    '$rootScope',
    '$http',
    function($scope, $rootScope,$http){
        console.log($scope);

        $scope.fetch = function(url, orig_lat, orig_lng, dest_lat, dest_lng, method) {
            var localtime = moment().utcOffset();
            $scope.method = 'POST';
            $scope.code = null;
            $scope.response = null;
            $scope.url = '/startnow/'
            var csrftoken = $scope.getCookie('csrftoken')

            $http({method:$scope.method, 
                    url:$scope.url,
                    headers:{'Content-Type':'application/x-www-form-urlencoded'},
                    data:"localtime="+localtime+"&orig_lat="+orig_lat+"&orig_lng="+orig_lng+"&dest_lat="+dest_lat+"&dest_lng="+dest_lng+"&csrfmiddlewaretoken="+csrftoken
                   }).
                then(function(response){
                    $scope.status = response.status;
                    $rootScope.status = response.status;
                    $scope.data = response.data;
                    $scope.sched_lists = response.data.sched_list;
                    buildChart($scope.sched_lists);
                    buildGuage($scope.sched_lists);
                    $scope.sched_lists.forEach(function(elem){
                        console.log(elem)
                    });
                }, function(response){
                    $scope.status = response.status;
                    $scope.data = response.data || "Request Failed";
                });
        };

    $scope.updateModel = function(method, url){
        $scope.method = method;
        $scope.url = url;
    };

    $scope.duration_list = [
        {'value': '2 Hours'},
        {'value': '4 Hours'},
        {'value': '6 Hours'},
        {'value': '8 Hours'},
        {'value': '10 Hours'},
        {'value': '24 Hours'},
        {'value': 'Week'},
    ];

    $scope.initMap = function() {
      var origin_place_id = null;
      var orig_place = null;
      var destination_place_id = null;
      var dest_place = null;
      var travel_mode = google.maps.TravelMode.DRIVING;
      var pos = {lat: 12.9356, lng: 77.7023};
      var map = new google.maps.Map(document.getElementById('map'), {
        mapTypeControl: false,
        zoom: 13,
        center: pos
      });
      if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            map.setZoom(15);
        });
      }
      var directionsService = new google.maps.DirectionsService;
      var directionsDisplay = new google.maps.DirectionsRenderer;
      directionsDisplay.setMap(map);

      var origin_input = document.getElementById('origin-input');
      var destination_input = document.getElementById('destination-input');
      var modes = document.getElementById('mode-selector');

      //map.controls[google.maps.ControlPosition.TOP_LEFT].push(origin_input);
      //map.controls[google.maps.ControlPosition.TOP_LEFT].push(destination_input);
      //map.controls[google.maps.ControlPosition.TOP_LEFT].push(modes);

      var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
      origin_autocomplete.bindTo('bounds', map);
      var destination_autocomplete =
          new google.maps.places.Autocomplete(destination_input);
      destination_autocomplete.bindTo('bounds', map);

      // Sets a listener on a radio button to change the filter type on Places
      // Autocomplete.
      function setupClickListener(id, mode) {
        //var radioButton = document.getElementById(id);
        //radioButton.addEventListener('click', function() {
        //  travel_mode = mode;
        //});
      };
      setupClickListener('changemode-walking', google.maps.TravelMode.WALKING);
      setupClickListener('changemode-transit', google.maps.TravelMode.TRANSIT);
      setupClickListener('changemode-driving', google.maps.TravelMode.DRIVING);

      function expandViewportToFitPlace(map, place) {
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }
      };

      origin_autocomplete.addListener('place_changed', function() {
        var place = origin_autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }
        expandViewportToFitPlace(map, place);

        // If the place has a geometry, store its place ID and route if we have
        // the other place ID
        origin_place_id = place.place_id;
        orig_place = place;
        route(origin_place_id, destination_place_id, travel_mode,
              directionsService, directionsDisplay, orig_place, dest_place);
      });

      destination_autocomplete.addListener('place_changed', function() {
        var place = destination_autocomplete.getPlace();
        if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }
        expandViewportToFitPlace(map, place);

        // If the place has a geometry, store its place ID and route if we have
        // the other place ID
        destination_place_id = place.place_id;
        dest_place = place
        route(origin_place_id, destination_place_id, travel_mode,
              directionsService, directionsDisplay, orig_place, dest_place);
      });

      $scope.getCookie = function(name) {
          var cookieValue = null;
          if (document.cookie && document.cookie != '') {
              var cookies = document.cookie.split(';');
              for (var i = 0; i < cookies.length; i++) {
                  var cookie = jQuery.trim(cookies[i]);
                  // Does this cookie string begin with the name we want?
                  if (cookie.substring(0, name.length + 1) == (name + '=')) {
                      cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                      break;
                  }
              }
          }
          return cookieValue;
      };


      function post_to_url(path, orig_lat, orig_lng, dest_lat, dest_lng, method) {
          method = method || "post"; // Set method to post by default if not specified.

          // The rest of this code assumes you are not using a library.
          // It can be made less wordy if you use one.
          var form = document.createElement("form");
          form.setAttribute("method", method);
          form.setAttribute("action", path);

          var localtime = moment().utcOffset();
          var hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", "localtime");
          hiddenField.setAttribute("value", localtime);
          console.log(localtime);
          form.appendChild(hiddenField);


          var hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", "orig_lat");
          hiddenField.setAttribute("value", orig_lat);
          form.appendChild(hiddenField);

          var hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", "orig_lng");
          hiddenField.setAttribute("value", orig_lng);
          form.appendChild(hiddenField);

          var hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", "dest_lat");
          hiddenField.setAttribute("value", dest_lat);
          form.appendChild(hiddenField);

          var hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", "dest_lng");
          hiddenField.setAttribute("value", dest_lng);
          form.appendChild(hiddenField);

          var csrfField = document.createElement("input");
          var csrftoken = $scope.getCookie('csrftoken')
          console.log("token" + csrftoken)
          csrfField.setAttribute("type", "hidden");
          csrfField.setAttribute("name", "csrfmiddlewaretoken");
          csrfField.setAttribute("value", csrftoken)
          form.appendChild(csrfField)

          document.body.appendChild(form);
          form.submit();
      };


      function route(origin_place_id, destination_place_id, travel_mode,
                     directionsService, directionsDisplay, orig_place, dest_place) {
        if (!origin_place_id || !destination_place_id) {
          return;
        }
        directionsService.route({
          origin: {'placeId': origin_place_id},
          destination: {'placeId': destination_place_id},
          travelMode: travel_mode
        }, function(response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
            for (var i=0, len=response.routes.length; i < len; i++){
                directionsDisplay.setDirections(response);
                console.log(origin_place_id, destination_place_id, orig_place, dest_place);
            }
            $scope.fetch("/startnow/", orig_place.geometry.location.lat(),orig_place.geometry.location.lng(), 
              dest_place.geometry.location.lat(),dest_place.geometry.location.lng(), "post");
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
      }
    };
    var buildGuage = function(sched_list){
        var min_val = 0;
        var max_val = 0;
        var cur_val = 0;
        min_duration = _.pluck(sched_list, 'min_duration');
        max_duration = _.pluck(sched_list, 'max_duration');
        cur_duration = _.pluck(sched_list, 'cur_duration');
        for (var i=0; i<min_duration.length; i++){
            if(min_duration[i] != undefined){
                min_val = min_duration[i]
            }
        }
        for (var i=0; i<max_duration.length; i++){
            if(max_duration[i] != undefined){
                max_val = max_duration[i]
            }
        }
        for (var i=0; i<cur_duration.length; i++){
            if(cur_duration[i] != undefined){
                cur_val = cur_duration[i]
            }
        }
        google.charts.setOnLoadCallback(drawChart);
        function drawChart(){
            cur_val = parseInt(cur_val);
            var data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['Now', cur_val]
            ]);
            min_val = parseInt(min_val)
            max_val = parseInt(max_val)
            var variance = max_val - min_val;
            var variance_segment = variance/3;
            var red_from = min_val + (variance * 2 / 3)
            var red_to = max_val
            var yellow_from = min_val + (variance / 3)
            var yellow_to = min_val + (variance * 2 / 3)
            var options = {
                width: 400, height: 120,
                redFrom: red_from, redTo:red_to,
                yellowFrom : yellow_from, yellowTo: yellow_to,
                min: min_val, max: max_val,
                minorTicks: 5
            };
            var chart = new google.visualization.Gauge(document.getElementById('guage_chart'))
            chart.draw(data, options);
            setInterval(function() {
              data.setValue(0, 1, cur_val);
              chart.draw(data, options);
            }, 1000);
        };
    };
    var buildChart = function(sched_list){
        date_list_1 = _.pluck(sched_list, 'date');
        duration_list_1 = _.pluck(sched_list, 'duration');
        duration_list = [];
        date_list = [];
        for (var i=0;i<duration_list_1.length; i++){
            duration_list_1[i] = parseInt(duration_list_1[i]);
            console.log(duration_list_1[i]);
        }
        for (var i=0; i<duration_list_1.length; i++){
            console.log(duration_list_1[i]);
            duration_list.push(duration_list_1[i]);
            date_list.push(date_list_1[i]);
        }
        console.log(duration_list);
        console.log(date_list);
        $('#chartContainer').highcharts({
            chart: {
                renderTo: 'schedChartContainer',
                type: 'column',
            },  
            title: {
                text: 'Estimated Time'
            },  
            xAxis: {
                type:'datetime',
                categories: date_list
            },  
            yAxis: {
                min: 0,
                title: {
                    text: 'Parameter'
                }   
            },  
            tooltip: {
                formatter: function() {
                    if (this.percentage === 0) return null;
                    return '<b>' + this.x + '</b><br/>' + this.series.name + ': ' + this.y + '<br/>'
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                },  
                series: {
                    pointWidth: 20
                }
            },
            series: [{
                name: 'Duration',
                data:  duration_list,
                color: 'green'
            }],
            loading: false
        });
    };
    $scope.isSchedSet = function(){
        if ($scope.sched_lists){
            return true;
        }
        else
            return false;
    };
    $scope.initMap();
}]);
