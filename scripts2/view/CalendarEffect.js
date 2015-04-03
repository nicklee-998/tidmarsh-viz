/**
 * Created by marian_mcpartland on 15/1/14.
 */
function CalendarEffect(scene, camera)
{
	this._scene = scene;
	this._camera = camera;

	this._dayContainer;

	this._isShow = false;

	this._cellSize = 30;
	this._width = (this._cellSize + 1) * 53;
	this._height = (this._cellSize + 1) * 7;

	// mouse
	this._raycaster = new THREE.Raycaster();
	this._intersect = null;

	// click day mesh
	document.addEventListener( 'mouseup', function() {
		if(self._intersect) {
			square = self._intersect;
			console.log(self._intersect.name);
		}
	}, false );

	var self = this;
}

CalendarEffect.prototype.init = function(year, csvfile)
{
	var day = d3.time.format("%w"),
		week = d3.time.format("%U");
	var days = d3.time.days(new Date(year, 0, 1), new Date(year+1, 0, 1));

	// init container
	if(this._dayContainer == null) {
		this._dayContainer = new THREE.Object3D();
		this._dayContainer.position.y = -220;
		this._dayContainer.position.z = 250;
		this._dayContainer.rotation.x = Math.PI;
		this._dayContainer.rotation.y = Math.PI;
		//this._dayContainer.visible = false;
		this._scene.add(this._dayContainer);

		// create day mesh
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

			// reset position
			daymesh.position.x = daymesh.position.x * getRandomArbitrary(3, 6) + getRandomArbitrary(-100, 100);
			daymesh.position.y = daymesh.position.y * getRandomArbitrary(3, 8) + getRandomArbitrary(-1000, 1000);
			daymesh.position.z = -getRandomArbitrary(1250, 1550);
			var rr = getRandomArbitrary(-Math.PI * 7, Math.PI * 7);
			daymesh.rotation.x = rr;
			daymesh.rotation.y = rr;
			daymesh.rotation.z = rr;
			daymesh.material.opacity = 0;
		}
	}

	// loading csv file
	var self = this;
	var c1 = "hsl(0, 100%, 100%)";
	var c2 = "hsl(113, 100%, 55%)";
	var valueToColorScale = d3.scale
		.sqrt()
		//.linear()
		.domain([0, 1])
		.range([c1, c2])
		.interpolate(d3.interpolateHsl);

	d3.csv(csvfile, function(d) {

		for(var i = 0; i < d.length; i++) {
			var obj = d[i];
			var arr = new Array();
			var health = 0;
			for(value in obj) {
				if(value == "did" || value.indexOf("date") != -1 || value == "charge_flags_charge" || value == "charge_flags_fault") {
					continue;
				} else {
					var val = parseInt(obj[value]);
					if(val == -999) {
						continue;
					} else {
						// fixme: 4320 is the message ratio, it's hard code right now
						var f = val / 4320;
						arr.push(f);
					}
					//console.log(value + ", " + obj[value]);
				}
			}

			// calculate health
			var total = 0;
			for(index in arr) {
				total += arr[index];
			}
			health = total / arr.length;

			var hColor = valueToColorScale(health);
			hColor = hColor.substring(1);
			self._dayContainer.children[i].material.color.setHex("0x" + hColor);
		}

		// show
		self.show();
	});
}

CalendarEffect.prototype.show = function()
{
	if(this._isShow)
		return;
	this._isShow = true;

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

		TweenMax.to(pDay.position, 0.7, {x:px, y:py, z:pz, delay: rt, ease:Expo.easeOut});
		TweenMax.to(pDay.rotation, 0.7, {x:rx, y:ry, z:rz, delay: rt, ease:Circ.easeOut});
		TweenMax.to(pDay.material, 0.7, {opacity:1, delay: rt, ease:Expo.easeOut});
	}
}

CalendarEffect.prototype.hide = function()
{
	if(!this._isShow)
		return;
	this._isShow = false;

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
	var intersects = this._raycaster.intersectObjects(this._dayContainer.children, false);

	if(intersects.length > 0) {
		this._intersect = intersects[0].object;
		//console.log(intersects[0].object.name);
	} else {
		this._intersect = null;
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

