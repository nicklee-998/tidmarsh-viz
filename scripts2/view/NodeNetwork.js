/**
 * Created by marian_mcpartland on 14/12/15.
 *
 * 说明：
 *
 * 1. 设备类型定义请搜索：'Device Object Definition'
 */
function NodeNetwork()
{
	// ------------------------------------------
	//  Public Variables
	// ------------------------------------------

	// Mode
	this.NETWORK_MODE_NONE = "network_mode_none";
	this.NETWORK_MODE_NORMAL = "network_mode_normal";
	this.NETWORK_MODE_VORONOI_REALTIME = "network_mode_voronoi_realtime";
	this.NETWORK_MODE_VORONOI_HISTORY = "network_mode_voronoi_history";
	this.NETWORK_MODE_HEALTH = "network_mode_health";

	// Mouse Interaction
	this.disableMouseEvent = false;         // 是否禁止鼠标交互

	this._mode = this.NETWORK_MODE_NONE;

	// Network
	this.animatedObjects;
	this.devices = new Array();
	this.deviceBoxes = new Array();         // 不包括fake点的box

	// Voronoi
	this.vertices;
	this._voronoiContainer;
	this._voronoiLabelContainer;
	// cell label text
	this._cellLabelTextFontSize = 30;
	this._cellLabelTextColor = {r:70, g:70, b:70, a:0.7};
	this._cellLabelTextWidth;

	// Health Graph
	this._healthDateLayers = null;
	this._healthSelectedNode = null;
	this._healthTimeline = null;
	this._isHealthAnalysis = false;

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

	// Real-time message
	this._siteWebsocket = null;

	// ------------------------------------------
	//  Mouse interaction
	// ------------------------------------------
	this._raycaster = new THREE.Raycaster();
	this._intersected = null;
	this._raycasterVor = new THREE.Raycaster();
	this._intersectedVor = null;
	this._mouseX;
	this._mouseY;


	document.addEventListener( 'mousemove', function(event) {
		self._mouseX = event.clientX;
		self._mouseY = event.clientY;
	}, false );

	document.addEventListener( 'mouseup', function() {

		if(self._intersected) {
			// Health mode click
			if(self._mode == self.NETWORK_MODE_HEALTH) {

				$("#health_tooltip").css("visibility", "hidden");

				if(self._healthSelectedNode == self._intersected) {
					self._healthSelectedNode.material.emissive.setHex(self._healthSelectedNode.currentHex);
					self._healthSelectedNode = null;
					//self.onHealthMouseOut();

					// ------------------------
					// Send click event
					// ------------------------
					jQuery.publish(NETWORK_HEALTH_NODE_DESELECTED, self._intersected.name);

				} else {
					if(self._healthSelectedNode != null) {
						self._healthSelectedNode.material.emissive.setHex(self._healthSelectedNode.currentHex);
					}
					self._healthSelectedNode = self._intersected;
					self._healthSelectedNode.material.emissive.setHex(0xff0000);

					// ------------------------
					// Send click event
					// ------------------------
					jQuery.publish(NETWORK_HEALTH_NODE_SELECTED, self._intersected.name);
				}

			} else if(self._mode == self.NETWORK_MODE_NORMAL) {

				if(self._intersected) {
					if(self._intersected.name == "info_sign_plane") {
						jQuery.publish(NETWORK_NORMAL_SIGN_CLICK, self._intersected);
					} else {
						jQuery.publish(NETWORK_NORMAL_MESH_CLICK, self._intersected);
					}
				}
			}

		}
	}, false );

	// ------------------------------------------
	// Google Map
	// ------------------------------------------
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
	// 如果没有经纬度，不加入地图
	if(dInfo.lat == 0 && dInfo.lng == 0) {
		return;
	}

	// 创建设备
	var node = new SensorNode(dInfo.title);
	var box = node._mesh;
	var pnt = this.latLngToCube(dInfo.lat, dInfo.lng);
	box.position.x = pnt.x * groundWid - groundWid / 2;
	box.position.y = -(pnt.y * groundHei - groundHei / 2);
	box.position.z = 8;
	box.rotation.x -= Math.PI / 2;
	box.rotation.z = -Math.PI;
	box.name = dInfo.title;

	// ---------------------------------
	//  Device Object Definition
	// ---------------------------------
	this.devices.push({
		type: "cell",                   // 该设备的类型：'cell'表示实际的node，‘blank’表示假的node（用于填充vgraph用）
		mesh: box,                      // 该设备的模型（目前为cylinder），node中包含同样的链接
		node:node,                      // 该设备的模型（SensorNode Class）
		healthBoxes:new Array(),        // 该设备的health shape，每天一个
		id: dInfo.title,                // 该设备Id
		cell: null,                     // voronoi graph中该设备对应的shape
		cellLabel: null                 // voronoi graph中该设备对应shape的提示sprite
	});
	this.deviceBoxes.push(box);
	// todo:
	//if(dInfo.lastUpdated != null) {
	//	node.isOnline(dInfo.lastUpdated);
	//} else {
	//	node.online(false);
	//}
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
				this.devices.push({
					type: "blank",
					mesh: box,
					node: null,
					healthBoxes: null,
					id: "blank"+i,
					cell: null,
					cellLabel: null
				});
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

NodeNetwork.prototype.restoreNodes = function()
{
	for(var i = 0; i < this.devices.length; i++) {
		var device = this.devices[i];
		if(device.type != "blank") {
			device.node.restore();
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
//  Normal State
// -------------------------------------------------------
NodeNetwork.prototype.enterNormalMode = function()
{
	// Restore all buttons to origin color
	// Make all nodes offline
	for(var i = 0; i < this.devices.length; i++) {
		var device = this.devices[i];
		if(device.type != "blank") {
			device.node.online(false);
		}
	}

	// Open incoming message
	this.openIncomingMessage();

	this._mode = this.NETWORK_MODE_NORMAL;
}

// -------------------------------------------------------
//  Health Graph
// -------------------------------------------------------
NodeNetwork.prototype.createHealthGraph = function(csvfile)
{
	// Make all nodes offline
	for(var i = 0; i < this.devices.length; i++) {
		var device = this.devices[i];
		if(device.type != "blank") {
			device.node.online(false);
		}
	}

	// Create graph
	var self = this;
	var c1 = "hsl(0, 100%, 100%)";
	var c2 = "hsl(113, 100%, 55%)";
	var valueToColorScale = d3.scale
		.sqrt()
		//.linear()
		.domain([0, 1])
		.range([c1, c2])
		.interpolate(d3.interpolateHsl);

	// open loader
	$(".loading-text").text("Analysising Data...");
	loader2start();
	self._isHealthAnalysis = true;

	d3.csv(csvfile, function(d) {
		//console.log(self.devices);

		var did = "default";
		var device = null;
		var zidx = 0;
		var queueIdx = 0;

		//function startQueue() {
		//
		//	if(queueIdx >= d.length) {
		//		stopQueue();
		//		return;
		//	}
		//
		//	// Find the device
		//	var isfind = false;
		//	if(did != d[queueIdx]["did"]) {
		//
		//		for(var i = queueIdx; i < d.length; i++) {
		//			device = self.getDeviceById(d[queueIdx]["did"]);
		//			if(device != null) {
		//				did = d[queueIdx]["did"];
		//				zidx = 0;
		//				isfind = true;
		//				break;
		//			} else {
		//				queueIdx++;
		//			}
		//		}
		//
		//		// 如果整个csv文件中都没有有效的设备，循环结束
		//		if(!isfind) {
		//			stopQueue();
		//			return;
		//		}
		//	}
		//
		//	//console.log("start queue: " + did);
		//
		//	var obj = d[queueIdx];
		//	var arr = new Array();
		//	var health = 0;
		//	for(value in obj) {
		//		if(value == "did" || value.indexOf("date") != -1 || value == "charge_flags_charge" || value == "charge_flags_fault") {
		//			continue;
		//		} else {
		//			var val = parseInt(obj[value]);
		//			if(val == -999) {
		//				continue;
		//			} else {
		//				// fixme: 4320 is the message ratio, it's hard code right now
		//				var f = val / 4320;
		//				arr.push(f);
		//			}
		//			//console.log(value + ", " + obj[value]);
		//		}
		//	}
		//
		//	// calculate health
		//	var total = 0;
		//	for(index in arr) {
		//		total += arr[index];
		//	}
		//	health = total / arr.length;
		//
		//	createBlock(health);
		//}

		function stopQueue()
		{
			// 全部结束，显示时间轴
			// health timeline
			if(self._healthTimeline == null) {
				var timelineWid = 4;
				var timelineHei = 365 * 2;
				self._healthTimeline = new THREE.Mesh(
					new THREE.PlaneBufferGeometry(timelineWid, timelineHei, 20, 20),
					new THREE.MeshBasicMaterial({color: 0xffffff, transparent:true, side:THREE.DoubleSide})
				);
				self._healthTimeline.material.opacity = 0.7;
				self._healthTimeline.position.x = groundWid / 2 + (timelineWid / 2) / 1.414;
				self._healthTimeline.position.y = groundHei / 2 + (timelineWid / 2) / 1.414;
				self._healthTimeline.position.z = timelineHei / 2;
				self._healthTimeline.rotation.x = Math.PI / 2;
				self._healthTimeline.rotation.y = Math.PI / 4;

				// start title
				var startTitle = document.createElement( "canvas" );
				startTitle.width = 150;
				startTitle.height = 60;
				var context = startTitle.getContext( "2d" );
				context.fillStyle = "white";
				context.font = "18pt arial";
				context.fillText( "2014/1/1", 25, 60 );

				var xm = new THREE.MeshBasicMaterial({map: new THREE.Texture(startTitle), transparent: true, side:THREE.DoubleSide});
				xm.map.needsUpdate = true;
				var startmesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(150, 60), xm);
				startmesh.position.x = 50;
				startmesh.position.y = -(timelineHei / 2) + 30;
				startmesh.position.z = -2;
				self._healthTimeline.add(startmesh);

				// end title
				var endTitle = document.createElement( "canvas" );
				endTitle.width = 150;
				endTitle.height = 60;
				var context = endTitle.getContext( "2d" );
				context.fillStyle = "white";
				context.font = "18pt arial";
				context.fillText( "2014/12/31", 25, 60 );

				var xm = new THREE.MeshBasicMaterial({map: new THREE.Texture(endTitle), transparent: true, side:THREE.DoubleSide});
				xm.map.needsUpdate = true;
				var endmesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(150, 60), xm);
				endmesh.position.x = 70;
				endmesh.position.y = (timelineHei / 2) + 15;
				endmesh.position.z = -2;
				self._healthTimeline.add(endmesh);
			}
			ground.add(self._healthTimeline);
			//TweenMax.from(self._healthTimeline.material, 0.8, {opacity:0, ease:Expo.easeOut});


			// Remove loading
			loader2end();
			self._isHealthAnalysis = false;

			console.log("All finish");
		}

		//function createBlock(health) {
		//
		//	if(health != 0) {
		//		var hColor = valueToColorScale(health);
		//		hColor = "0x" + hColor.substring(1);
		//
		//		var box = new THREE.Mesh (
		//			new THREE.BoxGeometry(25, 25, 2),
		//			new THREE.MeshBasicMaterial( {color: 0x00ff00, transparent:true} )
		//		);
		//		box.material.color.setHex(hColor);
		//		box.position.x = device.mesh.position.x;
		//		box.position.y = device.mesh.position.y;
		//		box.position.z = zidx * 2;
		//		box.userData = {
		//			px:box.position.x, py:box.position.y, pz:box.position.z,
		//			rx:box.rotation.x, ry:box.rotation.y, rz:box.rotation.z,
		//			sx:box.scale.x, sy:box.scale.y, sz:box.scale.z
		//		};
		//		device.healthBoxes.push(box);
		//	} else {
		//		//device.healthBoxes.push(null);
		//	}
		//
		//	zidx++;
		//	queueIdx++;
		//
		//	if(queueIdx == d.length) {
		//		stopQueue();
		//		return;
		//	}
		//
		//	// Find device will change, do animation, then go to next device
		//	if(did != d[queueIdx]["did"]) {
		//
		//		console.log(did + ": " + device.healthBoxes.length);
		//		var count = 0;
		//		var localIdx = 0;
		//		var threshold = parseInt(device.healthBoxes.length);
		//
		//		var timer = setInterval(function() {
		//
		//			//console.log(localIdx + ", " + device.healthBoxes.length);
		//			if(localIdx >= device.healthBoxes.length ) {
		//				clearInterval(timer);
		//				startQueue();
		//				return;
		//			}
		//
		//			var box = device.healthBoxes[localIdx];
		//			if(box != null) {
		//				//TweenMax.from(box.material, 0.01, {opacity:0, delay: 0.01 * i, ease:Expo.easeOut, onComplete: function() {
		//
		//				//}});
		//				ground.add(box);
		//
		//				//count++;
		//				//if(count == threshold) {
		//				//	startQueue();
		//				//}
		//			}
		//			localIdx++;
		//		}, 1);
		//
		//		//for(var i = 0; i < device.healthBoxes.length; i++) {
		//		//	//console.log(localIdx + ", " + device.healthBoxes.length);
		//		//	var box = device.healthBoxes[i];
		//		//	if(box != null) {
		//		//		//TweenMax.from(box.material, 0.01, {opacity:0, delay: 0.01 * i, ease:Expo.easeOut, onComplete: function() {
		//		//
		//		//		//}});
		//		//		ground.add(box);
		//		//
		//		//		count++;
		//		//		if(count >= threshold) {
		//		//			console.log("jaaj");
		//		//			startQueue();
		//		//		}
		//		//	}
		//		//}
		//	} else {
		//		startQueue();
		//	}
		//}
		//startQueue();


		//var did = "default";
		//var device = null;
		//var zidx = 0;
		//var queueIdx = 0;


		for(var i = 0; i < d.length; i++) {

			// Find the device
			if(did != d[i]["did"]) {

				device = self.getDeviceById(d[i]["did"]);
				if(device != null) {
					did = d[i]["did"];
					zidx = 0;
				} else {
					continue;
				}
			}

			var obj = d[i];
			var health = caculateHealthFromCSV(obj);
			//console.log("health = " + health);

			if(health != 0) {
				var hColor = valueToColorScale(health);
				hColor = "0x" + hColor.substring(1);

				var box = new THREE.Mesh (
					new THREE.BoxGeometry(25, 25, 2),
					new THREE.MeshBasicMaterial( {color: 0x00ff00, transparent:true} )
				);
				box.material.color.setHex(hColor);
				box.position.x = device.mesh.position.x;
				box.position.y = device.mesh.position.y;
				box.position.z = zidx * 2;
				box.userData = {
					px:box.position.x, py:box.position.y, pz:box.position.z,
					rx:box.rotation.x, ry:box.rotation.y, rz:box.rotation.z,
					sx:box.scale.x, sy:box.scale.y, sz:box.scale.z
				};
				device.healthBoxes.push(box);

				//TweenMax.from(box.position, 0.5, {z:0, ease:Expo.easeOut});

				ground.add(box);
			} else {
				device.healthBoxes.push(null);
			}

			zidx++;
		}

		stopQueue();

		// 选择日期层
		//if(self._healthDateLayers == null) {
		//
		//	self._healthDateLayers = new Array();
		//	for(var k = 0; k < 365; k++) {
		//		var layer = new THREE.Mesh(
		//			new THREE.BoxGeometry(groundWid, groundHei, 2),
		//			new THREE.MeshLambertMaterial( {color: 0xff0000, transparent:true} )
		//		);
		//		layer.material.opacity = 0;
		//		//layer.position.x = -groundWid / 2;
		//		//layer.position.y = -groundHei / 2;
		//		layer.position.z = k * 2;
		//		layer.name = "dateLayer_" + k;
		//		layer.userData = {idx:k};
		//		ground.add(layer);
		//
		//		self._healthDateLayers.push(layer);
		//	}
		//}


		self._mode = self.NETWORK_MODE_HEALTH;
	});
}

NodeNetwork.prototype.clearHealthGraph = function()
{
	// clear timeline
	ground.remove(this._healthTimeline);

	for(var i = 0; i < this.devices.length; i++) {
		if(this.devices[i].type != "blank") {
			for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
				var box = this.devices[i].healthBoxes[j];
				if(box != null) {

					ground.remove(box);
					box.geometry.dispose();
					box.material.dispose();

					//console.log(box);
					//box.userData = null;
					//TweenMax.to(box.material, 0.6, {opacity:0, ease:Expo.easeOut, onComplete:function() {
					//	ground.remove(box);
					//	box.geometry.dispose();
					//	box.material.dispose();
					//}});
				}
			}
			this.devices[i].healthBoxes = new Array();
		}
	}
}

NodeNetwork.prototype.showHealthGraph = function(mode)
{
	if(mode == 1) {

		for(var i = 0; i < this.devices.length; i++) {

			if(this.devices[i].type != "blank") {
				for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
					var box = this.devices[i].healthBoxes[j];
					if(box != null) {
						//console.log(box);
						var obj = box.userData;
						var rd = getRandomArbitrary(0.1, 0.5);

						TweenMax.to(box.position, 1, {x:obj.px, y:obj.py, z:obj.pz, delay:rd, ease:Expo.easeOut});
						TweenMax.to(box.rotation, 1, {x:obj.rx, delay:rd, ease:Expo.easeOut});
						TweenMax.to(box.scale, 1, {x:obj.sx, y:obj.sy, z:obj.sz, delay:rd, ease:Expo.easeOut});
					}
				}
			}
		}

	} else if(mode == 2) {

		var deviceIdx = 0;
		for(var i = 0; i < this.devices.length; i++) {

			if(this.devices[i].type != "blank") {
				for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
					var box = this.devices[i].healthBoxes[j];
					if(box != null) {
						//console.log(box);
						var ps = 0.5;
						var gap = (25 + 1) * ps;
						var wwid = gap * 365;
						var px = j * gap - wwid / 2;
						var py = -(groundHei / 2 + 200);
						var pz = deviceIdx * gap + 300;
						var rd = getRandomArbitrary(0.1, 0.5);

						TweenMax.to(box.position, 1, {x:px, y:py, z:pz, delay:rd, ease:Expo.easeOut});
						TweenMax.to(box.rotation, 1, {x:Math.PI / 2, delay:rd, ease:Expo.easeOut});
						TweenMax.to(box.scale, 1, {x:ps, y:ps, z:ps, delay:rd, ease:Expo.easeOut});
					}
				}

				deviceIdx++;
			}
		}
	}
}

NodeNetwork.prototype.onHealthMouseOver = function(did)
{
	//dobj.material.opacity = 0.6;

	for(var i = 0; i < this.devices.length; i++) {
		if(this.devices[i].type != "blank") {

			if(this.devices[i].id == did) {
				$("#health_tooltip").css("visibility", "visible");
				$("#health_tooltip").text(did);
				$("#health_tooltip").css("left", this._mouseX + 13);
				$("#health_tooltip").css("top", this._mouseY - 10);

				for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
					var box = this.devices[i].healthBoxes[j];
					if(box != null) {
						TweenMax.to(box.material, 0.5, {opacity:1, ease:Expo.easeOut});
					}
				}

			} else {
				for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
					var box = this.devices[i].healthBoxes[j];
					if(box != null) {
						TweenMax.to(box.material, 0.5, {opacity:0.01, ease:Expo.easeOut});
					}
				}
			}
		}
	}
}

NodeNetwork.prototype.onHealthMouseOut = function()
{
	$("#health_tooltip").css("visibility", "hidden");

	//for(var j = 0; j < this._healthDateLayers.length; j++) {
	//	var layer = this._healthDateLayers[j];
	//	layer.material.opacity = 0;
	//}

	if(this._healthSelectedNode != null) {

		for(var i = 0; i < this.devices.length; i++) {
			if(this.devices[i].type != "blank") {
				if(this.devices[i].id == this._healthSelectedNode.name) {
					for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
						var box = this.devices[i].healthBoxes[j];
						if(box != null) {
							TweenMax.to(box.material, 0.5, {opacity:1, ease:Expo.easeOut});
						}
					}
				} else {
					for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
						var box = this.devices[i].healthBoxes[j];
						if(box != null) {
							TweenMax.to(box.material, 0.5, {opacity:0.01, ease:Expo.easeOut});
						}
					}
				}
			}
		}

	} else {

		for(var i = 0; i < this.devices.length; i++) {
			if(this.devices[i].type != "blank") {
				for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
					var box = this.devices[i].healthBoxes[j];
					if(box != null) {
						TweenMax.to(box.material, 0.5, {opacity:1, ease:Expo.easeOut});
					}
				}
			}
		}
	}
}

// -------------------------------------------------------
//  Real-time Message
// -------------------------------------------------------
NodeNetwork.prototype.openIncomingMessage = function()
{
	var self = this;
	if(this._siteWebsocket == null) {
		this._siteWebsocket = new WebSocket('ws://chain-api.media.mit.edu/ws/site-7');
		this._siteWebsocket.onopen = function(evt) {
			console.log('tidmarsh site realtime message onopen');

			// update menu
			if(self._mode == self.NETWORK_MODE_VORONOI_REALTIME) {
				menuData.flashWaitMessageLabel(true);
				menuData.showMe(DATA_REALTIME_OPEN, {message: ""});
			}
		};
		this._siteWebsocket.onmessage = function(evt) {
			//console.log(evt);
			var tmpobj = $.parseJSON(evt.data);
			var href = tmpobj['_links']['ch:sensor']['href'];
			var iobj = chainManager.getDeviceBySensor(href);

			// Behalf depends on defferent modes
			if(self._mode == self.NETWORK_MODE_NORMAL) {

				self.updateNode(iobj.did, new Date(tmpobj.timestamp));

			} else if(self._mode == self.NETWORK_MODE_VORONOI_REALTIME) {

				// Stop flashing
				menuData.flashWaitMessageLabel(false);

				if(iobj != null) {
					if(iobj.sid == sensorTable[mainmenu.currSelectSensorIdx]) {
						//console.log(iobj.did + ", " + iobj.sid + ", " + tmpobj.value);
						self.processMessage(iobj.did, iobj.sid, tmpobj.value);
					}
				}
			}
		};
		this._siteWebsocket.onclose = function(evt) {
			console.log('tidmarsh site realtime message onclose');

			self._siteWebsocket = null;

			// update menu
			if(self._mode == self.NETWORK_MODE_VORONOI_REALTIME) {
				// Stop flashing
				menuData.flashWaitMessageLabel(false);
				menuData.showMe(DATA_REALTIME_FAULT);
			}
		};
		this._siteWebsocket.onerror = function(evt) {
			console.log('tidmarsh siste realtime message onerror');

			self._siteWebsocket = null;

			// update menu
			if(self._mode == self.NETWORK_MODE_VORONOI_REALTIME) {
				// Stop flashing
				menuData.flashWaitMessageLabel(false);
				menuData.showMe(DATA_REALTIME_FAULT);
			}
		};
	}
}

NodeNetwork.prototype.closeIncomingMessage = function()
{
	if(this._siteWebsocket != null) {
		console.log('tidmarsh site realtime message closing...');
		this._siteWebsocket.close();
		this._siteWebsocket = null;
	}
}

NodeNetwork.prototype.processMessage = function(did, sid, value, date)
{
	// update menu
	if(this._mode == this.NETWORK_MODE_VORONOI_REALTIME) {
		var conf = getConfigBySensor(sid);
		var str = did + " " + sid + " is " + value.toFixed(2) + conf.unit + " now.";
		menuData.showMe(DATA_REALTIME_OPEN, {message: str});
	}

	this.updateVoronoi(did, sid, value, date);
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

	// create voronoi container
	this._voronoiContainer = new THREE.Object3D();
	this._voronoiContainer.rotation.x -= Math.PI / 2;
	//this._voronoiContainer.position.y = groundZero;
	scene.add(this._voronoiContainer);

	// create voronoi label container
	this._voronoiLabelContainer = new THREE.Object3D();
	this._voronoiLabelContainer.rotation.x -= Math.PI / 2;
	scene.add(this._voronoiLabelContainer);

	len = thePaths.length;
	for (i = 0; i < len; ++i) {
		var device = this.getDeviceByPoint(theVertices[i]);
		var op = 1;
		if(device.type == "blank") {
			op = 0.8;
		}
		path = $d3g.transformSVGPath(thePaths[i]);
		color = theColors[i];
		material = new THREE.MeshLambertMaterial({
			color: color,
			ambient: color,
			emissive: color,
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

		// len1基本上就是 1
		for (j = 0; j < len1; ++j) {
			simpleShape = simpleShapes[j];
			shape3d = simpleShape.extrude({
				amount: amount,
				bevelEnabled: false
			});
			mesh = new THREE.Mesh(shape3d, material);
			//mesh.rotation.x = -Math.PI / 2;
			mesh.translateX( - theCenter.x);
			mesh.translateY( - theCenter.y);
			mesh.translateZ( groundZero);
			mesh.name = "voronoi_" + device.id;
			mesh.visible = false;
			this._voronoiContainer.add(mesh);

			// -----------------------------------
			//  Mesh label
			// -----------------------------------
			var canvas = document.createElement('canvas');
			var context = canvas.getContext('2d');
			context.font = "Bold " + this._cellLabelTextFontSize + "px Arial";

			// get size data (height depends only on font size)
			var metrics = context.measureText( "23.0000 lux" );
			this._cellLabelTextWidth = metrics.width;

			// text color
			context.fillStyle = "rgba(" + this._cellLabelTextColor.r + "," + this._cellLabelTextColor.g + "," + this._cellLabelTextColor.b + "," + this._cellLabelTextColor.a + ")";
			context.fillText( "23 x", this._cellLabelTextWidth / 2, 95);

			var texture = new THREE.Texture(canvas);
			texture.needsUpdate = true;

			var spriteMaterial = new THREE.SpriteMaterial({
				map: texture
			});
			var meshLabel = new THREE.Sprite(spriteMaterial);
			meshLabel.translateX(device.mesh.position.x);
			meshLabel.translateY(device.mesh.position.y);
			meshLabel.translateZ(groundZero);
			meshLabel.visible = false;
			meshLabel.scale.set( this._cellLabelTextWidth, this._cellLabelTextWidth / 2, 1 );

			// TODO: find some best way to handle blank cell
			if(device.type != "blank") {
				this._voronoiLabelContainer.add(meshLabel);
			}

			// 将cell加入到device的信息中
			if(j == 0) {
				device.cell = mesh;
				device.cellLabel = meshLabel;
			}
		}
	}
}

NodeNetwork.prototype.enterVoronoi = function(mode)
{
	if(mode == "REALTIME")
	{
		this.openIncomingMessage();

		this._mode = this.NETWORK_MODE_VORONOI_REALTIME;
	}
	else if(mode == "HISTORY")
	{
		this.closeIncomingMessage();

		this._mode = this.NETWORK_MODE_VORONOI_HISTORY;
	}
}

NodeNetwork.prototype.updateVoronoi = function(did, sid, value, date)
{
	var device = this.getDeviceById(did);
	if(device != null && device.id != "blank" && device.cell) {
		if(value != -999) {
			var mobj = this.getMeshConf(sid, value);

			// change color
			var clr = "0x" + String(mobj.color).substr(1);
			device.cell.material.color.setHex(clr);
			device.cell.material.ambient.setHex(clr);
			device.cell.material.emissive.setHex(clr);
			if(!device.cell.userData) {
				device.cell.userData = {value: -998, unit: "", date:null, title: ""};
			}
			device.cell.userData.value = value;
			device.cell.userData.unit = mobj.unit;
			device.cell.userData.date = date;
			device.cell.userData.title = mobj.title.toUpperCase();

			// change height
			//device.cell.scale.z = mobj.height;
			device.cell.visible = true;
			device.cell.position.z = ground.position.y + 3;
			TweenMax.to(device.cell.scale, 0.5, {z:mobj.height, ease:Elastic.easeOut});

			// 显示数量提示符
			if(device.cellLabel != null) {
				device.cellLabel.visible = true;

				var context = device.cellLabel.material.map.image.getContext('2d');
				device.cellLabel.material.map.needsUpdate = true;
				context.clearRect(0, 0, this._cellLabelTextWidth * 2, this._cellLabelTextWidth * 2);
				context.font = "Bold " + this._cellLabelTextFontSize + "px Arial";
				context.fillStyle = "rgba(" + this._cellLabelTextColor.r + "," + this._cellLabelTextColor.g + "," + this._cellLabelTextColor.b + "," + this._cellLabelTextColor.a + ")";
				context.fillText( value.toFixed(2) + mobj.unit, this._cellLabelTextWidth / 2, 95);

				device.cellLabel.position.z = ground.position.y + 13 + mobj.height;
			}

		} else {
			device.cell.visible = false;
			if(device.cellLabel != null) {
				device.cellLabel.visible = false;
			}
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
			if(device.cellLabel != null) {
				device.cellLabel.visible = false;
			}
			//TweenMax.to(device.cell.scale, 0.2, {z:0.001, ease:Expo.easeOut, onComplete:function() {
			//	device.cell.visible = false;
			//}});
		} else {
			device.cell.visible = false;
			if(device.cellLabel != null) {
				device.cellLabel.visible = false;
			}
		}
	}
}

NodeNetwork.prototype.onVoronoiMouseOver = function(name)
{
	var did = name.substring(name.indexOf("_") + 1);

	var device = this.getDeviceById(did);
	$("#h_tooltip_did").text(did);
	$("#h_tooltip_result").text(device.cell.userData.title + ": " + device.cell.userData.value.toFixed(2) + " " + device.cell.userData.unit);
	$("#h_tooltip_time").text(device.cell.userData.date.toLocaleString());

	$("#history_tooltip").css("visibility", "visible");
	$("#history_tooltip").css("left", this._mouseX + 17);
	$("#history_tooltip").css("top", this._mouseY - 15);

	// --------------------------------
	// Send voronoi mouseover event
	// --------------------------------
	jQuery.publish(NETWORK_VORONOI_MOUSE_OVER, did);
}

NodeNetwork.prototype.onVoronoiMouseOut = function(name)
{
	$("#history_tooltip").css("visibility", "hidden");

	// --------------------------------
	// Send voronoi mouseout event
	// --------------------------------
	var did = name.substring(name.indexOf("_") + 1);
	jQuery.publish(NETWORK_VORONOI_MOUSE_OUT, did);
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

//---------------------------------------------------------
// Mainly for detecting mouseover and mouseout event
//---------------------------------------------------------
NodeNetwork.prototype.render = function(mx, my)
{
	// 如果禁止鼠标事件，不做下面的事情
	if(this.disableMouseEvent) {
		return;
	}

	// find intersections
	var vector = new THREE.Vector3(mx, my, 1).unproject(camera);
	this._raycaster.set(camera.position, vector.sub(camera.position).normalize());
	var intersects = this._raycaster.intersectObjects(ground.children, true);

	if(intersects.length > 0) {
		if(this.getDeviceById(intersects[0].object.name) != null && !this._isHealthAnalysis) {

			if(this._intersected != intersects[0].object) {
				if(this._intersected) {
					this._intersected.material.emissive.setHex(this._intersected.currentHex);
				}
				this._intersected = intersects[0].object;

				// 已经选定的点不要变色
				if(this._healthSelectedNode != intersects[0].object) {
					this._intersected.currentHex = this._intersected.material.emissive.getHex();
					this._intersected.material.emissive.setHex(0x746331);
				}

				// mouse over
				if(this._mode == this.NETWORK_MODE_HEALTH) {
					this.onHealthMouseOver(this._intersected.name);
				}
			}
		}
		//else if(intersects[0].object.name.indexOf("dateLayer") != -1) {
		//
		//	if(this._intersected != intersects[0].object) {
		//		if(this._intersected) {
		//			this._intersected.material.emissive.setHex(this._intersected.currentHex);
		//		}
		//		this._intersected = intersects[0].object;
		//		this._intersected.currentHex = this._intersected.material.emissive.getHex();
		//		this._intersected.material.emissive.setHex(0xff0000);
		//
		//		// mouse over
		//		if(this._mode == this.NETWORK_MODE_HEALTH) {
		//			this.onHealthMouseOver(this._intersected);
		//		}
		//	}
		//
		//}
		else if(intersects[0].object.name == "info_sign_plane" || intersects[0].object.name == "signmesh") {
			var sign = null;
			for(var i = 0; i < intersects.length; i++) {
				if(intersects[i].object.name == "info_sign_plane") {
					sign = intersects[i].object;
					break;
				}
			}

			if(sign != null) {
				if(this._intersected != sign) {
					if(this._intersected) {
						this._intersected.material.emissive.setHex(this._intersected.currentHex);
					}
					this._intersected = sign;
					this._intersected.currentHex = this._intersected.material.emissive.getHex();
					this._intersected.material.emissive.setHex(0xff0000);
				}
			}
		}
		else {
			if (this._intersected) {

				// 已经选定的点不要变色
				if(this._healthSelectedNode != this._intersected) {
					this._intersected.material.emissive.setHex( this._intersected.currentHex );
				}

				// mouse out in health mode
				if(this._mode == this.NETWORK_MODE_HEALTH) {
					this.onHealthMouseOut();
				}
			}
			this._intersected = null;
		}

	} else {
		if (this._intersected) {
			// 已经选定的点不要变色
			if(this._healthSelectedNode != this._intersected) {
				this._intersected.material.emissive.setHex( this._intersected.currentHex );
			}

			// mouse out in health mode
			if(this._mode == this.NETWORK_MODE_HEALTH) {
				this.onHealthMouseOut();
			}
		}
		this._intersected = null;
	}

	// -------------------------------------------------
	//  Mouse interaction in voronoi graph
	// -------------------------------------------------
	if(this._voronoiContainer) {

		var vector2 = new THREE.Vector3(mx, my, 1).unproject(camera);
		this._raycasterVor.set(camera.position, vector2.sub(camera.position).normalize());
		var intersects2 = this._raycasterVor.intersectObjects(this._voronoiContainer.children, true);

		if(intersects2.length > 0) {

			if(intersects2[0].object.name.indexOf("voronoi_") != -1 && intersects2[0].object.name.indexOf("blank") == -1)
			{
				if(this._intersectedVor != intersects2[0].object) {

					if(this._intersectedVor) {
						this._intersectedVor.material.emissive.setHex(this._intersectedVor.currentHex);
					}
					this._intersectedVor = intersects2[0].object;
					this._intersectedVor.currentHex = this._intersectedVor.material.emissive.getHex();
					this._intersectedVor.material.emissive.setHex(0x746331);

					// mouse over
					if(this._mode == this.NETWORK_MODE_VORONOI_HISTORY) {
						if(this._intersectedVor.visible) {
							this.onVoronoiMouseOver(this._intersectedVor.name);
						}
					}
				}
			} else {
				if (this._intersectedVor) {
					// mouse out in voronoi history mode
					if(this._mode == this.NETWORK_MODE_VORONOI_HISTORY) {
						this._intersectedVor.material.emissive.setHex( this._intersectedVor.currentHex );
						this.onVoronoiMouseOut(this._intersectedVor.name);
					}
				}
				this._intersectedVor = null;
			}
		} else {
			if (this._intersectedVor) {
				// mouse out in voronoi history mode
				if(this._mode == this.NETWORK_MODE_VORONOI_HISTORY) {
					this._intersectedVor.material.emissive.setHex( this._intersectedVor.currentHex );
					this.onVoronoiMouseOut(this._intersectedVor.name);
				}
			}
			this._intersectedVor = null;
		}
	}
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

	// Can't set the range min to 0, cause some bug
	// TODO: 13 should from SensorNode Class
	var valueScale = d3.scale.linear()
		.domain([conf.min, conf.max])
		.range([13, 100]);

	var obj = {color: valueToColorScale(value), height: valueScale(value), unit: conf.unit, title: conf.title};

	return obj;
}