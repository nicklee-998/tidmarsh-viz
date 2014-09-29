// JavaScript Document
jQuery(document).ready(function($) {
    $.ajax({
        url : "http://api.wunderground.com/api/21a533a6637f54ab/geolookup/forecast/astronomy/q/MA/manomet.json",
        dataType : "jsonp",
        success : function(parsed_json) {
            var forecast = parsed_json['forecast']['txt_forecast']['forecastday'][0]['fcttext'];
            var sunrise_hour = parsed_json['moon_phase']['sunrise']['hour'];
            var sunrise_minute = parsed_json['moon_phase']['sunrise']['minute'];
            var sunset_hour = parsed_json['moon_phase']['sunset']['hour']; 
            var sunset_minute = parsed_json['moon_phase']['sunset']['minute'];
            var sunrise_sunset = "sunrise: " + sunrise_hour + ":" + sunrise_minute + " / sunset: " + sunset_hour + ":" + sunset_minute;
            $("#forecast").text("Today in bog weather : " + forecast + " | " + sunrise_sunset);
            //$("#sunrise_sunset").text(sunrise_sunset);
        },
        error : function(xhr, textStatus, error) {
            console.log(xhr.statusText);
            console.log(textStatus);
            console.log(error);
            $("#weather").remove();
        }
    });
});