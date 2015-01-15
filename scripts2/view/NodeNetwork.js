/**
 * Created by marian_mcpartland on 14/12/15.
 */
function NodeNetwork()
{
	// Network
	this.animatedObjects;
	this.devices = new Array();
	this.deviceBoxes = new Array();         // 不包括fake点的box

	// Voronoi
	this.vertices;

	// Poisson disc
	this._k = 30;
	this._radius2;
	this._R;
	this._cellSize;
	this._gridWidth;
	this._gridHeight;
	this._grid;
	this._queue = [];
	this._queueSize = 0;
	this._sampleSize = 0;

	// Google Map
	// Todo: the area lat and lng info should be in Config file
	var swBound = new google.maps.LatLng(41.90321131560879, -70.57343602180481);
	var neBound = new google.maps.LatLng(41.904696544596135, -70.57117223739624);
	this.bounds = new google.maps.LatLngBounds(swBound, neBound);

	var center = this.bounds.getCenter();

	var canvas = document.getElementById('map-canvas');
	var mapOptions = {
		// Todo: maybe we should put zoom in config file, cause it affects the wid and hei of the ground.
		zoom: 19,
		center: center,
		disableDefaultUI: true,
		mapTypeId: google.maps.MapTypeId.SATELLITE
	};
	this.map = new google.maps.Map(canvas, mapOptions);

	this.overlay = new google.maps.OverlayView();
	this.overlay.setMap(this.map);
	this.pntSW;
	this.pntNE;
	this.boundWid;
	this.boundHei;

	this.overlay.onAdd = function() {

		var project = self.overlay.getProjection();
		self.pntSW = project.fromLatLngToContainerPixel(self.bounds.getSouthWest());
		self.pntNE = project.fromLatLngToContainerPixel(self.bounds.getNorthEast());

		self.boundWid = self.pntNE.x - self.pntSW.x;
		self.boundHei = self.pntSW.y - self.pntNE.y;

		console.log("Area width and height: " + self.boundWid + ", " + self.boundHei);

		// Init Poisson disc Params
		// TODO: radius should put in config file
		var radius = self.boundWid / 15;
		self._radius2 = radius * radius;
		self._R = 3 * self._radius2;
		self._cellSize = radius * Math.SQRT1_2;
		self._gridWidth = Math.ceil(self.boundWid / self._cellSize);
		self._gridHeight = Math.ceil(self.boundHei / self._cellSize);
		self._grid = new Array(self._gridWidth * self._gridHeight);

		// ---------------------------
		//  SEND GMAP INIT EVENT
		// ---------------------------
		jQuery.publish(GMAP_INIT);
	};

	var self = this;
}

// -------------------------------------------------------
//  Create Device
// -------------------------------------------------------
NodeNetwork.prototype.createDevice = function(dInfo)
{
	var node = new SensorNode(dInfo.title);
	var box = node._mesh;
	var pnt = this.latLngToCube(dInfo.lat, dInfo.lng);
	box.position.x = pnt.x * groundWid - groundWid / 2;
	box.position.y = -(pnt.y * groundHei - groundHei / 2);
	box.position.z = 8;
	box.rotation.x -= Math.PI / 2;
	box.rotation.z = -Math.PI;
	box.name = dInfo.title;
	this.devices.push({type: "cell", mesh: box, node:node, id: dInfo.title, cell: null});
	this.deviceBoxes.push(box);
	if(dInfo.lastUpdated != null) {
		node.isOnline(dInfo.lastUpdated);
	} else {
		node.online(false);
	}
	ground.add(box);

	// poisson dict -
	this._sample(pnt.x * groundWid, pnt.y * groundHei);

	this.growAnimation(box);
}

NodeNetwork.prototype.createFakeDevices = function()
{
	// ---------------------------------
	//  补充一些blank node
	// ---------------------------------
	if(this.devices.length < 150) {
		var len = this.devices.length;
		var i = 0;
		var over = false;
		while(i < (150 - len) && !over) {
			var s = this._poissonDiscSampler();
			if(s) {
				var px = s[0];
				var py = s[1];

				var box = new THREE.Mesh(
					new THREE.CylinderGeometry(10, 10, 6, 5),
					new THREE.MeshLambertMaterial({color: 0xeb9494, wireframe: true, shading: THREE.FlatShading})
				);
				box.position.x = px - groundWid / 2;
				box.position.y = -(py - groundHei / 2);
				box.position.z = 8;
				box.rotation.x = -Math.PI / 2;
				this.devices.push({type: "blank", mesh: box, node:null, id: "blank"+i, cell: null});
				//ground.add(box);
				//this.growAnimation(box);

				i++;
			} else {
				over = true;
			}
		}
	}
}

NodeNetwork.prototype.updateNode = function(did, date)
{
	for(var i = 0; i < this.devices.length; i++) {
		var device = this.devices[i];
		if(device.id == did) {
			device.node.isOnline(date);
			break;
		}
	}
}

NodeNetwork.prototype.growAnimation = function(d)
{
	var goalZ = d.position.z;
	d.position.z = -110;
	//d.scale.x = 0;
	//d.scale.z = 0;
	TweenMax.to(d.position, 1.1, {z:goalZ + 150, onComplete:function() {
		TweenMax.to(d.position, 1.2, {z:goalZ, ease:Expo.easeOut});
	}});
	//TweenMax.to(d.scale, 3, {x:1, z:1, ease:Elastic.easeOut});
}

// -------------------------------------------------------
//  Voronoi Graph
// -------------------------------------------------------
NodeNetwork.prototype.createVoronoi = function()
{
	// -----------------------------
	//  for voronoi graph
	// -----------------------------
	this.vertices = new Array();
	for(var i = 0; i < this.devices.length; i++) {
		var d = this.devices[i];
		this.vertices.push([d.mesh.position.x + groundWid / 2, (d.mesh.position.y + groundHei / 2)]);
	}

	// 1 pixel for protecting wrong caculate
	var voronoi = d3.geom.voronoi().clipExtent([[-1,-1], [groundWid + 1, groundHei + 1]]);
	var data = voronoi(this.vertices);

	var obj = {};
	obj.paths = new Array();
	obj.colors = new Array();
	obj.amounts = new Array();
	obj.center = { x:groundWid / 2, y:groundHei / 2 };
	obj.vertices = new Array();
	for(var i = 0; i < data.length; i++) {
		if(data[i] && data[i].length > 0) {
			var str = "M" + data[i].join("L") + "Z";
			obj.paths.push(str);
			var amount = 1;
			obj.amounts.push(amount);
			obj.colors.push(0xff0000);
			// 每个cell对应的点坐标
			obj.vertices.push(data[i].point);
		}
	}

	var i, j, len, len1;
	var path, mesh, color, material, amount, simpleShapes, simpleShape, shape3d, x, toAdd, results = [];
	var thePaths = obj.paths;
	var theAmounts = obj.amounts;
	var theColors = obj.colors;
	var theCenter = obj.center;
	var theVertices = obj.vertices;

	len = thePaths.length;
	for (i = 0; i < len; ++i) {
		var device = this.getDeviceByPoint(theVertices[i]);
		var op = 0.8;
		if(device.type == "blank") {
			op = 0.8;
		}
		path = $d3g.transformSVGPath(thePaths[i]);
		color = theColors[i];
		material = new THREE.MeshBasicMaterial({
			color: color,
			//ambient: color,
			//emissive: color,
			transparent: true,
			side: THREE.DoubleSide,
			opacity: op
		});
		amount = theAmounts[i];
		if(device.type == "blank") {
			amount = 0;
		}
		simpleShapes = path.toShapes(true);
		len1 = simpleShapes.length;

		for (j = 0; j < len1; ++j) {
			simpleShape = simpleShapes[j];
			shape3d = simpleShape.extrude({
				amount: amount,
				bevelEnabled: false
			});
			mesh = new THREE.Mesh(shape3d, material);
			mesh.rotation.x = -Math.PI / 2;
			mesh.translateZ( groundZero);
			mesh.translateX( - theCenter.x);
			mesh.translateY( - theCenter.y);
			mesh.visible = false;
			scene.add(mesh);

			// 将cell加入到device的信息中
			if(j == 0) {
				device.cell = mesh;
			}
		}
	}
}

NodeNetwork.prototype.updateVoronoi = function(did, sid, value)
{
	var device = this.getDeviceById(did);
	if(device != null && device.id != "blank" && device.cell) {
		if(value != -999) {
			var mobj = this.getMeshConf(sid, value);

			// change color
			var clr = "0x" + String(mobj.color).substr(1);
			device.cell.material.color.setHex(clr);
			//device.cell.material.ambient.setHex(clr);
			//device.cell.material.emissive.setHex(clr);

			// change height
			//device.cell.scale.z = mobj.height;
			device.cell.visible = true;
			device.cell.position.y = ground.position.y + 2;
			TweenMax.to(device.cell.scale, 0.5, {z:mobj.height, ease:Elastic.easeOut});

		} else {
			device.cell.visible = false;
		}
	}

}

NodeNetwork.prototype.clearVoronoi = function(isAnim)
{
	for(var i = 0; i < this.devices.length; i++) {
		var device = this.devices[i];
		if(device.cell == null || device.id.indexOf("blank") != -1)
			continue;

		if(isAnim) {
			device.cell.visible = false;
			//TweenMax.to(device.cell.scale, 0.2, {z:0.001, ease:Expo.easeOut, onComplete:function() {
			//	device.cell.visible = false;
			//}});
		} else {
			device.cell.visible = false;
		}
	}
}

NodeNetwork.prototype.getDeviceByPoint = function(point)
{
	for(var i = 0; i < this.devices.length; i++) {
		if(this.vertices[i][0] == point[0] && this.vertices[i][1] == point[1]) {
			return this.devices[i];
		}
	}
	return null;
}

NodeNetwork.prototype.getDeviceById = function(did)
{
	for(var i = 0; i < this.devices.length; i++) {
		if(this.devices[i].id == did) {
			return this.devices[i];
		}
	}
	return null;
}

//----------------------------------------------
// PRIVATE METHOD - Poisson Disc
//----------------------------------------------
NodeNetwork.prototype._poissonDiscSampler = function()
{
	while(this._queueSize) {
		var i = Math.random() * this._queueSize | 0;
		var s = this._queue[i];

		for(var j = 0; j < this._k; ++j) {
			var a = 2 * Math.PI * Math.random();
			var r = Math.sqrt(Math.random() * this._R + this._radius2);
			var x = s[0] + r * Math.cos(a);
			var y = s[1] + r * Math.sin(a);

			if(0 <= x && x < groundWid && 0 <= y && y < groundHei && this._far(x, y))
				return this._sample(x, y);
		}

		this._queue[i] = this._queue[--this._queueSize];
		this._queue.length = this._queueSize;
	}
}

NodeNetwork.prototype._far = function(x, y)
{
	var i = x / this._cellSize | 0;
	var j = y / this._cellSize | 0;
	var i0 = Math.max(i - 2, 0);
	var j0 = Math.max(j - 2, 0);
	var i1 = Math.min(i + 3, this._gridWidth);
	var j1 = Math.min(j + 3, this._gridHeight);

	for(j = j0; j < j1; ++j) {
		var o = j * this._gridWidth;
		for(i = i0; i < i1; ++i) {
			if(s = this._grid[o + i]) {
				var s;
				var dx = s[0] - x;
				var dy = s[1] - y;
				if(dx * dx + dy * dy < this._radius2)
					return false;
			}
		}
	}
	return true;
}

NodeNetwork.prototype._sample = function(x, y)
{
	var s = [x, y];
	this._queue.push(s);
	this._grid[this._gridWidth * (y / this._cellSize | 0) + (x / this._cellSize | 0)] = s;
	++this._sampleSize;
	++this._queueSize;
	return s;
}

// -------------------------------------------------------
//  LatLng to Point
// -------------------------------------------------------
NodeNetwork.prototype.latLngToCube = function(lat, lng)
{
	var project = this.overlay.getProjection();
	var latlng = new google.maps.LatLng(lat, lng);
	var pnt = project.fromLatLngToDivPixel(latlng);
	pnt.x -= this.pntSW.x;
	pnt.y -= this.pntNE.y;

	var ppnt = {x:0, y:0};
	ppnt.x = pnt.x / groundWid;
	ppnt.y = pnt.y / groundHei;

	return ppnt;
}

NodeNetwork.prototype.getMeshConf = function(sensorid, value)
{
	var conf = getConfigBySensor(sensorid);

	var c1 = "hsl(" + conf.hueL + ", " + conf.saturationL + "%, " + conf.lightnessL + "%)";
	var c2 = "hsl(" + conf.hueR + ", " + conf.saturationR + "%, " + conf.lightnessR + "%)";
	var valueToColorScale = d3.scale.sqrt()
		.domain([conf.min, conf.max])
		.range([c1, c2])
		.interpolate(d3.interpolateHsl);
	var valueScale = d3.scale.linear()
		.domain([conf.min, conf.max])
		.range([0, 100]);

	var obj = {color: valueToColorScale(value), height: valueScale(value)};

	return obj;
}