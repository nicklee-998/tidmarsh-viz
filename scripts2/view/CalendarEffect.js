/**
 * Created by marian_mcpartland on 15/1/14.
 */
function CalendarEffect(scene, camera)
{
	this._scene = scene;
	this._camera = camera;

	this._dayContainer;

	this._cellSize = 30;
	this._width = (this._cellSize + 1) * 53;
	this._height = (this._cellSize + 1) * 7;

	// mouse
	this._raycaster = new THREE.Raycaster();
}

CalendarEffect.prototype.init = function(year)
{
	var day = d3.time.format("%w"),
		week = d3.time.format("%U");
	var days = d3.time.days(new Date(year, 0, 1), new Date(year+1, 0, 1));

	// init container
	if(this._dayContainer == null) {
		this._dayContainer = new THREE.Object3D();
		this._dayContainer.rotation.x = Math.PI;
		this._dayContainer.visible = false;
		this._scene.add(this._dayContainer);
	}

	for(var i = 0; i < days.length; i++) {

		var daymesh = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(30, 30, 20, 20),
			new THREE.MeshPhongMaterial({color: 0xff0000, shading: THREE.FlatShading, side: THREE.DoubleSide, transparent:true})
		);
		daymesh.position.x = this._width / 2 - week(days[i]) * 31;
		daymesh.position.y = day(days[i]) * 31;
		daymesh.name = days[i];
		daymesh.userData = {origPosX:daymesh.position.x, origPosY:daymesh.position.y, origPosZ:daymesh.position.z,
			origRotX:daymesh.rotation.x, origRotY:daymesh.rotation.y, origRotZ:daymesh.rotation.z};
		this._dayContainer.add(daymesh);
	}
}

CalendarEffect.prototype.show = function()
{
	for(var i = 0; i < this._dayContainer.children.length; i++) {

		var pDay = this._dayContainer.children[i];
		//pDay.material.opacity = 1;
		var px = pDay.userData.origPosX;
		var py = pDay.userData.origPosY;
		var pz = pDay.userData.origPosZ;
		var rx = pDay.userData.origRotX;
		var ry = pDay.userData.origRotY;
		var rz = pDay.userData.origRotZ;
		var rt = getRandomArbitrary(0.1, 1);

		TweenMax.to(pDay.position, 1, {x:px, y:py, z:pz, delay: rt, ease:Expo.easeOut});
		TweenMax.to(pDay.rotation, 1, {x:rx, y:ry, z:rz, delay: rt, ease:Circ.easeOut});
		TweenMax.to(pDay.material, 1, {opacity:1, delay: rt, ease:Expo.easeOut});
	}
}


CalendarEffect.prototype.hide = function()
{
	console.log("hide");
	for(var i = 0; i < this._dayContainer.children.length; i++) {

		var pDay = this._dayContainer.children[i];

		var rx = pDay.position.x * getRandomArbitrary(3, 6) + getRandomArbitrary(-100, 100);
		var ry = pDay.position.y * getRandomArbitrary(3, 8) + getRandomArbitrary(-1000, 1000);
		var rz = -getRandomArbitrary(1250, 1550);
		var rt = 0;
		var rr = getRandomArbitrary(-Math.PI * 7, Math.PI * 7);

		TweenMax.to(pDay.position, 1.2, {x:rx, y:ry, z: rz, delay: rt, ease:Expo.easeOut});
		TweenMax.to(pDay.rotation, 1.2, {x:rr, y:rr, z: rr, delay: rt, ease:Expo.easeOut});
		TweenMax.to(pDay.material, 1.2, {opacity:0, delay: rt, ease:Expo.easeOut});
	}
}

CalendarEffect.prototype.render = function(mx, my)
{
	var vector = new THREE.Vector3(mx, my, 1).unproject(this._camera);
	this._raycaster.set(this._camera.position, vector.sub(this._camera.position).normalize());
	var intersects = raycaster.intersectObjects(this._dayContainer.children, false);

	if(intersects.length > 0) {
		//console.log(intersects[0].object.name);
	}

	// animation
	//var time = Date.now() * 0.001;
	//
	//if(this._dayContainer != null) {
	//	for(var i = 0; i < this._dayContainer.children.length; i++) {
	//		var pDay = this._dayContainer.children[i];
	//		//pDay.position.z = 20 * Math.sin( time * getRandomArbitrary(0.1, 0.5) );
	//		pDay.rotation.x = Math.PI * Math.sin( time * 0.5 );
	//		//pDay.rotation.y = Math.PI * Math.sin( time * 0.5 );
	//	}
	//}
}

