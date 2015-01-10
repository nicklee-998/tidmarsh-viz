/**
 * Created by marian_mcpartland on 14/12/15.
 */

var container, scene, renderer, camera, controls, sw, sh;
var ground, groundWid, groundHei, groundZero;
var stats;

// loading animation
var _spinner;
var _counter;
var _counterIdx = 0;
var _counterTotal = 0;
var _counterInterval;

// ui
var mainmenu = null;
var intro = null;

//
var weather = null;
var network, chainManager, apManager;

// interactive
var raycaster;
var mouse = new THREE.Vector2(), INTERSECTED;

// data history
var selectSensor;
var sensorTable = ["sht_temperature", "illuminance", "bmp_pressure", "sht_humidity", "battery_voltage"];

// --------------------------
//  Birds
// --------------------------
var clock = new THREE.Clock();

// FOR TEST
var _sensorIdx = 0;

$(document).ready(function() {

	// INIT UI
	initSliderBar();
	// MAIN MENU
	jQuery.subscribe(MAINMENU_BEGIN, onMainMenuClick);
	jQuery.subscribe(MAINMENU_NETWORK, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DEVICE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_TEMPRATURE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_ILLUMINANCE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_PRESSURE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_HUMIDITY, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_VOLTAGE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_REALTIME, onMainMenuClick);
	jQuery.subscribe(MAINMENU_HISTORY, onMainMenuClick);
	mainmenu = new UiMainMenu();
	// INTRO PAGE
	intro = new UiIntroPage();

	// date picker
	$("#datepicker").datepicker({
		inline: true,
		showOtherMonths: true,
		dayNamesMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		onSelect: function(date) {
			//console.log(date);
			onSelectDate(date);
		}
	});

	jQuery.subscribe(GMAP_INIT, onGmapInit);
	network = new NodeNetwork();
});

function onGmapInit()
{
	jQuery.unsubscribe(GMAP_INIT, onGmapInit);

	// INIT 3D
	init3d();

	// Loading animation
	initLoadingScreen();

	jQuery.subscribe(SERVER_SUMMARY_COMPLETE, onServerSummary);
	jQuery.subscribe(SERVER_DEVICE_INFO_COMPLETE, onDeviceInfoComplete);
	jQuery.subscribe(SERVER_INIT_COMPLETE, onServerInitCompelte);
	chainManager = new ChainManager("http://chain-api.media.mit.edu/devices/?site_id=7");
	chainManager.init();
}

function onServerSummary(e, i)
{
	_counterTotal = i.totalCount;

	_counterInterval = setInterval(function() {
		var number = (_counterIdx / _counterTotal) * 100;
		_counter.countUpTo(Math.round(number));
	}, 800);
}

function onDeviceInfoComplete(e, i)
{
	network.createDevice(i);
	// for opening loading
	_counterIdx++;
}

function onServerInitCompelte()
{
	jQuery.unsubscribe(SERVER_SUMMARY_COMPLETE, onServerSummary);
	jQuery.unsubscribe(SERVER_DEVICE_INFO_COMPLETE, onDeviceInfoComplete);
	jQuery.unsubscribe(SERVER_INIT_COMPLETE, onServerInitCompelte);

	network.createFakeDevices();
	network.createVoronoi();

	// stop update opening loader
	clearInterval(_counterInterval);
	_counter.countUpTo(99);
	clearLoadingScreen();
}

function init3d()
{
	container = $("#playground");
	sw = window.innerWidth;
	sh = window.innerHeight;

	// Setup the renderer
	renderer = new THREE.WebGLRenderer({ antialias:true });
	renderer.setSize(sw, sh);
	renderer.setClearColor( 0x202428, 1 );
	renderer.sortObjects = true;

	// Setup the camera
	camera = new THREE.PerspectiveCamera(45, sw / sh, 0.1, 10000);
	camera.position.y = 1000;
	camera.position.z = 1000;

	// Setup the scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xffffff, 4000, 4000);
	scene.add(camera);
	container.append(renderer.domElement);

	// Raycaster for MOUSEEVENT
	raycaster = new THREE.Raycaster();
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );

	// STATS
	stats = new Stats();
	container.append(stats.domElement);

	// CONTROLS
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.autoRotate = false;

	// Handling window resize
	window.addEventListener("resize", function() {
		sw = window.innerWidth;
		sh = window.innerHeight;
		renderer.setSize(sw, sh);
		camera.aspect = sw / sh;
		camera.updateProjectionMatrix();

		// ui
		mainmenu.rearrange();
		// intro_page
		intro.rearrange();
		// info panel
		rearrangeInfoPanel();
		// drag bar
		rearrangeDragbar();
	});

	createWorld();

	// for test
	//weather = new WeatherEffect();
	//weather.create("CLOUDY");
	//
	//animate();

	// -------------------------------------
	//  Init weather effect
	// -------------------------------------
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

			weather = new WeatherEffect();
			forecast = forecast.toLowerCase();
			if(forecast.indexOf("clear") != -1 || forecast.indexOf("sunny") != -1 || forecast.indexOf("sunshine") != -1) {
				weather.create("SUNNY");
			} else if(forecast.indexOf("cloud") != -1) {
				weather.create("CLOUDY");
			} else if(forecast.indexOf("snow") != -1) {
				weather.create("SNOW");
			} else if(forecast.indexOf("rain") != -1 || forecast.indexOf("shower") != -1) {
				weather.create("RAIN");
			} else if(forecast.indexOf("fog") != -1) {
				weather.create("FOG");
			} else {
				// Default weather is sunny
				weather.create("SUNNY");
			}

			// Animal & Planet effect
			apManager = new APManager();
			apManager.init();

			// Todo: Can't rely on weather infomation to start all the web
			animate();
		},
		error : function(xhr, textStatus, error) {
			console.log(xhr.statusText);
			console.log(textStatus);
			console.log(error);
			$("#weather").remove();

			// 默认天气
			weather = new WeatherEffect();
			weather.create("CLOUDY");
			animate();
		}
	});
}

function createWorld()
{
	createBaseGround();
	initInfoPanel();
}

function createBaseGround()
{
	groundWid = network.boundWid;
	groundHei = network.boundHei;

	var texture = THREE.ImageUtils.loadTexture("./res/textures/map_area.jpg");
	ground = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(groundWid, groundHei, 200, 200),
		new THREE.MeshPhongMaterial({map: texture, shading: THREE.SmoothShading, side: THREE.DoubleSide})
	);

	ground.position.y = -200;
	ground.rotation.x = -Math.PI / 2;
	groundZero = ground.position.y - 3;
	scene.add(ground);

	camera.lookAt(ground.position);
}

function animate()
{
	requestAnimationFrame(animate);

	render();
	stats.update();

	if(weather != null)
		weather.update();
	if(apManager != null)
		apManager.update();
}

function onDocumentMouseMove( event )
{
	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onDocumentMouseUp( event )
{
	event.preventDefault();

	if(INTERSECTED && mainmenu.currSelectIdx == 2) {
		if(INTERSECTED.name == "info_sign_plane") {
			showInfoPanel(INTERSECTED);
		} else {
			showNodeSign(INTERSECTED);
		}
	}
}

function render()
{
	// find intersections
	var vector = new THREE.Vector3(mouse.x, mouse.y, 1).unproject(camera);
	raycaster.set(camera.position, vector.sub(camera.position).normalize());
	var intersects = raycaster.intersectObjects(scene.children);
	if(intersects.length > 0 && mainmenu.currSelectIdx == 2) {
		if(chainManager != null && chainManager.getDeviceByName(intersects[0].object.name) != null) {
			if(INTERSECTED != intersects[0].object) {
				if(INTERSECTED) {
					INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
				}
				INTERSECTED = intersects[0].object;
				INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				INTERSECTED.material.emissive.setHex(0xff0000);
			}
		} else if(chainManager != null && intersects[0].object.name == "info_sign_plane") {
			if(INTERSECTED != intersects[0].object) {
				if(INTERSECTED) {
					INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
				}
				INTERSECTED = intersects[0].object;
				INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				INTERSECTED.material.emissive.setHex(0xff0000);
			}
		} else {
			if ( INTERSECTED ) {
				INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			}
			INTERSECTED = null;
		}
	} else {
		if ( INTERSECTED ) {
			INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		}
		INTERSECTED = null;
	}

	//if(infoSignPlane != null) {
	//	infoSignPlane.lookAt(camera.position);
	//}

	renderer.render(scene, camera);
	controls.update();
}

function processMessage(did, sid, value)
{
	network.updateVoronoi(did, sid, value);
}

/////////////////////////////////////////////
// MAIN MENU
/////////////////////////////////////////////
function onMainMenuClick(e)
{
	//console.log(e.type);

	if(e.type == MAINMENU_BEGIN) {
		// 显示介绍文字
		intro.showIntroPage();
		// 隐藏指示牌和信息板
		hideNodeSign();
		hideInfoPanel();
		// 显示动物和植物
		apManager.showAP();
		// 显示天气
		weather.showWeather();
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Hide cal and dragbar
		showCal(false);
		showDragBar(false);

	} else if(e.type == MAINMENU_NETWORK) {
		// 隐藏介绍文字
		intro.hideIntroPage();
		// 显示动物和植物
		apManager.showAP();
		// 显示天气
		weather.showWeather();
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Hide cal and dragbar
		showCal(false);
		showDragBar(false);

	} else if(e.type == MAINMENU_DATA) {
		// 隐藏介绍文字
		intro.hideIntroPage();
		// 隐藏指示牌和信息板
		hideNodeSign();
		hideInfoPanel();
		// 隐藏动物和植物
		apManager.hideAP();
		// 关闭天气
		weather.hideWeather();
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Choose Sensor
		selectSensor = sensorTable[mainmenu.currSelectSensorIdx];

	} else if(e.type == MAINMENU_DATA_TEMPRATURE) {
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Choose Sensor
		selectSensor = "sht_temperature";
		// Recolor dragbar and cal
		recolorDragbar("#E77227");
		$(".ui-state-active").css("background", "#E77227");

		if(mainmenu.currSelectRH == 0) {
			// realtime
		} else {
			// history
			getDevicesDataBySensorMenu();
		}

	} else if(e.type == MAINMENU_DATA_ILLUMINANCE) {
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Choose Sensor
		selectSensor = "illuminance";
		// Recolor dragbar
		recolorDragbar("#D81E00");
		$(".ui-state-active").css("background", "#D81E00");

		if(mainmenu.currSelectRH == 0) {
			// realtime
		} else {
			// history
			getDevicesDataBySensorMenu();
		}

	} else if(e.type == MAINMENU_DATA_PRESSURE) {
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Choose Sensor
		selectSensor = "bmp_pressure";
		// Recolor dragbar
		recolorDragbar("#E445BA");
		$(".ui-state-active").css("background", "#E445BA");

		if(mainmenu.currSelectRH == 0) {
			// realtime
		} else {
			// history
			getDevicesDataBySensorMenu();
		}

	} else if(e.type == MAINMENU_DATA_HUMIDITY) {
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Choose Sensor
		selectSensor = "sht_humidity";
		// Recolor dragbar
		recolorDragbar("#3242DF");
		$(".ui-state-active").css("background", "#3242DF");

		if(mainmenu.currSelectRH == 0) {
			// realtime
		} else {
			// history
			getDevicesDataBySensorMenu();
		}

	} else if(e.type == MAINMENU_DATA_VOLTAGE) {
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Choose Sensor
		selectSensor = "battery_voltage";
		// Recolor dragbar
		recolorDragbar("#57C66C");
		$(".ui-state-active").css("background", "#57C66C");

		if(mainmenu.currSelectRH == 0) {
			// realtime
		} else {
			// history
			getDevicesDataBySensorMenu();
		}

	} else if(e.type == MAINMENU_DEVICE) {
		// 隐藏介绍文字
		intro.hideIntroPage();
		// 隐藏指示牌和信息板
		hideNodeSign();
		hideInfoPanel();
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Hide cal and dragbar
		showCal(false);
		showDragBar(false);

	} else if(e.type == MAINMENU_REALTIME) {
		// Hide cal and dragbar
		showCal(false);
		showDragBar(false);
		// CLEAR GRAPH
		network.clearVoronoi(true);

	} else if(e.type == MAINMENU_HISTORY) {
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// history
		getDevicesDataBySensorMenu();
	}
}

/////////////////////////////////////////////
// MAIN LOADING ANIMATION
/////////////////////////////////////////////
function initLoadingScreen()
{
	// 3d scene
	camera.position.x = 910;
	camera.position.y = 1500;
	camera.position.z = 2891;

	ground.position.y = 570;

	// title
	$("body").append("<div id='mainloading_title' class='main_loading_title'>Tidmarsh Living Observatory</div>");
	var twid = $("#mainloading_title").width();
	$("#mainloading_title").css("left", (window.innerWidth / 2 - twid / 2));

	// loading number
	var owid = $("#opening_loader").width();
	$("#opening_loader").css("left", window.innerWidth / 2 - owid / 2 - 5);
}

function clearLoadingScreen()
{
	//
	TweenMax.to(ground.position, 2, {y: -200, delay:0.7, ease:Quint.easeOut});
	TweenMax.to(camera.position, 2.5, {x:4, y:440, z:1503, delay:1.1, ease:Quart.easeInOut, onComplete:function() {
		// ui
		mainmenu.show();
		$("#weather").animate({
			"bottom": 0
		}, 500);
		// shwo ap
		apManager.showAP();
	}});

	// loading
	$("#opening_loader").animate({
		"opacity": 0
	}, 300, function() {
		$(this).css("visibility", "hidden");
	});

	// title
	$("#mainloading_title").animate({
		"opacity": 0
	}, 300, function() {
		$(this).css("visibility", "hidden");
	});
}

/////////////////////////////////////////////
// USER INTERFACE
/////////////////////////////////////////////
function showCal(flg)
{
	if(flg) {
		var dwid = parseInt($('#datepicker').css('width'));
		$('#datepicker').css('visibility', 'visible');
		$('#datepicker').css('left', '-'+dwid + 'px');
		$('#datepicker').animate({left:'0px'}, 500, 'easeOutQuint');
	} else {
		var dwid = parseInt($('#datepicker').css('width')) + 35;
		if($('#datepicker').css('visibility') != 'hidden') {
			$('#datepicker').animate({left:'-' + dwid + 'px'}, 500, 'easeOutQuint', function() {
				$('#datepicker').css('visibility', 'hidden');
			});
		}
	}
}

function showDragBar(flg)
{
	if(flg) {
		$('#bar').css('visibility', 'visible');
		$('#bar').css('bottom', '-100px');
		$('#bar').animate({bottom:'60px'}, 'slow', 'swing');
	} else {
		$('#bar').animate({bottom:'-100px'}, 'slow', 'swing', function() {
			$('#bar').css('visibility', 'hidden');
		});
	}
}

/////////////////////////////////////////////
// GET SENSOR HISTORY DATA
/////////////////////////////////////////////
function getDevicesDataBySensorMenu()
{
	// Hide cal and dragbar
	showCal(false);
	showDragBar(false);

	var arr = new Array();
	for(var i = 0; i < chainManager.devices.length; i++) {
		arr.push(chainManager.devices[i].title);
	}

	jQuery.subscribe(SERVER_DEVICE_LIST_START, onDeviceData);
	jQuery.subscribe(SERVER_DEVICE_LIST_COMPLETE, onDeviceData);
	chainManager.fetchMultiDevicesByDate(arr, [selectSensor],
		{year:sliderYear, month:sliderMonth, day:sliderDay, hour:0, minu:0, sec:0},
		{year:sliderYear, month:sliderMonth, day:sliderDay, hour:23, minu:59, sec:59});
}

function onDeviceData(e, i)
{
	if(e.type == SERVER_DEVICE_LIST_START) {
		// 开始载入数据集
		jQuery.unsubscribe(SERVER_DEVICE_LIST_START, onDeviceData);
		console.log("开始载入数据集!");

		// 隐藏菜单
		//if($('#bar').css('visibility') != 'hidden') {
		//	$('#bar').animate({bottom:'-100px'}, 'slow', 'swing', function() {
		//		$('#bar').css('visibility', 'hidden');
		//	});
		//}
		// 隐藏日历
		//showCal(false);
		//showUIMenu(false);
		//showLoading(true);
	} else if(e.type == SERVER_DEVICE_LIST_COMPLETE) {
		jQuery.unsubscribe(SERVER_DEVICE_LIST_COMPLETE, onDeviceData);
		console.log("数据集载入完毕!");

		// 显示菜单, 默认载入中午
		updateSliderInfo(bar.offsetLeft + bar_line.offsetLeft + bar_line.offsetWidth/2, 0.5);
		updateNetworkNode();

		// 显示日历和拖动条
		showCal(true);
		showDragBar(true);
		//showUIMenu(true);
		//showLoading(false);
	}
}

function updateNetworkNode()
{
	for(var i = 0; i < chainManager.devices.length; i++)
	{
		var dat = chainManager.fetchData(chainManager.devices[i].title, selectSensor, sliderCurrent);
		if(dat != null) {
			network.updateVoronoi(dat.did, dat.sid, dat.value);
		}
	}
}

/////////////////////////////////////////////
// JUST FOR TEST
/////////////////////////////////////////////
function onKeyboardDown()
{
	// 返回键退出
	if(d3.event.keyCode == 66) 	// B:
	{
		simulateIncomingData();
	}
	else if(d3.event.keyCode == 81) 	// Q:
	{
		selectSensor = 'sht_temperature';
		onSelectDate("10/22/2014");
	}
	else if(d3.event.keyCode == 87) 	// W:
	{
		selectSensor = 'illuminance';
		onSelectDate("10/22/2014");
	}
	else if(d3.event.keyCode == 69) 	// E:
	{
		selectSensor = 'bmp_pressure';
		onSelectDate("10/22/2014");
	}
	else if(d3.event.keyCode == 82) 	// R:
	{
		selectSensor = 'sht_humidity';
		onSelectDate("10/22/2014");
	}
	else if(d3.event.keyCode == 84) 	// T:
	{
		selectSensor = 'battery_voltage';
		onSelectDate("10/22/2014");
	}
	else if(d3.event.keyCode == 67) 	// C:
	{

	}
	else if(d3.event.keyCode == 68) 	// D:
	{
		console.log(camera);
	}
	else if(d3.event.keyCode == 73)	// I:
	{

	}
	else if(d3.event.keyCode == 49)	// 1
	{
		weather.create("SUNNY");
	}
	else if(d3.event.keyCode == 50)	// 2
	{
		weather.create("CLOUDY");
	}
	else if(d3.event.keyCode == 51)	// 3
	{
		weather.create("RAIN");
	}
	else if(d3.event.keyCode == 52)	// 4
	{
		weather.create("SNOW");
	}
	else if(d3.event.keyCode == 53)	// 5
	{
		weather.create("FOG");
	}
}
d3.select("body").on("keydown", onKeyboardDown);

function simulateIncomingData()
{
	// 模拟incoming message
	var sarr = ["sht_temperature", "illuminance", "bmp_pressure", "sht_humidity", "battery_voltage"];
	var sid = sarr[mainmenu.currSelectSensorIdx];
	var conf = getConfigBySensor(sid);
	var v = getRandomArbitrary(conf.min, conf.max);

	var iiidx = getRandomInt(0, chainManager.devices.length);
	var devtitle = chainManager.devices[iiidx].title;

	processMessage(devtitle, sid, v);

	_sensorIdx++;
	if(_sensorIdx == sarr.length) {
		_sensorIdx = 0;
	}
}