/**
 * Created by marian_mcpartland on 15/3/12.
 */
function UiPowerViewMenu(cname)
{
	// 菜单状态，也是发送消息的格式
	var menu_state = {
		year: 2015,
		month: 2,
		type: POWER_MENU_CHARGING,
		weather: {
			sunrisesunset: 0,
			clear: 0,
			cloud: 0,
			rain: 0,
			snow: 0,
			visibility: 0,
			temprature: 0
		}
	};

	var month_list = new Array();
	var month_index = 0;
	d3.csv("./res/data_power/list.csv", function(csv) {

		if(csv.length > 0) {
			month_list = csv;
			month_index = csv.length - 1;
		}
	});

	$("#" + cname).append("<div id='powermenu_container'></div>");

	$("#powermenu_container").append("<img id='powermenu_left' class='powermenu_left' src='./images/btn_left.png'/>");
	$("#powermenu_container").append("<img id='powermenu_right' class='powermenu_right' src='./images/btn_right.png'/>");
	$("#powermenu_container").append("<div id='powermenu_date'>2015.2</div>");
	$("#powermenu_container").append("<div id='powermenu_type'>Charging</div>");

	$("#powermenu_container").append("<div id='pmenu_sunrise_sunset' class='powermenu_weather'>SUNRISE / SUNSET</div>");
	$("#powermenu_container").append("<div id='pmenu_clear' class='powermenu_weather'>CLEAR</div>");
	$("#powermenu_container").append("<div id='pmenu_cloud' class='powermenu_weather'>CLOUD</div>");
	$("#powermenu_container").append("<div id='pmenu_rain' class='powermenu_weather'>RAIN</div>");
	$("#powermenu_container").append("<div id='pmenu_snow' class='powermenu_weather'>SNOW</div>");
	$("#powermenu_container").append("<div id='pmenu_visibility' class='powermenu_weather'>VISIBILITY</div>");
	$("#powermenu_container").append("<div id='pmenu_temprature' class='powermenu_weather'>TEMPRATURE</div>");
	var weatherButtons = [$("#pmenu_sunrise_sunset"), $("#pmenu_clear"),
		$("#pmenu_cloud"), $("#pmenu_rain"),
		$("#pmenu_snow"), $("#pmenu_visibility"), $("#pmenu_temprature")];

	for(var i = 0; i < weatherButtons.length; i++) {
		var menu = weatherButtons[i];
		menu.css("top", i * 40 + 150);
		menu.click(_onWeatherClick);
	}

	// Select View Month
	$("#powermenu_left").click(function() {
		var idx = month_index - 1;
		if(idx >= 0) {
			$("#powermenu_date").text(month_list[idx].year + "." + month_list[idx].month);
			month_index--;

			// ------------------------
			// Send menu change event
			// ------------------------
			menu_state.year = month_list[idx].year;
			menu_state.month = month_list[idx].month;
			jQuery.publish(POWERMENU_CHANGE, menu_state);
		}
	});

	$("#powermenu_right").click(function() {
		var idx = month_index + 1;
		if(idx < month_list.length) {
			$("#powermenu_date").text(month_list[idx].year + "." + month_list[idx].month);
			month_index++;

			// ------------------------
			// Send menu change event
			// ------------------------
			menu_state.year = month_list[idx].year;
			menu_state.month = month_list[idx].month;
			jQuery.publish(POWERMENU_CHANGE, menu_state);
		}
	});

	// Select View Type: Charging / Running
	$("#powermenu_type").click(function() {

		var newtype;
		var newlabel;
		if($("#powermenu_type").html() == "Charging") {
			newtype = POWER_MENU_RUNNING;
			newlabel = "Running";
		} else {
			newtype = POWER_MENU_CHARGING;
			newlabel = "Charging";
		}

		if(newtype != menu_state.type) {
			$("#powermenu_type").text(newlabel);
			menu_state.type = newtype;

			// ------------------------
			// Send menu change event
			// ------------------------
			jQuery.publish(POWERMENU_CHANGE, menu_state);
		}
	});

	// Select Weather
	function _onWeatherClick(evt) {

		for(var i = 0; i < weatherButtons.length; i++) {
			var menu = weatherButtons[i];
			if(menu.attr("id") == evt.currentTarget.id) {

				switch(evt.currentTarget.id) {
					case "pmenu_sunrise_sunset":
						menu_state.weather.sunrisesunset = !menu_state.weather.sunrisesunset;
						if(menu_state.weather.sunrisesunset == 1) {
							menu.toggleClass("powermenu_weather_selected");
						} else {
							menu.removeClass("powermenu_weather_selected");
						}
						break;
					case "pmenu_clear":
						menu_state.weather.clear = !menu_state.weather.clear;
						if(menu_state.weather.clear == 1) {
							menu.toggleClass("powermenu_weather_selected");
						} else {
							menu.removeClass("powermenu_weather_selected");
						}
						break;
					case "pmenu_cloud":
						menu_state.weather.cloud = !menu_state.weather.cloud;
						if(menu_state.weather.cloud == 1) {
							menu.toggleClass("powermenu_weather_selected");
						} else {
							menu.removeClass("powermenu_weather_selected");
						}
						break;
					case "pmenu_rain":
						menu_state.weather.rain = !menu_state.weather.rain;
						if(menu_state.weather.rain == 1) {
							menu.toggleClass("powermenu_weather_selected");
						} else {
							menu.removeClass("powermenu_weather_selected");
						}
						break;
					case "pmenu_snow":
						menu_state.weather.snow = !menu_state.weather.snow;
						if(menu_state.weather.snow == 1) {
							menu.toggleClass("powermenu_weather_selected");
						} else {
							menu.removeClass("powermenu_weather_selected");
						}
						break;
					case "pmenu_visibility":
						menu_state.weather.visibility = !menu_state.weather.visibility;
						if(menu_state.weather.visibility == 1) {
							menu.toggleClass("powermenu_weather_selected");
						} else {
							menu.removeClass("powermenu_weather_selected");
						}
						break;
					case "pmenu_temprature":
						menu_state.weather.temprature = !menu_state.weather.temprature;
						if(menu_state.weather.temprature == 1) {
							menu.toggleClass("powermenu_weather_selected");
						} else {
							menu.removeClass("powermenu_weather_selected");
						}
						break;
					default:
						break;
				}

				break;
			}
		}

		// ------------------------
		// Send menu change event
		// ------------------------
		jQuery.publish(POWERMENU_CHANGE, menu_state);
	}

	// 2D/3D button
	$("#powermenu_container").append("<div id='pmenu_2d3d' class='powermenu_2d3d'>2D</div>");
	$("#pmenu_2d3d").css("top", window.innerHeight-240);
	$("#pmenu_2d3d").click(function() {

		var newtype;
		var newlabel;
		if($("#pmenu_2d3d").html() == "3D") {
			newtype = "3D";
			newlabel = "2D";
		} else {
			newtype = "2D";
			newlabel = "3D";
		}
		$("#pmenu_2d3d").text(newlabel);

		// ------------------------
		// Send menu change event
		// ------------------------
		jQuery.publish(POWERMENU_2D_3D, newtype);
	});

	// Statistic Data Panel
	$("#powermenu_container").append("<div id='pmenu_statistic'></div>");
	$("#pmenu_statistic").append("<p id='sta_daynight'></p>")
	$("#pmenu_statistic").append("<p id='sta_charge_day'></p>");
	$("#pmenu_statistic").append("<p id='sta_charge_clear'></p>");
	$("#pmenu_statistic").append("<p id='sta_charge_cloudy'></p>");
	$("#pmenu_statistic").append("<p id='sta_charge_rain'></p>");
	$("#pmenu_statistic").append("<p id='sta_charge_snow'></p>");

	$(window).resize(function() {
		$("#pmenu_2d3d").css("top", window.innerHeight-240);
	});

	// ------------------------
	// Send Default Event
	// ------------------------
	$("#pmenu_sunrise_sunset").toggleClass("powermenu_weather_selected");
	menu_state.weather.sunrisesunset = 1;
	jQuery.publish(POWERMENU_CHANGE, menu_state);
}

UiPowerViewMenu.prototype.showStatisticData = function(dobj)
{
	var str = "Daytime: " + (dobj.daytime * 100).toFixed(2) + "%, Nighttime: " + (dobj.nighttime * 100).toFixed(2) + "%";
	$("#sta_daynight").text(str);
	str = "Charging happened in DAYTIME: " + (dobj.charge_day * 100).toFixed(2) + "%";
	$("#sta_charge_day").text(str);
	str = "Charging in CLEAR: " + (dobj.charge_clear * 100).toFixed(2) + "%";
	$("#sta_charge_clear").text(str);
	str = "Charging in CLOUDY: " + (dobj.charge_cloudy * 100).toFixed(2) + "%";
	$("#sta_charge_cloudy").text(str);
	str = "Charging in RAIN: " + (dobj.charge_rain * 100).toFixed(2) + "%";
	$("#sta_charge_rain").text(str);
	str = "Charging in SNOW: " + (dobj.charge_snow * 100).toFixed(2) + "%";
	$("#sta_charge_snow").text(str);

}

UiPowerViewMenu.prototype.showMe = function()
{

}

UiPowerViewMenu.prototype.hideMe = function()
{

}