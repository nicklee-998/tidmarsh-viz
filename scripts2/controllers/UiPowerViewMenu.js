/**
 * Created by marian_mcpartland on 15/3/12.
 */
function UiPowerViewMenu(cname)
{
	var menu_state = {
		year: 2015,
		month: 2,
		type: POWER_MENU_CHARGING,
		weather: POWER_MENU_NONE
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

	$("#powermenu_container").append("<div id='pmenu_sunrise_sunset' class='powermenu_weather'>Sunrise / Sunset</div>");
	$("#powermenu_container").append("<div id='pmenu_clear' class='powermenu_weather'>Clear</div>");
	$("#powermenu_container").append("<div id='pmenu_cloud' class='powermenu_weather'>Cloud</div>");
	$("#powermenu_container").append("<div id='pmenu_rain' class='powermenu_weather'>Rain</div>");
	$("#powermenu_container").append("<div id='pmenu_snow' class='powermenu_weather'>Snow</div>");
	$("#powermenu_container").append("<div id='pmenu_none' class='powermenu_weather'>None</div>");
	var weatherButtons = [$("#pmenu_sunrise_sunset"), $("#pmenu_clear"),
		$("#pmenu_cloud"), $("#pmenu_rain"),
		$("#pmenu_snow"), $("#pmenu_none")];

	for(var i = 0; i < weatherButtons.length; i++) {
		var menu = weatherButtons[i];
		menu.css("top", i * 40 + 150);
		menu.click(_onWeatherClick);
	}
	// default select none
	$("#pmenu_none").toggleClass("powermenu_weather_selected");

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

		for(var i = 0; i <weatherButtons.length; i++) {
			var menu = weatherButtons[i];
			menu.removeClass("powermenu_weather_selected");
		}
		$("#" + evt.currentTarget.id).toggleClass("powermenu_weather_selected");

		var newweather;
		switch(evt.currentTarget.id) {
			case "pmenu_sunrise_sunset":
				newweather = POWER_MENU_SUNRISE_SUNSET;
				break;
			case "pmenu_clear":
				newweather = POWER_MENU_CLEAR;
				break;
			case "pmenu_cloud":
				newweather = POWER_MENU_CLOUD;
				break;
			case "pmenu_rain":
				newweather = POWER_MENU_RAIN;
				break;
			case "pmenu_snow":
				newweather = POWER_MENU_SNOW;
				break;
			case "pmenu_none":
				newweather = POWER_MENU_NONE;
				break;
			default:
				break;
		}

		if(newweather != menu_state.weather) {

			menu_state.weather = newweather;

			// ------------------------
			// Send menu change event
			// ------------------------
			jQuery.publish(POWERMENU_CHANGE, menu_state);
		}
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

	$(window).resize(function() {
		$("#pmenu_2d3d").css("top", window.innerHeight-240);
	});

	// ------------------------
	// Send Default Event
	// ------------------------
	jQuery.publish(POWERMENU_CHANGE, menu_state);
}

UiPowerViewMenu.prototype.showMe = function()
{

}

UiPowerViewMenu.prototype.hideMe = function()
{

}