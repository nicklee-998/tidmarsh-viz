/**
 * Created by marian_mcpartland on 14/12/22.
 */
var infoSignPlane;
var infoSignTitle;
var infoDeviceWebsocket;

function initInfoPanel()
{
	// ui
	//$('#info-panel').css("width", 900);
	//$('#info-panel').css("height", 600);
	rearrangeInfoPanel();
	$('#info-panel').css("visibility", "hidden");

	// pic
	$("#info-panel").html(
		"<img id='imageholder' src=' + ../../images/sensors/0x816E.jpg'>" +
		"<div id='lastest_data'>" +
			"<label id='info_title' />" +
			"<label id='info_pressure' /> " +
			"<label id='info_illuminance' />" +
			"<label id='info_humidity' />" +
			"<label id='info_volt' />" +
			"<label id='info_temp' />" +
			"<label id='info_lastest' />" +
			"<div id='info_audio'><button id='audio_play' /></div>" +
			"<div id='info_wind'>" +
				"<img id='wind_arrow' src=' + ../../images/wind_arrow.png'>" +
				"<label id='wind_speed' />" +
			"</div>" +
		"</div>" +
		"<button id='info_btn_exit' />");
	$("#imageholder").css("width", "100%");
	$("#imageholder").css("height", "100%");

	// lastest data
	$("#lastest_data").css("position", "absolute");
	$("#lastest_data").css("left", "0");
	$("#lastest_data").css("top", "0");
	$("#lastest_data").css("width", "30%");
	$("#lastest_data").css("height", "100%");
	$("#lastest_data").css("background-color", "rgba(245, 211, 39, 0.7)");

	$("#info_title").addClass("info-label");
	$("#info_pressure").addClass("info-label");
	$("#info_illuminance").addClass("info-label");
	$("#info_humidity").addClass("info-label");
	$("#info_volt").addClass("info-label");
	$("#info_temp").addClass("info-label");
	$("#info_lastest").addClass("info-label");

	// TITLE
	$("#info_title").css("top", 25);
	$("#info_title").css("font-size", 22);
	$("#info_title").text("0x816E");

	var mtop = 30;

	// AUDIO
	$("#info_audio").addClass("info-audio");
	$("#info_audio").css("top", 190 + mtop);
	$("#info_audio").css("visibility", "hidden");
	$("#audio_play").css("width", 60);
	$("#audio_play").css("height", 60);
	$("#audio_play").css("position", "absolute");
	$("#audio_play").css("top", $("#info_audio").height() / 2 - $("#audio_play").height() / 2);
	$("#audio_play").css("left", $("#info_audio").width() / 2 - $("#audio_play").width() / 2 - 7);
	$("#audio_play").css("border", "none");
	$("#audio_play").css("checked", "false");
	$("#audio_play").css("background-color", "rgba(255, 255, 255, 0)");
	$("#audio_play").css("background-size", "100% 100%");
	$("#audio_play").css("background-image", "url('+ ../../images/btn_play.png')");

	// WIND
	$("#info_wind").addClass("info-audio");
	$("#info_wind").css("top", 190 + mtop);
	$("#info_wind").css("visibility", "hidden");
	$("#wind_arrow").css("width", 100);
	$("#wind_arrow").css("height", 100);
	$("#wind_arrow").css("position", "absolute");
	$("#wind_arrow").css("top", $("#info_wind").height() / 2 - $("#wind_arrow").height() / 2);
	$("#wind_arrow").css("left", $("#info_wind").width() / 2 - $("#wind_arrow").width() / 2);
	$("#wind_speed").css("position", "absolute");
	$("#wind_speed").css("bottom", 3);
	$("#wind_speed").css("right", 5);
	$("#wind_speed").text("0 degress, 0 m/s");

	// SENSOR
	$("#info_pressure").css("top", 50 + mtop);
	$("#info_pressure").text("pressure");
	$("#info_illuminance").css("top", 75 + mtop);
	$("#info_illuminance").text("illuminance");
	$("#info_humidity").css("top", 100 + mtop);
	$("#info_humidity").text("humidity");
	$("#info_volt").css("top", 125 + mtop);
	$("#info_volt").text("battery voltage");
	$("#info_temp").css("top", 150 + mtop);
	$("#info_temp").text("temperature");
	$("#info_lastest").css("bottom", 12);
	$("#info_lastest").css("font-size", 12);
	$("#info_lastest").text("received date: 2014-09-12 13:06:20");

	// EXIT BUTTON
	$("#info_btn_exit").css("position", "absolute");
	$("#info_btn_exit").css("width", 45);
	$("#info_btn_exit").css("height", 45);
	$("#info_btn_exit").css("right", -$("#info_btn_exit").height() / 2 - 7);
	$("#info_btn_exit").css("top", -$("#info_btn_exit").width() / 2 - 10);
	$("#info_btn_exit").css("border", "none");
	$("#info_btn_exit").css("checked", "false");
	$("#info_btn_exit").css("background-color", "rgba(255, 255, 255, 0)");
	$("#info_btn_exit").css("background-size", "100% 100%");
	$("#info_btn_exit").css("background-image", "url('+ ../../images/btn_exit.png')");
	$("#info_btn_exit").on('click', function() {
		hideInfoPanel();
	});

	// INFO SIGN PLANE
	var texture = THREE.ImageUtils.loadTexture("./res/textures/infopanel_sign.png");
	infoSignPlane = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(127, 57, 40, 40),
		new THREE.MeshPhongMaterial({map: texture, shading: THREE.SmoothShading, transparent: true, side: THREE.DoubleSide})
	);
	infoSignPlane.position.z = groundZero + 43;
	infoSignPlane.name = "info_sign_plane";
	infoSignPlane.visible = false;
	infoSignPlane.rotation.x = Math.PI / 2;
	ground.add(infoSignPlane);

	// Device title
	infoSignTitle = document.createElement( "canvas" );
	infoSignTitle.width = 150;
	infoSignTitle.height = 60;
	var context = infoSignTitle.getContext( "2d" );
	context.shadowColor = "#000";
	context.shadowBlur = 7;
	context.fillStyle = "white";
	context.font = "18pt arial bold";
	context.fillText( "0x0000", 25, 60 );

	var xm = new THREE.MeshBasicMaterial({map: new THREE.Texture(infoSignTitle), transparent: true});
	xm.map.needsUpdate = true;

	var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(150, 60), xm);
	mesh.position.y = 30;
	mesh.position.z = 5;
	mesh.name = "signmesh";
	infoSignPlane.add(mesh);
}

// -------------------------------------------------------
//  Small Sign
// -------------------------------------------------------
function showNodeSign(node, delay)
{
	delay = typeof delay !== 'undefined' ? delay : 0;

	// Show devict title on sign
	var context = infoSignTitle.getContext( "2d" );
	context.clearRect(0, 0, 150, 60);
	context.fillText( node.name, 25, 60 );

	var xm = new THREE.MeshBasicMaterial({map: new THREE.Texture(infoSignTitle), transparent: true});
	xm.map.needsUpdate = true;
	infoSignPlane.getObjectByName("signmesh").material = xm;

	// Show the device information
	infoSignPlane.position.x = node.position.x - 2;
	infoSignPlane.position.y = node.position.y;
	infoSignPlane.position.z = - 100;
	infoSignPlane.userData = {title:node.name};

	TweenMax.to(infoSignPlane.position, 0.7, {z:43, delay:delay, ease:Elastic.easeOut, onStart: function() {
		infoSignPlane.visible = true;
	}});
}

function hideNodeSign()
{
	TweenMax.to(infoSignPlane.position, 0.4, {z: -80, ease:Cubic.easeOut, onComplete: function() {
		infoSignPlane.visible = false;
	}});
}

// -------------------------------------------------------
//  Info Panel
// -------------------------------------------------------
function showInfoPanel()
{
	var device = chainManager.getDeviceByName(infoSignPlane.userData.title);
	if(device) {
		clearNodeInfo();
		loadNodeInfo(device);         // just image and title now
		openDeviceWebsocket(device.websocket);
		//loadNodeInfo(device);

		var value = 0;
		$("#wind_arrow").rotate({
			bind:
			{
				click: function(){
					value += 90;
					$(this).rotate({ animateTo:value})
				}
			}
		});

		$('#info-panel').css("visibility", "visible");
		$('#info-panel').css("opacity", "0");
		$("#info-panel").animate({
			opacity: 1
		}, 800, "easeOutQuart", function() {
			//console.log("Show info panel!");
		});
	}
}

function hideInfoPanel()
{
	if($("#info-panel").css("visibility") == "visible") {
		//$("#info-panel").css('visibility', "hidden");
		$("#info-panel").animate({
			opacity: 0
		}, 500, "easeOutQuart", function() {
			$(this).css('visibility', "hidden");
			$(this).css('opacity', 1);
		});

		// close device websocket stream
		closeDeviceWebsocket();
	}
}

function rearrangeInfoPanel()
{
	var wid = $('#info-panel').width();
	var hei = wid * 2 / 3;
	var whei = window.innerHeight - 115 - 20;
	$("#info-panel").css("height", hei);
	$("#info-panel").css("top", whei / 2 - hei / 2 + 115);
	$("#info-panel").css("left", window.innerWidth / 2 - wid / 2);
}

function loadNodeInfo(device)
{
	// Loading image...
	var imgpath = " + ../../images/sensors/" + device.title + ".jpg";
	$("#imageholder").attr("src", imgpath);
	$("#imageholder").error(function () {
		var path = " + ../../images/sensors/default.jpg";
		$("#imageholder").attr("src", path);
	});

	// Loading lastest info...
	$("#info_title").text(device.title);
}

function clearNodeInfo()
{
	$("#imageholder").attr("src", "");
	$("#info_pressure").text("pressure:");
	$("#info_illuminance").text("illuminance:");
	$("#info_humidity").text("humidity:");
	$("#info_volt").text("battery voltage:");
	$("#info_temp").text("temperature:");
	$("#info_lastest").text("received date:");

	// Hide some menu first
	$('#info_audio').css("visibility", "hidden");
	$("#info_wind").css("visibility", "hidden");
}

function onDeviceLastestData(e, i)
{
	jQuery.unsubscribe(SERVER_LASTEST_DATA, onDeviceLastestData);

	var arr = i.arr;
	// update tooltip
	for(var k = 0; k < arr.length; k++) {
		var sobj = arr[k];
		var txt = sobj.value.toFixed(2) + " " + rollupUnit(sobj.unit);
		var date = new Date(sobj.updated);

		if(sobj.metric == 'sht_temperature') {
			$('#info_temp').text("temperature: " + txt);
			$('#info_lastest').text("received date: " + date.toTimeString());
		} else if(sobj.metric == 'bmp_pressure') {
			$('#info_pressure').text("pressure: " + txt);
		} else if(sobj.metric == 'illuminance') {
			$('#info_illuminance').text("illuminance: " + txt);
		} else if(sobj.metric == 'battery_voltage') {
			$('#info_volt').text("battery voltage: " + txt);
		} else if(sobj.metric == 'sht_humidity') {
			$('#info_humidity').text("humidity: " + txt);
		}
		// todo: Havn't add the audio link into Chain API
		else if(sobj.metric == "audio") {
			$('#info_audio').css("visibility", "visible");
		}
	}
}

function onUiNodeInfoMouseOver(node)
{

}

/////////////////////////////////////////////
// Websocket Message
/////////////////////////////////////////////
function openDeviceWebsocket(wsurl)
{
	infoDeviceWebsocket = new WebSocket(wsurl);
	infoDeviceWebsocket.onopen = function(evt) {
		console.log(wsurl + ' is opened!');
	};
	infoDeviceWebsocket.onclose = function(evt) {
		console.log(wsurl + ' is closed!');
	};
	infoDeviceWebsocket.onmessage = function(evt) {
		//console.log(evt);
		var tmpobj = $.parseJSON(evt.data);
		console.log("Incoming data: " + tmpobj);
		console.log(tmpobj);

		// todo: update node status here:
		var href = tmpobj['_links']['ch:sensor']['href'];
		var iobj = chainManager.getDeviceBySensor(href);

		if(iobj != null) {
			//processMessage(iobj.did, iobj.sid, tmpobj.value);
			var txt = tmpobj.value.toFixed(2) + " " + rollupUnit(iobj.unit);
			var date = new Date(tmpobj.timestamp);

			if(iobj.sid == 'sht_temperature') {
				$('#info_temp').text("temperature: " + txt);
				$('#info_lastest').text("received date: " + date.toTimeString());
			} else if(iobj.sid == 'bmp_pressure') {
				$('#info_pressure').text("pressure: " + txt);
			} else if(iobj.sid == 'illuminance') {
				$('#info_illuminance').text("illuminance: " + txt);
			} else if(iobj.sid == 'battery_voltage') {
				$('#info_volt').text("battery voltage: " + txt);
			} else if(iobj.sid == 'sht_humidity') {
				$('#info_humidity').text("humidity: " + txt);
			}
			// todo: Havn't add the audio link into Chain API
			else if(iobj.sid == "audio") {
				$('#info_audio').css("visibility", "visible");
			}
		}
	};
	infoDeviceWebsocket.onerror = function(evt) {
		console.log(wsurl + ' onerror');
	};
}

function closeDeviceWebsocket()
{
	if(infoDeviceWebsocket != null) {
		infoDeviceWebsocket.close();
		infoDeviceWebsocket = null;
	}
}