/**
 * Created by marian_mcpartland on 14/12/15.
 */
function WeatherEffect(scene, gZero)
{
	this._mode = "NONE";

	this._scene = scene;
	this._groundZero = gZero;

	this._snowParticuleParticules;
	this._snowParticuleEmitter;
}

WeatherEffect.prototype.create = function(type)
{
	if(type == "SNOW") {
		this._mode = type;
		this._snow();
	}
}

WeatherEffect.prototype._snow = function()
{
	this._snowParticuleParticules = new THREE.Geometry;
	for(var i = 0; i < 500; i++) {
		var particle = new THREE.Vector3(
			(Math.random() * 1000) - 500,
			Math.random() * 750 + this._groundZero,
			(Math.random() * 1000) -500
		);
		this._snowParticuleParticules.vertices.push(particle);
	}
	var snowParticuleEmitterTexture = THREE.ImageUtils.loadTexture('res/textures/snowflake.png');
	var snowParticuleEmitterMaterial = new THREE.PointCloudMaterial(
		{ map: snowParticuleEmitterTexture, transparent: true,
			blending: THREE.AdditiveBlending, size: 12 * Math.random(), color: 0xFFFFFF });

	this._snowParticuleEmitter = new THREE.PointCloud(this._snowParticuleParticules, snowParticuleEmitterMaterial);
	this._snowParticuleEmitter.sortParticles = true;
	this._snowParticuleEmitter.position.z = 0;
	this._scene.add(this._snowParticuleEmitter);
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
		if( particle.y < this._groundZero ) {
			particle.y = Math.random() * 750 + this._groundZero;
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
	}
}