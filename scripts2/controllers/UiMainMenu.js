/**
 * Created by marian_mcpartland on 15/1/7.
 */
function UiMainMenu()
{
	// bottom line
	$("#mainmenu").append("<div class='mainmenu_bottomline'></div>");
	// selector
	$("#mainmenu").append("<div id='mainmenu_selector' class='mainmenu_selector'></div>");
	// logo
	$("#mainmenu").append("<img class='mainmenu_logo' src='./images/mainmenu_logo.png'></img>");
	// first level four button
	$("#mainmenu").append("<img id='mainmenu_btn_begin' class='mainmenu_button_first' src='./images/mainmenu_btn_begin.png'></img>");
	$("#mainmenu").append("<img id='mainmenu_btn_network' class='mainmenu_button_first' src='./images/mainmenu_btn_network.png'></img>");
	$("#mainmenu").append("<img id='mainmenu_btn_data' class='mainmenu_button_first' src='./images/mainmenu_btn_data.png'></img>")
	$("#mainmenu").append("<img id='mainmenu_btn_device' class='mainmenu_button_first' src='./images/mainmenu_btn_device.png'></img>");

	$("#mainmenu_btn_begin").click(onBbclick);
	$("#mainmenu_btn_network").click(onBbclick);
	$("#mainmenu_btn_data").click(onBbclick);
	$("#mainmenu_btn_device").click(onBbclick);

	function onBbclick() {

		var btnname = $(this).attr("id");
		var toleft = $(this).css("left");
		var idx = -1;
		//console.log(this);
		//console.log(btnname);

		switch(btnname)
		{
			case "mainmenu_btn_begin":
				idx = 1;
				break;
			case "mainmenu_btn_network":
				idx = 2;
				break;
			case "mainmenu_btn_data":
				idx = 3;
				break;
			case "mainmenu_btn_device":
				idx = 4;
				break;
		}

		if(idx != -1) {

			// ------------------------------
			//  Send main menu LEAVE event
			// ------------------------------
			if(self.currSelectIdx != idx) {
				switch(self.currSelectIdx)
				{
					case 1:
						jQuery.publish(MAINMENU_BEGIN_LEAVE);
						break;
					case 2:
						jQuery.publish(MAINMENU_NETWORK_LEAVE);
						break;
					case 3:
						jQuery.publish(MAINMENU_DATA_LEAVE);
						break;
					case 4:
						jQuery.publish(MAINMENU_DEVICE_LEAVE);
						break;
				}
				self.currSelectIdx = idx;

				switch(self.currSelectIdx)
				{
					case 1:
						self.hideDeviceButtons();
						self.hideSensorButtons();
						self.hideRHButtons();

						// ------------------------------
						// Send main menu event
						// ------------------------------
						jQuery.publish(MAINMENU_BEGIN);
						break;
					case 2:
						self.hideDeviceButtons();
						self.hideSensorButtons();
						self.hideRHButtons();

						// ------------------------------
						// Send main menu event
						// ------------------------------
						jQuery.publish(MAINMENU_NETWORK);
						break;
					case 3:
						self.hideDeviceButtons();
						self.showSubButtons();
						self.arrangeSensorButtons();
						self.arrangeRHButtons();

						// ------------------------------
						// Send main menu event
						// ------------------------------
						jQuery.publish(MAINMENU_DATA);
						break;
					case 4:
						self.hideSensorButtons();
						self.hideRHButtons();
						self.showDeviceSubButtons();
						self.arrangeDeviceButtons();

						// ------------------------------
						// Send main menu event
						// ------------------------------
						jQuery.publish(MAINMENU_DEVICE);
						break;
				}

				$("#mainmenu_selector").animate({
					left: toleft
				}, 300);
			}
		}
	}


	// ----------------------------------
	//  Device sub menu buttons
	// ----------------------------------
	this.currSelectDeviceMenuIdx = 0;

	$("#mainmenu").append("<div id='mainmenu_sbtn_health' class='mainmenu_button_second'></div>");
	$("#mainmenu_sbtn_health").append("<img src='./images/mainmenu_sbtn_health.png' />");
	$("#mainmenu").append("<div id='mainmenu_sbtn_power' class='mainmenu_button_second'></div>");
	$("#mainmenu_sbtn_power").append("<img src='./images/mainmenu_sbtn_power.png' />");

	$("#mainmenu_sbtn_health").click(onDeviceClick);
	$("#mainmenu_sbtn_power").click(onDeviceClick);

	function onDeviceClick() {
		var btnname = $(this).attr("id");
		console.log(btnname);

		if(btnname == "mainmenu_sbtn_health") {

			if(self.currSelectDeviceMenuIdx != 0) {
				self.currSelectDeviceMenuIdx = 0;
				// ------------------------------
				// Send main menu event
				// ------------------------------
				jQuery.publish(MAINMENU_DEVICE);
			}
		} else if(btnname == "mainmenu_sbtn_power") {

			if(self.currSelectDeviceMenuIdx != 1) {
				self.currSelectDeviceMenuIdx = 1;
				// ------------------------------
				// Send main menu event
				// ------------------------------
				jQuery.publish(MAINMENU_DEVICE);
			}
		}

		self.arrangeDeviceButtons();
	}

	//this.dButtons = [$("#mainmenu_sbtn_health"), $("#mainmenu_sbtn_power")];
	$("#mainmenu_sbtn_power").css("visibility", "hidden");
	this.dButtons = [$("#mainmenu_sbtn_health")];
	this.btnColors2 = ["#027b08", "#9a0101"];
	this.arrangeDeviceButtons();

	for(var i = 0; i < this.dButtons.length; i++) {
		this.dButtons[i].css("visibility", "hidden");
	}

	// ----------------------------------
	//  Data sub menu buttons
	// ----------------------------------
	$("#mainmenu").append("<div id='mainmenu_sbtn_t' class='mainmenu_button_second'></div>");
	$("#mainmenu_sbtn_t").append("<img src='./images/mainmenu_sbtn_T.png' />");
	$("#mainmenu").append("<div id='mainmenu_sbtn_i' class='mainmenu_button_second'></div>");
	$("#mainmenu_sbtn_i").append("<img src='./images/mainmenu_sbtn_I.png' />");
	$("#mainmenu").append("<div id='mainmenu_sbtn_p' class='mainmenu_button_second'></div>");
	$("#mainmenu_sbtn_p").append("<img src='./images/mainmenu_sbtn_P.png' />");
	$("#mainmenu").append("<div id='mainmenu_sbtn_h' class='mainmenu_button_second'></div>");
	$("#mainmenu_sbtn_h").append("<img src='./images/mainmenu_sbtn_H.png' />");
	$("#mainmenu").append("<div id='mainmenu_sbtn_v' class='mainmenu_button_second'></div>");
	$("#mainmenu_sbtn_v").append("<img src='./images/mainmenu_sbtn_V.png' />")

	$("#mainmenu_sbtn_t").click(onSensorClick);
	$("#mainmenu_sbtn_i").click(onSensorClick);
	$("#mainmenu_sbtn_p").click(onSensorClick);
	$("#mainmenu_sbtn_h").click(onSensorClick);
	$("#mainmenu_sbtn_v").click(onSensorClick);

	function onSensorClick() {
		var btnname = $(this).attr("id");
		console.log(btnname);

		if(btnname == "mainmenu_sbtn_t") {
			self.currSelectSensorIdx = 0;
			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);

		} else if(btnname == "mainmenu_sbtn_i") {
			self.currSelectSensorIdx = 1;
			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);

		} else if(btnname == "mainmenu_sbtn_p") {
			self.currSelectSensorIdx = 2;
			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);

		} else if(btnname == "mainmenu_sbtn_h") {
			self.currSelectSensorIdx = 3;
			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);

		}else if(btnname == "mainmenu_sbtn_v") {
			self.currSelectSensorIdx = 4;
			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);
		}
		self.arrangeSensorButtons();
	}

	// third level buttons
	$("#mainmenu").append("<div id='mainmenu_sbtn_realtime' class='mainmenu_button_third'></div>");
	$("#mainmenu_sbtn_realtime").append("<img src='./images/mainmenu_sbtn_realtime.png' />");
	$("#mainmenu").append("<div id='mainmenu_sbtn_history' class='mainmenu_button_third'></div>");
	$("#mainmenu_sbtn_history").append("<img src='./images/mainmenu_sbtn_history.png' />");

	$("#mainmenu_sbtn_realtime").click(onRHClick);
	$("#mainmenu_sbtn_history").click(onRHClick);

	function onRHClick() {
		var btnname = $(this).attr("id");

		if(btnname == "mainmenu_sbtn_realtime") {
			self.currSelectRH = 0;
			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);

		} else if(btnname == "mainmenu_sbtn_history") {
			self.currSelectRH = 1;
			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);
		}
		self.arrangeRHButtons();
	}

	this.mButtons = [$("#mainmenu_btn_begin"), $("#mainmenu_btn_network"), $("#mainmenu_btn_data"), $("#mainmenu_btn_device")];
	this.sButtons = [$("#mainmenu_sbtn_t"), $("#mainmenu_sbtn_i"), $("#mainmenu_sbtn_p"), $("#mainmenu_sbtn_h"), $("#mainmenu_sbtn_v")];
	this.rButtons = [$("#mainmenu_sbtn_realtime"), $("#mainmenu_sbtn_history")];
	this.btnColors = ["#E77227", "#D81E00", "#E445BA", "#3242DF", "#57C66C"];

	this.currSelectIdx = 1;
	this.currSelectSensorIdx = 0;
	this.currSelectRH = 0;

	var self = this;

	this.rearrange();
	this.arrangeSensorButtons();
	this.arrangeRHButtons();

	for(var i = 0; i < this.sButtons.length; i++) {
		this.sButtons[i].css("visibility", "hidden");
	}
	for(var i = 0; i < this.rButtons.length; i++) {
		this.rButtons[i].css("visibility", "hidden");
	}
}

UiMainMenu.prototype.show = function()
{
	$("#mainmenu").animate({
		"top": 0
	}, 500);
}

UiMainMenu.prototype.hide = function()
{
	$("#mainmenu").css("top", -110);
}

UiMainMenu.prototype.rearrange = function()
{
	// arrange buttons
	var middle = window.innerWidth / 2;
	var widBtn = 105;
	var gap = 90;
	$("#mainmenu_btn_begin").css("left", (middle - widBtn * 2 - gap * 1.5));
	$("#mainmenu_btn_network").css("left", (middle - widBtn - gap / 2));
	$("#mainmenu_btn_data").css("left", middle + gap / 2);
	$("#mainmenu_btn_device").css("left", middle + widBtn + gap * 1.5);

	// selector
	$("#mainmenu_selector").css("left", this.mButtons[this.currSelectIdx-1].css("left"));

	this.arrangeSensorButtons();
	this.arrangeRHButtons();
	this.arrangeDeviceButtons();

	if(this.currSelectIdx == 1 || this.currSelectIdx == 2) {
		for(var i = 0; i < this.sButtons.length; i++) {
			this.sButtons[i].css("visibility", "hidden");
		}
		for(var i = 0; i < this.rButtons.length; i++) {
			this.rButtons[i].css("visibility", "hidden");
		}
		for(var i = 0; i < this.dButtons.length; i++) {
			this.dButtons[i].css("visibility", "hidden");
		}

	}
}

UiMainMenu.prototype.showSubButtons = function()
{
	// sensor buttons
	var stop = $("#mainmenu_sbtn_t").css("top");
	for(var i = 0; i < this.sButtons.length; i++) {
		this.sButtons[i].css("visibility", "visible");
		//this.sButtons[i].css("top", 0);
		this.sButtons[i].css("opacity", 0);
		this.sButtons[i].delay(200).animate({
			opacity: 1
		}, 300);
	}

	var rtop = $("#mainmenu_sbtn_realtime").css("top");
	for(var i = 0; i < this.rButtons.length; i++) {
		this.rButtons[i].css("visibility", "visible");
		//this.rButtons[i].css("top", 0);
		this.rButtons[i].css("opacity", 0);
		this.rButtons[i].delay(400).animate({
			opacity: 1
		}, 300);
	}
}

UiMainMenu.prototype.showDeviceSubButtons = function()
{
	// device buttons
	for(var i = 0; i < this.dButtons.length; i++) {
		this.dButtons[i].css("visibility", "visible");
		//this.sButtons[i].css("top", 0);
		this.dButtons[i].css("opacity", 0);
		this.dButtons[i].delay(200).animate({
			opacity: 1
		}, 300);
	}
}

UiMainMenu.prototype.arrangeSensorButtons = function()
{
	var widBtn = 105;
	var gap = 3;
	var toleft = parseInt($("#mainmenu_btn_data").css("left")) - (widBtn + gap) * this.currSelectSensorIdx;

	// sensor buttons
	for(var i = 0; i < this.sButtons.length; i++) {
		this.sButtons[i].css("visibility", "visible");
		//this.sButtons[i].css("left", toleft + (widBtn + gap) * i);
		this.sButtons[i].animate({
			left: toleft + (widBtn + gap) * i
		}, 200);

		// color
		if(this.currSelectSensorIdx == i) {
			this.sButtons[i].css("background-color", this.btnColors[this.currSelectSensorIdx]);
			this.rButtons[this.currSelectRH].css("background-color", this.btnColors[this.currSelectSensorIdx]);
		} else {
			this.sButtons[i].css("background-color", "#a6aaa9");
		}
	}
}

UiMainMenu.prototype.hideSensorButtons = function()
{
	for(var i = 0; i < this.sButtons.length; i++) {
		//this.sButtons[i].css("visibility", "hidden");
		this.sButtons[i].delay(300).animate({
			opacity: 0
		}, 200, function() {
			$(this).css("visibility", "hidden");
		});
	}
}

UiMainMenu.prototype.arrangeDeviceButtons = function()
{
	var widBtn = 105;
	var gap = 3;
	var toleft = parseInt($("#mainmenu_btn_device").css("left")) - (widBtn + gap) * this.currSelectDeviceMenuIdx;

	// device buttons
	for(var i = 0; i < this.dButtons.length; i++) {
		this.dButtons[i].css("visibility", "visible");

		this.dButtons[i].animate({
			left: toleft + (widBtn + gap) * i
		}, 200);

		// color
		if(this.currSelectDeviceMenuIdx == i) {
			this.dButtons[i].css("background-color", this.btnColors2[this.currSelectDeviceMenuIdx]);
		} else {
			this.dButtons[i].css("background-color", "#a6aaa9");
		}
	}
}

UiMainMenu.prototype.hideDeviceButtons = function()
{
	for(var i = 0; i < this.dButtons.length; i++) {
		//this.sButtons[i].css("visibility", "hidden");
		this.dButtons[i].delay(300).animate({
			opacity: 0
		}, 200, function() {
			$(this).css("visibility", "hidden");
		});
	}
}

UiMainMenu.prototype.arrangeRHButtons = function()
{
	var widBtn = 105;
	var gap = 3;
	var toleft = parseInt($("#mainmenu_btn_data").css("left")) - (widBtn + gap) * this.currSelectRH;

	// sensor buttons
	for(var i = 0; i < this.rButtons.length; i++) {
		this.rButtons[i].css("visibility", "visible");
		//this.rButtons[i].css("left", toleft + (widBtn + gap) * i);
		this.rButtons[i].animate({
			left: toleft + (widBtn + gap) * i
		}, 200);

		// color
		if(this.currSelectRH == i) {
			this.rButtons[i].css("background-color", this.btnColors[this.currSelectSensorIdx]);
		} else {
			this.rButtons[i].css("background-color", "#a6aaa9");
		}
	}
}

UiMainMenu.prototype.hideRHButtons = function()
{
	for(var i = 0; i < this.rButtons.length; i++) {
		//this.rButtons[i].css("visibility", "hidden");
		this.rButtons[i].delay(100).animate({
			opacity: 0
		}, 200, function() {
			$(this).css("visibility", "hidden");
		});
	}
}
