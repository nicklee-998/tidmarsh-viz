/**
 * Created by marian_mcpartland on 14/12/15.
 */

var container, scene, renderer, camera, controls, sw, sh;
var ground, groundWid, groundHei, groundZero;
var stats;

var weather = null, weatherManager;
var network, chainManager;

// FOR TEST
var _sensorIdx = 0;

$(document).ready(function() {

	// INIT 3D
	init3d();
	// Init weather effect
	weather = new WeatherEffect(scene, groundZero);
	weather.create("SNOW");

	jQuery.subscribe(GMAP_INIT, onGmapInit);
	network = new NodeNetwork();
});

function onGmapInit()
{
	jQuery.unsubscribe(GMAP_INIT, onGmapInit);

	jQuery.subscribe(SERVER_SUMMARY_COMPLETE, onServerSummary);
	jQuery.subscribe(SERVER_DEVICE_INFO_COMPLETE, onDeviceInfoComplete);
	jQuery.subscribe(SERVER_INIT_COMPLETE, onServerInitCompelte);
	chainManager = new ChainManager("http://chain-api.media.mit.edu/devices/?site_id=7");
	chainManager.init();
}

function onServerSummary(e, i)
{
	//_counterTotal = i.totalCount;
	//
	//_counterInterval = setInterval(function() {
	//	var number = (_counterIdx / _counterTotal) * 100;
	//	_counter.countUpTo(Math.round(number));
	//}, 800);
}

function onDeviceInfoComplete(e, i)
{
	network.createDevice(i);

	//_counterIdx++;
}

function onServerInitCompelte()
{
	jQuery.unsubscribe(SERVER_SUMMARY_COMPLETE, onServerSummary);
	jQuery.unsubscribe(SERVER_DEVICE_INFO_COMPLETE, onDeviceInfoComplete);
	jQuery.unsubscribe(SERVER_INIT_COMPLETE, onServerInitCompelte);

	network.createFakeDevices();
	network.createVoronoi();

	// stop update opening loader
	//clearInterval(_counterInterval);
	//_counter.countUpTo(99);
}

function init3d()
{
	container = $("#playground");
	sw = window.innerWidth;
	sh = window.innerHeight;

	// Setup the renderer
	renderer = new THREE.WebGLRenderer({ antialias:true });
	renderer.setSize(sw, sh);

	// Setup the camera
	camera = new THREE.PerspectiveCamera(45, sw / sh, 0.1, 10000);
	camera.position.y = 1000;
	camera.position.z = 1000;

	// Setup the scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x111111, 4000, 4000);
	scene.add(camera);
	container.append(renderer.domElement);

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
	});

	createWorld()
	animate();
}

function createWorld()
{
	createGloalLight();
	createBaseGround();
}

function createGloalLight()
{
	for( var i = 0; i < 4; i++ ) {

		var spotLight = new THREE.SpotLight( 0xffffff, .75 );
		spotLight.castShadow = true;
		spotLight.shadowMapWidth = 1024;
		spotLight.shadowMapHeight = 1024;

		if( i == 0 ) {
			spotLight.position.set( -750, 700, 750 );
			scene.add( spotLight );
		}
		else if( i == 1 ) {
			spotLight.position.set( -750, 700, -750 );
			scene.add( spotLight );
		}
		else if( i == 2 ) {
			spotLight.position.set( 750, 700, -750 );
			scene.add( spotLight );
		}
		else if( i == 3 ) {
			spotLight.position.set( 750, 700, 750 );
			scene.add( spotLight );
		}
	}
}

function createBaseGround()
{
	groundWid = 1000;
	groundHei = 1000;

	var texture = THREE.ImageUtils.loadTexture("./res/textures/map_area.jpg", THREE.UVMapping);
	ground = new THREE.Mesh(
		new THREE.PlaneGeometry(groundWid, groundHei, 200, 200),
		new THREE.MeshBasicMaterial({map: texture})
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
}

function render()
{
	renderer.render(scene, camera);
	controls.update();
}

function processMessage(did, sid, value)
{
	network.updateVoronoi(did, sid, value);
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
	else if(d3.event.keyCode == 67) 	// C:
	{

	}
	else if(d3.event.keyCode == 68) 	// D:
	{

	}
	else if(d3.event.keyCode == 69)         // E:
	{

	}
	else if(d3.event.keyCode == 73)	// I:
	{

	}
}
d3.select("body").on("keydown", onKeyboardDown);

function simulateIncomingData()
{
	// 模拟incoming message
	var sarr = ["sht_temperature", "illuminance", "bmp_pressure", "sht_humidity", "battery_voltage"];
	var sid = sarr[_sensorIdx];
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