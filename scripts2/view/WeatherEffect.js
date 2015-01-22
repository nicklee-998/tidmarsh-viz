/**
 * Created by marian_mcpartland on 14/12/15.
 */
function WeatherEffect()
{
	this._mode = "NONE";

	// Sunny
	this._sunnyLights = null;
	// Cloudy
	this._cloudyLights = null;
	// Fog
	this._fogLights = null;
	// Snow
	this._snowParticuleParticules;
	this._snowParticuleEmitter;
	this._snowLights = null;
	this._mountain = null;
	// Rain
	this._rainParticuleParticules;
	this._rainParticuleEmitter;
	this._rainLights = null;
	// Voronoi
	this._voronoiLights = null;
}

WeatherEffect.prototype.create = function(type)
{
	if(this._mode == type)
		return;

	if(this._mode == "SNOW") {
		this._clearSnow();
	} else if(this._mode == "RAIN") {
		this._clearRain();
	} else if(this._mode == "SUNNY") {
		this._clearSunny();
	} else if(this._mode == "CLOUDY") {
		this._clearCloudy();
	} else if(this._mode == "FOG") {
		this._clearFog();
	} else if(this._mode == "VORONOI") {
		this._clearVoronoi();
	}

	this._mode = type;

	if(type == "SNOW") {
		this._snow();
	} else if(type == "RAIN") {
		this._rain();
	} else if(type == "SUNNY") {
		this._sunny();
	} else if(type == "CLOUDY") {
		this._cloudy();
	} else if(type == "FOG") {
		this._fog();
	} else if(type == "VORONOI") {
		this._voronoi();
	}
}

WeatherEffect.prototype.showWeather = function()
{
	this._clearSunny();

	if(this._mode == "SNOW") {
		this._snow();
	} else if(this._mode == "RAIN") {
		this._rain();
	} else if(this._mode == "SUNNY") {
		this._sunny();
	} else if(this._mode == "CLOUDY") {
		this._cloudy();
	} else if(this._mode == "FOG") {
		this._fog();
	} else if(this._mode == "VORONOI") {
		this._voronoi();
	}
}

WeatherEffect.prototype.hideWeather = function()
{
	if(this._mode == "SNOW") {
		this._clearSnow();
	} else if(this._mode == "RAIN") {
		this._clearRain();
	} else if(this._mode == "SUNNY") {
		this._clearSunny();
	} else if(this._mode == "CLOUDY") {
		this._clearCloudy();
	} else if(this._mode == "FOG") {
		this._clearFog();
	} else if(this._mode == "VORONOI") {
		this._clearVoronoi();
	}

	this._sunny();
}

// ------------------------------------------------
//  WEATHER - VORONOI
// ------------------------------------------------
WeatherEffect.prototype._voronoi = function()
{
	if(this._voronoiLights == null) {

		var light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, groundZero + 500, 0 );
		scene.add( light );

		/// ambient light1
		var ambientLight = new THREE.AmbientLight(0xd5d5d5);
		ambientLight.position.set( 0, groundZero + 500, 0 );
		scene.add( ambientLight );

		this._voronoiLights = new Array();
		this._voronoiLights.push(light);
		this._voronoiLights.push(ambientLight)
	} else {
		for(var i = 0; i < this._voronoiLights.length; i++) {
			scene.add(this._voronoiLights[i]);
		}
	}
}

WeatherEffect.prototype._clearVoronoi = function()
{
	if(this._voronoiLights == null)
		return;

	for(var i = 0; i < this._voronoiLights.length; i++) {
		scene.remove(this._voronoiLights[i]);
	}
}

// ------------------------------------------------
//  WEATHER - SUNNY
// ------------------------------------------------
WeatherEffect.prototype._sunny = function()
{
	if(this._sunnyLights == null) {
		var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.95 );
		hemiLight.color.setHSL( 1, 1, 1 );
		hemiLight.groundColor.setHSL( 1, 1, 1 );
		hemiLight.position.set( 0, groundZero + 500, 0 );
		scene.add( hemiLight );

		this._sunnyLights = new Array();
		this._sunnyLights.push(hemiLight);
	} else {
		for(var i = 0; i < this._sunnyLights.length; i++) {
			scene.add(this._sunnyLights[i]);
		}
	}


	//var sphere = new THREE.SphereGeometry( 16, 16, 8 );
	//var light1 = new THREE.PointLight( 0xff0000, 0.5, 650 );
	//light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
	//light1.position.set(-300 , groundZero + 500, -300);
	//scene.add( light1 );

	//var spotLight = new THREE.SpotLight( 0xff0000, .75 );
	//spotLight.castShadow = true;
	//spotLight.shadowMapWidth = 1024;
	//spotLight.shadowMapHeight = 1024;
	//spotLight.position.set( 0, 500, 0 );
	//scene.add( spotLight );
}

WeatherEffect.prototype._clearSunny = function()
{
	if(this._sunnyLights == null)
		return;

	for(var i = 0; i < this._sunnyLights.length; i++) {
		scene.remove(this._sunnyLights[i]);
	}
}

WeatherEffect.prototype._animateSunny = function()
{

}

// ------------------------------------------------
//  WEATHER - CLOUDY
// ------------------------------------------------
WeatherEffect.prototype._cloudy = function()
{
	if(this._cloudyLights == null) {
		var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.7 );
		hemiLight.color.setHSL( 1, 1, 1 );
		hemiLight.groundColor.setHSL( 1, 1, 1 );
		hemiLight.position.set( 0, groundZero + 500, 0 );
		scene.add( hemiLight );

		this._cloudyLights = new Array();
		this._cloudyLights.push(hemiLight);
	} else {
		for(var i = 0; i < this._cloudyLights.length; i++) {
			scene.add(this._cloudyLights[i]);
		}
	}

}

WeatherEffect.prototype._clearCloudy = function()
{
	for(var i = 0; i < this._cloudyLights.length; i++) {
		scene.remove(this._cloudyLights[i]);
	}
}

WeatherEffect.prototype._animateCloudy = function()
{

}

// ------------------------------------------------
//  WEATHER - FOG
// ------------------------------------------------
WeatherEffect.prototype._fog = function()
{
	if(this._fogLights == null) {
		var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.7 );
		hemiLight.color.setHSL( 1, 1, 1 );
		hemiLight.groundColor.setHSL( 1, 1, 1 );
		hemiLight.position.set( 0, groundZero + 500, 0 );
		scene.add( hemiLight );

		this._fogLights = new Array();
		this._fogLights.push(hemiLight);
	} else {
		for(var i = 0; i < this._fogLights.length; i++) {
			scene.add(this._fogLights[i]);
		}
	}

	scene.fog.near = 1000;
	scene.fog.far = 2000;
}

WeatherEffect.prototype._clearFog = function()
{
	for(var i = 0; i < this._fogLights.length; i++) {
		scene.remove(this._fogLights[i]);
	}

	scene.fog.near = 6000;
	scene.fog.far = 6000;
}

WeatherEffect.prototype._animateFog = function()
{

}

// ------------------------------------------------
//  WEATHER - RAIN
// ------------------------------------------------
WeatherEffect.prototype._rain = function()
{
	if(this._rainLights == null) {
		// Rain light
		var hemilight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.7 );
		hemilight.color.setHSL( 1, 1, 1 );
		hemilight.groundColor.setHSL( 1, 1, 1 );
		hemilight.position.set( 0, groundZero + 500, 0 );
		scene.add( hemilight );
		this._rainLights = new Array();
		this._rainLights.push(hemilight);

		// Rain
		this._rainParticuleParticules = new THREE.Geometry;
		for(var i = 0; i < 500; i++) {
			var particle = new THREE.Vector3(
				(Math.random() * 1000) - 500,
				Math.random() * 750 + groundZero,
				(Math.random() * 1000) -500
			);
			this._rainParticuleParticules.vertices.push(particle);
		}
		var rainParticuleEmitterTexture = THREE.ImageUtils.loadTexture('res/textures/rain.png');
		var rainParticuleEmitterMaterial = new THREE.PointCloudMaterial({
			map: rainParticuleEmitterTexture,
			transparent: true,
			blending: THREE.AdditiveBlending,
			size: 12,
			color: 0xFFFFFF
		});

		this._rainParticuleEmitter = new THREE.PointCloud(this._rainParticuleParticules, rainParticuleEmitterMaterial);
		this._rainParticuleEmitter.sortParticles = true;
		this._rainParticuleEmitter.position.z = 210;
		this._rainParticuleEmitter.rotation.x = Math.PI / 2;
		ground.add(this._rainParticuleEmitter);
	} else {
		for(var i = 0; i < this._rainLights.length; i++) {
			scene.add(this._rainLights[i]);
		}
		ground.add(this._rainParticuleEmitter);
	}

}

WeatherEffect.prototype._clearRain = function()
{
	for(var i = 0; i < this._rainLights.length; i++) {
		scene.remove(this._rainLights[i]);
	}
	ground.remove(this._rainParticuleEmitter);
}

WeatherEffect.prototype._animateRain = function()
{
	var particleCount = this._rainParticuleParticules.vertices.length;
	while(particleCount--) {
		var particle = this._rainParticuleParticules.vertices[particleCount];
		particle.x -= 0;
		particle.y -= getRandomArbitrary(5, 8);
		particle.z -= 0;

		if( particle.x < -500 ) {
			particle.x = 500;
		}
		if( particle.y < groundZero ) {
			particle.y = Math.random() * 750 + groundZero;
		}
		if( particle.z < -500 ) {
			particle.z = 500;
		}
	}
	this._rainParticuleParticules.__dirtyVertices = true;
}

// ------------------------------------------------
//  WEATHER - SNOW
// ------------------------------------------------
WeatherEffect.prototype._snow = function()
{
	if(this._snowLights == null) {
		// Snow light
		var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.95 );
		hemiLight.color.setHSL( 1, 1, 1 );
		hemiLight.groundColor.setHSL( 1, 1, 1 );
		hemiLight.position.set( 0, groundZero + 500, 0 );
		scene.add( hemiLight );

		this._snowLights = new Array();
		this._snowLights.push(hemiLight);

		// Snow
		this._snowParticuleParticules = new THREE.Geometry;
		for(var i = 0; i < 500; i++) {
			var particle = new THREE.Vector3(
				(Math.random() * 1000) - 500,
				Math.random() * 750 + groundZero,
				(Math.random() * 1000) -500
			);
			this._snowParticuleParticules.vertices.push(particle);
		}
		var snowParticuleEmitterTexture = THREE.ImageUtils.loadTexture('res/textures/snowflake.png');
		var snowParticuleEmitterMaterial = new THREE.PointCloudMaterial({
			map: snowParticuleEmitterTexture,
			transparent: true,
			blending: THREE.AdditiveBlending,
			size: 12,
			color: 0xFFFFFF
		});

		this._snowParticuleEmitter = new THREE.PointCloud(this._snowParticuleParticules, snowParticuleEmitterMaterial);
		this._snowParticuleEmitter.sortParticles = true;
		this._snowParticuleEmitter.position.z = 210;
		this._snowParticuleEmitter.rotation.x = Math.PI / 2;
		ground.add(this._snowParticuleEmitter);

		// floor
		this._createSnowFloor( groundWid, groundHei, 15, 5, 5, 0xffffff );

	} else {
		for(var i = 0; i < this._snowLights.length; i++) {
			scene.add(this._snowLights[i]);
		}
		ground.add(this._snowParticuleEmitter);
		ground.add(this._mountain);
	}
}

WeatherEffect.prototype._clearSnow = function()
{
	for(var i = 0; i < this._snowLights.length; i++) {
		scene.remove(this._snowLights[i]);
	}
	ground.remove(this._snowParticuleEmitter);
	ground.remove(this._mountain);
}

WeatherEffect.prototype._createSnowFloor = function( width, depth, height, xSeg, ySeg, color )
{
	this._mountain = new THREE.Mesh(
		new THREE.PlaneGeometry( width, depth, xSeg, ySeg ),
		new THREE.MeshLambertMaterial( {
			color: color,
			transparent: true,
			opacity: 1,
			shading: THREE.FlatShading } )
	);

	this._mountain.castShadow = true;
	this._mountain.receiveShadow = true;

	for( var i = 0; i < this._mountain.geometry.vertices.length; i++ ){
		this._mountain.geometry.vertices[i].z = Math.floor( ( Math.random() * height ) );
	}

	var currentRow = 0;
	for( var i = 0; i < this._mountain.geometry.vertices.length; i++ ) {
		if( i != 0 && i % ( xSeg + 1 ) == 0 ) {
			currentRow++;
		}
		//First row
		if( i <= xSeg ){
			this._mountain.geometry.vertices[i].z = 0;
		}
		//left row
		if( i % xSeg == currentRow ){
			this._mountain.geometry.vertices[i].z = 0;
		}
		//right row
		if( i % ( xSeg + 1 ) == 0 ){
			this._mountain.geometry.vertices[i].z = 0;
		}
		//Last row
		if( i >= this._mountain.geometry.vertices.length-1 - ySeg) {
			this._mountain.geometry.vertices[i].z = 0;
		}
	}

	//this._mountain.rotation.x = degToRad( -90 );
	this._mountain.position.z = 2;

	ground.add( this._mountain );
}

WeatherEffect.prototype._animateSnow = function()
{
	var particleCount = this._snowParticuleParticules.vertices.length;
	while(particleCount--) {
		var particle = this._snowParticuleParticules.vertices[particleCount];
		particle.x -= 1;
		particle.y -= 2;
		particle.z -= 1;

		if( particle.x < -500 ) {
			particle.x = 500;
		}
		if( particle.y < groundZero ) {
			particle.y = Math.random() * 750 + groundZero;
		}
		if( particle.z < -500 ) {
			particle.z = 500;
		}
	}
	this._snowParticuleParticules.__dirtyVertices = true;
}

WeatherEffect.prototype.update = function()
{
	if(this._mode == "SNOW") {
		this._animateSnow();
	} else if(this._mode == "RAIN") {
		this._animateRain();
	}
}