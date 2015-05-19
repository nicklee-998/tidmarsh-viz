/**
 * Created by marian_mcpartland on 14/12/15.
 */

const CHAIN_API_URL = "http://chain-api.media.mit.edu/devices/?site_id=7";
const DEBUG_MODE = false;

var container, scene, renderer, camera, controls, sw, sh;
var ground, groundWid, groundHei, groundZero;
var stats;

// camera controllor params
var MIN_POLAR_ANGLE = 0.88;
var MAX_POLAR_ANGLE = 1.67;
var MIN_AZIMUTHAL_ANGLE = -0.008388765430145858;
var MAX_AZIMUTHAL_ANGLE = 0.02936067900551244;

// 3d scene state
var sceneState = 0;             // 0 - loading; 1 - Intro; 2 - Network&Data; 3 - Device

// loading animation
var _spinner;
var _counter;
var _counterIdx = 0;
var _counterTotal = 0;
var _counterInterval;

// ui
var mainmenu = null;
var mainmenuCurrent = null;
var intro = null;

// sensor node
var sensornode = null;
var SENSOR_NODE_HEIGHT = 2000;

//
var weather = null;
var weather_today = null;               // 进入网站时的默认天气
var network, chainManager, apManager;
var calendar = null;
var calendar_node = null;

// --------------------------
//  Scatter Plot
// --------------------------
var scatterGraph = null;                // Scatter plot graph
var scatterTimeGraph = null;            // Scatter plot graph
var menuScatterGraph = null;

// --------------------------
//  Health Graph
// --------------------------
var menuHealth, viewHealth = null;

// --------------------------
//  Power Graph
// --------------------------
var scene2, scene3;
var menuPower, powerview;

// interactive
var mouse = new THREE.Vector2();

// data history
var selectSensor;
var sensorTable = ["sht_temperature", "illuminance", "bmp_pressure", "sht_humidity", "battery_voltage"];
var sensorColorTable = ["#E77227", "#D81E00", "#E445BA", "#3242DF", "#57C66C"];

// --------------------------
//  Birds
// --------------------------
var lineChart;          // line chart of sensors

var menuData;           // menu of data history

// --------------------------
//  Birds
// --------------------------
var clock = new THREE.Clock();

// FOR TEST
var _sensorIdx = 0;
var square = null;

//
d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

// 不让网页文字选中
document.onselectstart = function() {
	return false;
}

$(document).ready(function() {

	// INIT UI
	initHealthCalendar();
	lineChart = new UiLineChart();
	menuData = new UiDataMenu();
	menuHealth = new UiHealthMenu();
	menuScatterGraph = new UiScatterplotMatrix("scatterplot_menu");

	// MAIN MENU
	jQuery.subscribe(MAINMENU_BEGIN, onMainMenuClick);
	jQuery.subscribe(MAINMENU_NETWORK, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DEVICE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_BEGIN_LEAVE, onMainMenuChange);
	jQuery.subscribe(MAINMENU_NETWORK_LEAVE, onMainMenuChange);
	jQuery.subscribe(MAINMENU_DATA_LEAVE, onMainMenuChange);
	jQuery.subscribe(MAINMENU_DEVICE_LEAVE, onMainMenuChange);

	jQuery.subscribe(MAINMENU_DATA_TEMPRATURE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_ILLUMINANCE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_PRESSURE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_HUMIDITY, onMainMenuClick);
	jQuery.subscribe(MAINMENU_DATA_VOLTAGE, onMainMenuClick);
	jQuery.subscribe(MAINMENU_REALTIME, onMainMenuClick);
	jQuery.subscribe(MAINMENU_HISTORY, onMainMenuClick);

	jQuery.subscribe(MAINMENU_HEALTH, onMainMenuClick);
	jQuery.subscribe(MAINMENU_HEALTH_LEAVE, onMainMenuChange);
	jQuery.subscribe(MAINMENU_POWER, onMainMenuClick);
	jQuery.subscribe(MAINMENU_POWER_LEAVE, onMainMenuChange);

	mainmenu = new UiMainMenu();
	mainmenuCurrent = MAINMENU_BEGIN;

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

	// --------------------------------
	// Register all event
	// --------------------------------
	registerAllEvent();

	// enter health mode
	jQuery.subscribe(NETWORK_VORONOI_MOUSE_OVER, onNetworkVoronoiOver);
	jQuery.subscribe(NETWORK_VORONOI_MOUSE_OUT, onNetworkVoronoiOut);
	jQuery.subscribe(LINE_CHART_DRAG, onLineChartDrag);
	network = new NodeNetwork();
});

/////////////////////////////////////////////
// Register all event
/////////////////////////////////////////////
function registerAllEvent()
{
	// ---------------------------------------
	//  Finished google map init things.
	// ---------------------------------------
	jQuery.subscribe(GMAP_INIT, function(e, d) {
		jQuery.unsubscribe(GMAP_INIT, e.handleObj.handler);

		// get gound wid/hei
		groundWid = d.gwid;
		groundHei = d.ghei;

		// INIT 3D
		init3d();
		// Show loading animation
		initLoadingScreen();

		// Start loading devices info from server...
		chainManager = new ChainManager(CHAIN_API_URL);
		chainManager.init();
	});

	// ---------------------------------------
	//  Loaded all devices summary.
	// ---------------------------------------
	jQuery.subscribe(SERVER_SUMMARY_COMPLETE, function(e, d) {
		jQuery.unsubscribe(SERVER_SUMMARY_COMPLETE, e.handleObj.handler);

		// for loading animation
		_counterTotal = d.totalCount;
		_counterInterval = setInterval(function() {
			var number = (_counterIdx / _counterTotal) * 100;
			_counter.countUpTo(Math.round(number));
		}, 800);
	});

	// ---------------------------------------
	//  Loaded one device info.
	// ---------------------------------------
	jQuery.subscribe(SERVER_DEVICE_INFO_COMPLETE, function(e, d) {
		// fixme: Should remove handler at last

		network.createDevice(d);
		// for opening loading
		_counterIdx++;
	});

	// ---------------------------------------
	//  Finished all devices init progress.
	// ---------------------------------------
	jQuery.subscribe(SERVER_INIT_COMPLETE, function(e) {
		jQuery.unsubscribe(SERVER_INIT_COMPLETE, e.handleObj.handler);

		network.createFakeDevices();
		network.createVoronoi();

		initInfoPanel();

		// stop update opening loader
		clearInterval(_counterInterval);
		_counter.countUpTo(99);
		clearLoadingScreen();
	});

	// ---------------------------------------
	// 外部模型载入完毕 *暂时没有用*
	// ---------------------------------------
	jQuery.subscribe(DEVICE_MODEL_LOADED, function(e) {
		jQuery.unsubscribe(DEVICE_MODEL_LOADED, e.handleObj.handler);
		// Not Used now...
	});

	// ---------------------------------------
	//  Node and sign clicked...
	// ---------------------------------------
	jQuery.subscribe(NETWORK_NORMAL_MESH_CLICK, function(e, d) {
		// 打开node提示板
		showNodeSign(d);
		// highlight scatter plot
		scatterGraph.highlightDevices([d.name]);
	});
	jQuery.subscribe(NETWORK_NORMAL_SIGN_CLICK, function(e, d) {
		// 隐藏scatter plot
		scatterGraph.hide();
		scatterTimeGraph.hide();
		menuScatterGraph.hide();
		showWeatherBig(false);
		// 打开node内容页
		showInfoPanel(d);
	});
	jQuery.subscribe(NODE_SIGN_CLOSED, function() {
		// 显示scatter plot
		scatterGraph.show();
		scatterTimeGraph.show();
		menuScatterGraph.show();
	});

	// ---------------------------------------
	//  Selected circle on scatter plot...
	// ---------------------------------------
	jQuery.subscribe(SCATTER_PLOT_START, function() {
		// 显示loader
		loader2start();
	});
	jQuery.subscribe(SCATTER_PLOT_PROGRESS, function(e, d) {
		loader2progress(d.idx, d.total);
	});
	jQuery.subscribe(SCATTER_PLOT_INIT, function() {
		// 隐藏loader
		loader2end();
		// 初始化日期菜单
		menuScatterGraph.resetDate(scatterGraph._start_time, scatterGraph._end_time);
	});

	jQuery.subscribe(SCATTER_PLOT_SELECTED, function(e, d) {
		// hidden sign
		hideNodeSign();
		// show deivces depend on selected plot
		network.selectDevicesFromScatterPlot(d.list);
		// show time
		scatterTimeGraph.draw(d.tlist);
	});

	jQuery.subscribe(SCATTER_PLOT_PREV, function() {
		putBackTime(24);
	});

	jQuery.subscribe(SCATTER_PLOT_NEXT, function() {
		putForwardTime(24);
	});

	jQuery.subscribe(SCATTER_PLOT_PREV_FAST, function() {
		putBackTime(240);
	});

	jQuery.subscribe(SCATTER_PLOT_NEXT_FAST, function() {
		putForwardTime(240);
	});

	jQuery.subscribe(SCATTER_PLOT_DATE_SELECTED, function(e, d) {
		scatterGraph.resetDate(d.start, d.end);
	});

	function putBackTime(hours)
	{
		var date = new Date(scatterGraph._start_time.toString());
		date.setHours(date.getHours() - hours);

		if(date < scatterGraph.dataHead) {
			return;
		}

		scatterGraph._start_time.setHours(scatterGraph._start_time.getHours() - hours);
		scatterGraph._end_time.setHours(scatterGraph._end_time.getHours() - hours);

		menuScatterGraph.resetDate(scatterGraph._start_time, scatterGraph._end_time);
		scatterGraph.resetDate(scatterGraph._start_time, scatterGraph._end_time);
	}

	function putForwardTime(hours)
	{
		var date = new Date(scatterGraph._end_time.toString());
		date.setHours(date.getHours() + hours);

		if(date > scatterGraph.dataTrail) {
			return;
		}

		scatterGraph._start_time.setHours(scatterGraph._start_time.getHours() + hours);
		scatterGraph._end_time.setHours(scatterGraph._end_time.getHours() + hours);

		menuScatterGraph.resetDate(scatterGraph._start_time, scatterGraph._end_time);
		scatterGraph.resetDate(scatterGraph._start_time, scatterGraph._end_time);
	}

	// ---------------------------------------
	//  Health View
	// ---------------------------------------
	jQuery.subscribe(HEALTH_NODE_MOUSE_OVER, function(e, d) {
		viewHealth.onMouseOver(d.name);
	});
	jQuery.subscribe(HEALTH_NODE_MOUSE_OUT, function(e, d) {
		viewHealth.onMouseOut(d.name);
	});

	jQuery.subscribe(NETWORK_HEALTH_NODE_SELECTED, function(e, d) {
		viewHealth.select(d);
		calendar_node = "./res/data_health/" + d + "_2014.csv";
		setHealthCalendar(calendar_node);
	});
	jQuery.subscribe(NETWORK_HEALTH_NODE_DESELECTED, function() {
		viewHealth.select(null);
		hideHealthCalendar();
	});

	// ---------------------------------------
	//  Power View
	// ---------------------------------------
	jQuery.subscribe(POWERMENU_CHANGE, function(e, d) {
		powerview.genMonthGraph(d);
	});
	jQuery.subscribe(POWERMENU_2D_3D, function(e, d) {
		powerview.changeView(d);
	});
	jQuery.subscribe(POWERMENU_STATISTIC_DATA, function(e, d) {
		menuPower.showStatisticData(d);
	});

	// ---------------------------------------
	//  SYSTEM EVENT
	// ---------------------------------------
	document.addEventListener( 'mousemove', function(event) {
		event.preventDefault();
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}, false);

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
	renderer.autoClear = false;
	//renderer.sortObjects = true;

	// Setup the camera
	camera = new THREE.PerspectiveCamera(45, sw / sh, 0.1, 10000);
	camera.position.y = 1000;
	camera.position.z = 1000;

	// Setup the scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xffffff, 4000, 4000);
	//scene.add(camera);
	container.append(renderer.domElement);

	// Setup scenes for power view
	scene2 = new THREE.Scene();
	scene3 = new THREE.Scene();

	// STATS
	//stats = new Stats();
	//$("#state").append(stats.domElement);

	// CONTROLS
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.autoRotate = false;
	controls.noZoom = true;
	controls.noRotate = true;
	controls.noPan = true;

	createWorld();

	// for test
	//weather = new WeatherEffect();
	//weather.create("CLOUDY");
	//animate();

	// -------------------------------------
	//  Init weather effect
	// -------------------------------------
	$.ajax({
		//url : "http://api.wunderground.com/api/21a533a6637f54ab/geolookup/forecast/astronomy/q/MA/manomet.json",
		url : "http://api.wunderground.com/api/21a533a6637f54ab/conditions/astronomy/q/MA/manomet.json",
		dataType : "jsonp",
		success : function(parsed_json) {
			//var forecast = parsed_json['forecast']['txt_forecast']['forecastday'][0]['fcttext'];
			var current = parsed_json['current_observation']['weather'];
			var sunrise_hour = parsed_json['moon_phase']['sunrise']['hour'];
			var sunrise_minute = parsed_json['moon_phase']['sunrise']['minute'];
			var sunset_hour = parsed_json['moon_phase']['sunset']['hour'];
			var sunset_minute = parsed_json['moon_phase']['sunset']['minute'];
			var sunrise_sunset = "sunrise: " + sunrise_hour + ":" + sunrise_minute + " / sunset: " + sunset_hour + ":" + sunset_minute;
			$("#forecast").text("Today in bog weather : " + current + " | " + sunrise_sunset);
			//$("#sunrise_sunset").text(sunrise_sunset);

			weather = new WeatherEffect();
			var wstr = parsed_json["current_observation"]["weather"].toLowerCase();
			if(wstr.indexOf("clear") != -1 || wstr.indexOf("sunny") != -1 || wstr.indexOf("sunshine") != -1) {
				weather_today = "SUNNY";
			} else if(wstr.indexOf("cloud") != -1 || wstr.indexOf("overcast") != -1) {
				weather_today = "CLOUDY";
			} else if(wstr.indexOf("snow") != -1) {
				weather_today = "SNOW";
			} else if(wstr.indexOf("rain") != -1 || wstr.indexOf("shower") != -1) {
				weather_today = "RAIN";
			} else if(wstr.indexOf("fog") != -1) {
				weather_today = "FOG";
			} else {
				// Default weather is sunny
				weather_today = "SUNNY";
			}
			weather.create(weather_today);

			// Update big weath menu
			$("#weather_big_temp").text(parsed_json["current_observation"]["temp_f"]);
			$("#weather_big_state").text(parsed_json["current_observation"]["weather"]);

			var bwid = $("#weather_big").width();
			var swid = $("#weather_big_state").width();
			//$("#weather_big_state").css("left", (bwid - 30) / 2 - swid / 2);
			var twid = $("#weather_big_temp").width();
			$("#weather_big_symbol").css("left", twid);
			$("#weather_big").css("right", bwid)

			// Animal & Planet effect
			//apManager = new APManager();
			//apManager.init();

			// Todo: Can't rely on weather api to start 3d program
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
	//createSensorNode();

	// FOR TEST
	//square = new THREE.Mesh(
	//	new THREE.PlaneBufferGeometry(50, 50, 20, 20),
	//	new THREE.MeshPhongMaterial({color: 0xff0000, shading: THREE.FlatShading, side: THREE.DoubleSide, transparent:true})
	//);
	//square.position.y = -5;
	//square.position.z = -150;
	//camera.add(square);
}

function createBaseGround()
{
	var texture = THREE.ImageUtils.loadTexture("./res/textures/map_area.jpg");
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.minFilter = THREE.NearestFilter;
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

function createSensorNode()
{
	var loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	loader.load('./res/SensorNode/sensornode.dae', function(collada) {
		sensornode = collada.scene.children[0];
		sensornode.scale.x = sensornode.scale.y = sensornode.scale.z = 2500;
		sensornode.position.y = SENSOR_NODE_HEIGHT;
		sensornode.visible = false;
		sensornode.updateMatrix();
		scene.add(sensornode);

		// ------------------------------
		// Send model loaded event
		// ------------------------------
		jQuery.publish(DEVICE_MODEL_LOADED);
	});
}

function animate()
{
	requestAnimationFrame(animate);
	render();
	//stats.update();
}

function render()
{
	if(infoSignPlane != null) {
		infoSignPlane.rotation.y = controls.getAzimuthalAngle();
	}

	renderer.clear();
	renderer.render(scene, camera);
	renderer.clearDepth();
	renderer.render(scene2, camera);
	renderer.clearDepth();
	renderer.render(scene3, camera);

	controls.update();

	if(network != null) {
		network.render(mouse.x, mouse.y);
	}
	if(calendar != null) {
		calendar.render(mouse.x, mouse.y);
	}
	if(weather != null) {
		weather.update();
	}
	if(apManager != null) {
		apManager.update(mouse.x, mouse.y);
	}
	if(powerview) {
		powerview.update(mouse);
	}
}

/////////////////////////////////////////////
// MAIN MENU
/////////////////////////////////////////////
function onMainMenuClick(e)
{
	if(e.type == MAINMENU_BEGIN) {
		// 显示介绍文字
		intro.showIntroPage();
		// 显示动物和植物
		if(apManager) apManager.showAP();
		// 显示天气
		// Todo: Should refresh everytime reshow weather
		weather.create(weather_today);
		// 显示气象数据
		showWeatherBig(true);
		// Enter scatter mode
		network.enterNoneMode();
		// Set 3d scene
		setScenePerspective(1);

	} else if(e.type == MAINMENU_NETWORK) {
		// 显示动物和植物
		if(apManager) apManager.showAP();
		// 显示天气效果
		if(weather) weather.create("CLOUDY");
		// 显示气象数据
		showWeatherSmall(false);
		// 显示scatter plot graph
		if(scatterGraph == null) {
			scatterGraph = new ScatterPlotGraph();
			scatterGraph.initDataset(chainManager.devices);
			scatterTimeGraph = new ScatterPlotTimeGraph("scatterplot_time");
		} else {
			scatterGraph.show();
		}
		scatterTimeGraph.show();
		menuScatterGraph.show();
		// Enter scatter mode
		network.enterScatterPlotMode();
		// Set default sign
		//var len = network.deviceBoxes.length - 1;
		//showNodeSign(network.deviceBoxes[getRandomInt(0, len)], 0.8);

		// Set 3d scene
		setScenePerspective(2);

	} else if(e.type == MAINMENU_DATA) {

		console.log("Mainmenu Data: " + mainmenu.currSelectSensorIdx + ", " + mainmenu.currSelectRH);
		// 隐藏动物和植物
		if(apManager) apManager.hideAP();
		// 切换天气
		if(weather) weather.create("VORONOI");
		// Hide weather bar
		showWeatherSmall(false);
		// Hide line chart
		showLineChart(false);
		// CLEAR GRAPH
		network.clearVoronoi(true);
		// Choose Sensor
		selectSensor = sensorTable[mainmenu.currSelectSensorIdx];
		// Set 3d scene
		setScenePerspective(3);

		if(mainmenu.currSelectSensorIdx == 0) {
			// Recolor dragbar and cal
			//recolorDragbar("#E77227");
			$(".ui-state-active").css("background", "#E77227");
			$("#mainmenu_selector").css("background", "#E77227");
			$(".line_chart_dragger").css("fill", "#E77227");
			//$(".line_chart_dragger_date").css("fill", "#E77227");
		} else if(mainmenu.currSelectSensorIdx == 1) {
			// Recolor dragbar
			//recolorDragbar("#D81E00");
			$(".ui-state-active").css("background", "#D81E00");
			$("#mainmenu_selector").css("background", "#D81E00");
			$(".line_chart_dragger").css("fill", "#D81E00");
			//$(".line_chart_dragger_date").css("fill", "#D81E00");
		} else if(mainmenu.currSelectSensorIdx == 2) {
			// Recolor dragbar
			//recolorDragbar("#E445BA");
			$(".ui-state-active").css("background", "#E445BA");
			$("#mainmenu_selector").css("background", "#E445BA");
			$(".line_chart_dragger").css("fill", "#E445BA");
			//$(".line_chart_dragger_date").css("fill", "#E445BA");
		} else if(mainmenu.currSelectSensorIdx == 3) {
			// Recolor dragbar
			//recolorDragbar("#3242DF");
			$(".ui-state-active").css("background", "#3242DF");
			$("#mainmenu_selector").css("background", "#3242DF");
			$(".line_chart_dragger").css("fill", "#3242DF");
			//$(".line_chart_dragger_date").css("fill", "#3242DF");
		} else if(mainmenu.currSelectSensorIdx == 4) {
			// Recolor dragbar
			//recolorDragbar("#57C66C");
			$(".ui-state-active").css("background", "#57C66C");
			$("#mainmenu_selector").css("background", "#57C66C");
			$(".line_chart_dragger").css("fill", "#57C66C");
			//$(".line_chart_dragger_date").css("fill", "#57C66C");
		}

		if(mainmenu.currSelectRH == 0) {
			// Start flashing
			menuData.flashWaitMessageLabel(true);
			// Hide cal and dragbar
			menuData.showMe(DATA_REALTIME_OPEN);
			showDragBar(false);
			// realtime
			network.enterVoronoi("REALTIME");
		} else {
			// 如果没有默认的日期，跳出日期框进行选择
			// 否则使用默认的日期
			if(sliderYear == null) {
				// menu
				menuData.showMe(DATA_HISTORY_SELECT_DATE);
			} else {
				getDevicesDataBySensorMenu();
			}

			// history
			network.enterVoronoi("HISTORY");
		}

	} else if(e.type == MAINMENU_HEALTH) {

		// 隐藏动物和植物
		if(apManager) apManager.hideAP();
		// 关闭天气
		weather.create("CLOUDY");
		// weather big
		showWeatherBig(false);
		showWeatherSmall(false);
		// CLEAR GRAPH
		network.closeIncomingMessage();
		network.clearVoronoi(true);
		network.enterHealthGraph();

		// Health graph
		if(viewHealth == null) {
			viewHealth = new HealthView();
			viewHealth.create("./res/data_health/2014_all.csv", network.devices);
		}
		// Device health
		hideHealthCalendar();
		viewHealth.show();
		menuHealth.showMe();
		// Set 3d scene
		setScenePerspective(4);

	} else if(e.type == MAINMENU_POWER) {

		// 隐藏动物和植物
		if(apManager) apManager.hideAP();
		// 关闭天气
		weather.create("CLOUDY");
		// weather big
		showWeatherBig(false);
		showWeatherSmall(false);
		// CLEAR GRAPH
		network.closeIncomingMessage();
		network.clearVoronoi(true);
		network.enterPowerGraph();

		if(!powerview) {
			powerview = new PowerView(scene, scene2, scene3, camera, "voltage_tooltip");
			menuPower = new UiPowerViewMenu("submenu");
		}
		powerview.show();
		menuPower.show();

		// Set 3d scene
		setScenePerspective(5);
	}

	mainmenuCurrent = e.type;
}

function onMainMenuChange(e)
{
	// -------------------------
	//  Clear menu first
	// -------------------------
	switch(e.type) {
		case MAINMENU_BEGIN_LEAVE:
			if(mainmenuCurrent != e.type) {
				// 隐藏介绍文字
				intro.hideIntroPage();
				// weather big
				showWeatherBig(false);
			}

			break;
		case MAINMENU_NETWORK_LEAVE:
			// 隐藏信息板
			hideInfoPanel();
			if(mainmenuCurrent != e.type) {
				// 隐藏指示牌
				hideNodeSign();
			}
			// 隐藏scatter plot graph
			scatterGraph.hide();
			scatterTimeGraph.hide();
			menuScatterGraph.hide();

			break;
		case MAINMENU_DATA_LEAVE:
			// CLEAR GRAPH
			network.closeIncomingMessage();
			network.clearVoronoi(true);
			// Stop flashing
			menuData.flashWaitMessageLabel(false);
			// Hide cal and dragbar
			menuData.hideMe();

			showDragBar(false);
			showLineChart(false);

			// 清楚日期数据，进入重新选择
			sliderYear = null;
			sliderMonth = null;
			sliderDay = null;

			break;
		case MAINMENU_HEALTH_LEAVE:
			// Device health
			hideHealthCalendar();
			menuHealth.hideMe();
			viewHealth.hide();
			network.restoreNodes();

			break;
		case MAINMENU_POWER_LEAVE:
			powerview.hide();
			menuPower.hide();
			network.restoreNodes();

			break;
		default :
			break;
	}
}

/////////////////////////////////////////////
// 3d Scene's Perspective
/////////////////////////////////////////////
function setScenePerspective(idx)
{
	if(sceneState == idx)
		return;

	if(camera.fov == 1) {
		camera.fov = 45;
		camera.far = 10000;
		camera.updateProjectionMatrix();
	}
	scene.fog.near = 4000;
	scene.fog.far = 4000;
	controls.minPolarAngle = 0;
	controls.maxPolarAngle = Math.PI;
	controls.minDistance = 500;
	controls.maxDistance = 3500;
	ground.visible = true;

	if(idx == 1) {
		TweenMax.to(ground.position, 0.9, {x:0, y: -430, delay:0, ease:Quint.easeOut});
		TweenMax.to(camera.position, 1.1, {x:0, y:-320, z:1532, delay:0.1, ease:Quart.easeInOut, onComplete:function() {
			// set control
			controls.minPolarAngle = controls.getPolarAngle();
			controls.maxPolarAngle = controls.getPolarAngle();
		}});

		// Hide calendar
		if(calendar != null) {
			calendar.hide();
		}

		sceneState = 1;

	} else if(idx == 2) {
		TweenMax.to(ground.position, 1, {x:200, y: -220, delay:0.1, ease:Quint.easeOut});
		TweenMax.to(camera.position, 1.2, {x:422, y:656, z:1357, delay:0, ease:Quart.easeOut, onComplete:function() {
			// set control
			controls.minPolarAngle = MIN_POLAR_ANGLE;
			controls.maxPolarAngle = MAX_POLAR_ANGLE;
			//controls.minPolarAngle = controls.getPolarAngle();
			//controls.maxPolarAngle = controls.getPolarAngle();
		}});

		// Hide calendar
		if(calendar != null) {
			calendar.hide();
		}

		sceneState = 2;

	} else if(idx == 3) {
		TweenMax.to(ground.position, 1, {x:0, y: -220, delay:0.1, ease:Quint.easeOut});
		TweenMax.to(camera.position, 1.2, {x:0, y:550, z:1466, delay:0, ease:Quart.easeOut, onComplete:function() {
			// set control
			controls.minPolarAngle = MIN_POLAR_ANGLE;
			controls.maxPolarAngle = MAX_POLAR_ANGLE;
			//controls.minPolarAngle = controls.getPolarAngle();
			//controls.maxPolarAngle = controls.getPolarAngle();
		}});

		// Hide calendar
		if(calendar != null) {
			calendar.hide();
		}

		sceneState = 3;
	} else if(idx == 4) {

		TweenMax.to(ground.position, 1, {x:0, y:-430, ease:Quint.easeOut});
		TweenMax.to(camera.position, 1.2, {x:440, y:395, z:1828, ease:Quart.easeOut});

		// Hide calendar
		if(calendar != null) {
			calendar.hide();
		}

		sceneState = 4;
	} else if(idx == 5) {

		ground.visible = false;

		TweenMax.to(camera.position, 1.2, {x:1946, y:1755, z:2912, ease:Quart.easeOut});

		controls.maxDistance = Infinity;
		scene.fog.near = 1000000;
		scene.fog.far = 1000000;

		sceneState = 5;
	}
}

/////////////////////////////////////////////
// Voronoi Menu
/////////////////////////////////////////////
function onNetworkVoronoiOver(e, d)
{
	console.log("mouse over: " + d);
	lineChart.highlight(d);
}

function onNetworkVoronoiOut(e, d)
{
	console.log("mouse out: " + d);
	lineChart.highlight(null);
}

/////////////////////////////////////////////
// Line chart drag
/////////////////////////////////////////////
function onLineChartDrag(e, d)
{
	//console.log("line drag: " + d);
	updateNetworkNode(d);
}

/////////////////////////////////////////////
// Device 3D Model
/////////////////////////////////////////////
function showDeviceMode(flg)
{
	if(sensornode) {

		if(flg) {
			sensornode.visible = true;
			TweenMax.to(sensornode.position, 1, {y:0, ease:Quint.easeOut, onComplete:function() {
				// calendar
				if(calendar == null) {
					calendar = new CalendarEffect(scene, camera);
				}
				calendar.init(2014, calendar_node);
			}});
		} else {
			if(sensornode.visible) {
				TweenMax.to(sensornode.position, 1, {y:SENSOR_NODE_HEIGHT, ease:Quint.easeOut, onComplete:function() {
					sensornode.visible = false;
				}});
			}
		}
	}
}

/////////////////////////////////////////////
// MAIN LOADING ANIMATION
/////////////////////////////////////////////
function initLoadingScreen()
{
	// 3d scene
	camera.position.x = 3107;
	camera.position.y = 2085;
	camera.position.z = 4262;

	ground.position.y = 860;

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
	TweenMax.to(ground.position, 2, {y: -430, delay:0.7, ease:Quint.easeOut});
	TweenMax.to(camera.position, 2.5, {x:0, y:-320, z:1532, delay:1.1, ease:Quart.easeInOut, onComplete:function() {
		// ui
		mainmenu.show();
		$("#weather").animate({
			"bottom": 0
		}, 500);
		// show ap
		if(apManager) apManager.showAP();
		// show intro
		intro.showIntroPage(200);
		// show big weather
		showWeatherBig(true);
		// set control
		controls.minPolarAngle = controls.getPolarAngle();
		controls.maxPolarAngle = controls.getPolarAngle();
		controls.minDistance = 500;
		controls.maxDistance = 3500;
		controls.noZoom = false;
		controls.noRotate = false;
		controls.noPan = false;
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

function showWeatherBig(flg)
{
	if(flg) {
		var wid = parseInt($('#weather_big').css('width'));
		$('#weather_big').css('visibility', 'visible');
		$('#weather_big').css('right', '-' + wid + 'px');
		$('#weather_big').animate({right:'50px'}, 500, 'easeOutQuint');
	} else {
		var wid = parseInt($('#weather_big').css('width'));
		$('#weather_big').animate({right: '-' + wid + 'px'}, 500, 'easeOutQuint', function() {
			$('#weather_big').css('visibility', 'hidden');
		});
	}
}

function showWeatherSmall(flg)
{
	if(flg) {
		var hei = parseInt($('#weather').css('height'));
		$('#weather').css('visibility', 'visible');
		$('#weather').css('bottom', '-' + hei + 'px');
		$('#weather').animate({bottom:'0px'}, 300, 'easeOutQuint');
	} else {
		var hei = parseInt($('#weather').css('height'));
		$('#weather').animate({bottom:'-' + hei + 'px'}, 300, 'easeOutQuint', function() {
			$('#weather').css('visibility', 'hidden');
		});
	}
}

function showLineChart(flg)
{
	if(flg) {
		var hei = parseInt($('#chart_div').css('height'));
		$('#chart_div').css('visibility', 'visible');
		$('#chart_div').css('bottom', '-' + hei + 'px');
		$('#chart_div').animate({bottom:'0px'}, 300, 'easeOutQuint');
	} else {
		var hei = parseInt($('#chart_div').css('height'));
		$('#chart_div').animate({bottom:'-' + hei + 'px'}, 300, 'easeOutQuint', function() {
			$('#chart_div').css('visibility', 'hidden');
		});
	}
}

/////////////////////////////////////////////
// GET SENSOR HISTORY DATA
/////////////////////////////////////////////
function getDevicesDataBySensorMenu()
{
	// Hide cal and dragbar
	menuData.hideMe();
	showDragBar(false);
	// disable mouse event
	network.disableMouseEvent = true;

	var arr = new Array();
	for(var i = 0; i < chainManager.devices.length; i++) {
		arr.push(chainManager.devices[i].title);
	}

	jQuery.subscribe(SERVER_DEVICE_LIST_START, onDeviceData);

	if(DEBUG_MODE) {

		// -----------------------------------
		// Send device list start event
		// -----------------------------------
		jQuery.publish(SERVER_DEVICE_LIST_START);

		$.ajax({
			url : "./res/fortest/sensor_data_illuminace.txt",
			success : function (data) {
				chainManager._dFactory.dataset = JSON.parse(data);

				// -----------------------------------
				// Send device list complete event
				// -----------------------------------
				jQuery.publish(SERVER_DEVICE_LIST_COMPLETE);
			}
		});
	} else {
		//chainManager.fetchMultiDevicesByDate(arr, [selectSensor],
		//	{year:sliderYear, month:sliderMonth, day:sliderDay, hour:0, minu:0, sec:0},
		//	{year:sliderYear, month:sliderMonth, day:sliderDay, hour:23, minu:59, sec:59});

		chainManager.fetchMultiDevicesByDate2(arr, [selectSensor],
			{year:sliderYear, month:sliderMonth, day:sliderDay, hour:0, minu:0, sec:0},
			{year:sliderYear, month:sliderMonth, day:sliderDay, hour:23, minu:59, sec:59});
	}
}

function onDeviceData(e, i)
{
	if(e.type == SERVER_DEVICE_LIST_START) {
		// 开始载入数据集
		jQuery.unsubscribe(SERVER_DEVICE_LIST_START, onDeviceData);
		jQuery.subscribe(SERVER_DEVICE_DATA_COMPLETE, onDeviceData);
		jQuery.subscribe(SERVER_DEVICE_LIST_COMPLETE, onDeviceData);
		jQuery.subscribe(SERVER_DEVICE_DATA_PROGRESS, onDeviceData);
		console.log("开始载入数据集!");

		// 隐藏日历
		menuData.hideMe();
		//showLineChart(false);
		$('#chart_div').css('visibility', 'hidden');
		//showUIMenu(false);

		// 显示loader
		loader2start();
	} else if(e.type == SERVER_DEVICE_DATA_PROGRESS) {

		loader2progress(i.idx, i.total);

	} else if(e.type == SERVER_DEVICE_DATA_COMPLETE) {

		//console.log(i);
		$(".loading-text").text("Loading " + i.title + "...");

	} else if(e.type == SERVER_DEVICE_LIST_COMPLETE) {
		jQuery.unsubscribe(SERVER_DEVICE_DATA_COMPLETE, onDeviceData);
		jQuery.unsubscribe(SERVER_DEVICE_LIST_COMPLETE, onDeviceData);
		jQuery.unsubscribe(SERVER_DEVICE_DATA_PROGRESS, onDeviceData);

		console.log("数据集载入完毕!");

		// 显示菜单, 默认载入中午
		//updateSliderInfo(bar.offsetLeft + bar_line.offsetLeft + bar_line.offsetWidth/2, 0.5);
		//updateNetworkNode();

		// 显示日历和拖动条
		menuData.showMe(DATA_HISTORY_EXPLORE);
		showLineChart(true);
		//showDragBar(true);
		//showUIMenu(true);

		// 隐藏loader
		loader2end();
		// 打开鼠标事件
		network.disableMouseEvent = false;

		// 显示当前时间
		var datestr = sliderYear + "." + (sliderMonth + 1) + "." + sliderDay;
		$("#history_date").text(datestr);

		// Draw line graph
		var start = new Date(sliderYear, sliderMonth, sliderDay, 0, 0, 0);
		var end = new Date(sliderYear, sliderMonth, sliderDay, 23, 59, 59);
		lineChart.make(selectSensor, start, end, chainManager._dFactory.dataset);
		// init dragger positon
		lineChart.updateDragger(0.5);
	}
}

function updateNetworkNode(date)
{
	for(var i = 0; i < chainManager.devices.length; i++)
	{
		var dat = chainManager.fetchData(chainManager.devices[i].title, selectSensor, date);
		if(dat != null) {
			network.updateVoronoi(dat.did, dat.sid, dat.value, date);
		}
	}
}

/////////////////////////////////////////////
// JUST FOR TEST
/////////////////////////////////////////////
function onKeyboardDown()
{
	// 返回键退出
	if(d3.event.keyCode == 27)
	{

	}
	else if(d3.event.keyCode == 66) 	// B:
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
		console.log("= Camera Info =================================");
		console.log(camera.position);
		console.log("Polar Angle = " + controls.getPolarAngle());
		console.log("Azimuthal Angle = " + controls.getAzimuthalAngle());
		console.log("Plane position = (" + ground.position.x + "," + ground.position.y + "," + ground.position.z + ")");
		console.log("===============================================");
	}
	else if(d3.event.keyCode == 73)	// I:
	{
		var cfile = "./res/data_health/2014_all.csv"
		network.createHealthGraph(cfile);
	}
	else if(d3.event.keyCode == 74) // J:
	{
		network.showHealthGraph(2);
	}
	else if(d3.event.keyCode == 75) // K:
	{
		network.showHealthGraph(1);
	}
	else if(d3.event.keyCode == 79)	// O:
	{
		controls.noZoom = !controls.noZoom;
	}
	else if(d3.event.keyCode == 80)	// P:
	{
		if(controls.minPolarAngle != controls.maxPolarAngle) {
			controls.minPolarAngle = controls.getPolarAngle();
			controls.maxPolarAngle = controls.getPolarAngle();
		} else {
			controls.minPolarAngle = 0;
			controls.maxPolarAngle = Math.PI;
		}
	}
	else if(d3.event.keyCode == 76)	// L:
	{
		if(controls.minAzimuthAngle == -Infinity) {
			controls.minAzimuthAngle = 0;
			controls.maxAzimuthAngle = 0;
		} else {
			controls.minAzimuthAngle = -Infinity;
			controls.maxAzimuthAngle = Infinity;
		}
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

		//square.position.y -= 10;
	}
	else if(d3.event.keyCode == 53)	// 5
	{
		weather.create("FOG");

		//square.position.y += 10;
	}
	else if(d3.event.keyCode == 54)	// 6
	{
		weather.create("VORONOI");
		//square.position.x -= 10;
	}
	else if(d3.event.keyCode == 55)	// 7
	{
		square.position.x += 10;
	}
	else if(d3.event.keyCode == 56)	// 8
	{
		//calendar.show();
		//calendar._dayContainer.position.z -= 10;
		//ground.position.y -= 10;

		square.position.z -= 10;
	}
	else if(d3.event.keyCode == 57)	// 9
	{
		//calendar.hide();
		//calendar._dayContainer.position.z += 10;
		//ground.position.y += 10;

		square.position.z += 10;
	}
	else if(d3.event.keyCode == 78)	// N:
	{

	}
	else if(d3.event.keyCode == 77)	// M:
	{

	}

	//console.log(d3.event.keyCode);
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

	var now = new Date();
	//network.updateNode(devtitle, now);

	if(mainmenu.currSelectIdx == 3 && mainmenu.currSelectRH == 0) {
		var str = devtitle + " " + sid + " is " + v.toFixed(2) + conf.unit + " now.";
		// Stop flashing
		menuData.flashWaitMessageLabel(false);
		menuData.showMe(DATA_REALTIME_OPEN, {message: str});
		network.updateVoronoi(devtitle, sid, v, now);
	}

	_sensorIdx++;
	if(_sensorIdx == sarr.length) {
		_sensorIdx = 0;
	}
}