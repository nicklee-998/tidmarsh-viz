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
		//console.log(this);
		//console.log(btnname);

		if(btnname == "mainmenu_btn_begin") {
			self.currSelectIdx = 1;
			self.hideSensorButtons();
			self.hideRHButtons();

			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_BEGIN);

		} else if(btnname == "mainmenu_btn_network") {
			self.currSelectIdx = 2;
			self.hideSensorButtons();
			self.hideRHButtons();

			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_NETWORK);

		} else if(btnname == "mainmenu_btn_data") {
			self.currSelectIdx = 3;
			self.showSubButtons();
			self.arrangeSensorButtons();
			self.arrangeRHButtons();

			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DATA);

		} else if(btnname == "mainmenu_btn_device") {
			self.currSelectIdx = 4;
			self.hideSensorButtons();
			self.hideRHButtons();

			// ------------------------------
			// Send main menu event
			// ------------------------------
			jQuery.publish(MAINMENU_DEVICE);
		}

		$("#mainmenu_selector").animate({
			left: toleft
		}, 300);
	}

	// second level buttons
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

	if(this.currSelectIdx != 3) {
		for(var i = 0; i < this.sButtons.length; i++) {
			this.sButtons[i].css("visibility", "hidden");
		}
		for(var i = 0; i < this.rButtons.length; i++) {
			this.rButtons[i].css("visibility", "hidden");
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