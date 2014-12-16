/**
 * Created by marian_mcpartland on 14/12/15.
 */

var container, scene, renderer, camera, controls, sw, sh;
var ground, groundWid, groundHei, groundZero;
var stats;

var weather = null, wManager;
var network, chainManager;

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

	network.createDevices();
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