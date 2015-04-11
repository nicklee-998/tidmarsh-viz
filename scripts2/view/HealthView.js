/**
 * Created by marian_mcpartland on 15/4/10.
 */

function HealthView()
{
	this._hCont = new THREE.Object3D();

	// Health Graph
	this._healthDateLayers = null;
	this._healthSelectedNode = null;
	this._healthTimeline = null;
	this._isHealthAnalysis = false;

	//
	this._healthTable = {};
}

HealthView.prototype.create = function(csvfile, devices)
{
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

		var did = "default";
		var device = null;
		var zidx = 0;
		var count = 0;

		var px, py;

		// 36 means point number, 3 means xyz
		var geometry = null;
		var vertices;
		var colors;

		for(var i = 0; i < d.length; i++) {

			// Find the device
			if(did != d[i]["did"]) {

				device = getDeviceById(d[i]["did"]);
				if(device != null) {

					if(geometry != null) {
						geometry.addAttribute( 'position', vertices );
						geometry.addAttribute( 'color', colors );

						var material = new THREE.RawShaderMaterial( {

							uniforms: {
								time: { type: "f", value: 1 }
							},
							vertexShader: document.getElementById( 'vertexShader' ).textContent,
							fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
							side: THREE.DoubleSide,
							transparent: true,
							depthTest: false

						} );

						var mesh = new THREE.Mesh( geometry, material );
						self._hCont.add( mesh );
						self._healthTable[did] = mesh;
					}

					did = d[i]["did"];

					// param
					geometry = new THREE.BufferGeometry();
					vertices = new THREE.BufferAttribute( new Float32Array(365 * 36 * 3), 3 );
					colors = new THREE.BufferAttribute( new Float32Array(365 * 36 * 4), 4 );
					px = device.mesh.position.x;
					py = device.mesh.position.y;
					count = 0;
					zidx = 0;

					//console.log(did + ": " + px + ", " + py);
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
				var color = new THREE.Color(parseInt(hColor));

				var temp = new THREE.BoxGeometry(25, 25, 2);
				var tempgeo = new THREE.BufferGeometry().fromGeometry(temp);
				var matrix = new THREE.Matrix4();
				matrix.setPosition(new THREE.Vector3(px, py, zidx * 2));
				tempgeo.applyMatrix(matrix);
				for(var j = 0; j < tempgeo.attributes.position.array.length; j+=3) {

					var pp = tempgeo.attributes.position.array[j];
					var pp1 = tempgeo.attributes.position.array[j+1];
					var pp2 = tempgeo.attributes.position.array[j+2];

					vertices.setXYZ(count, pp, pp1, pp2);
					colors.setXYZW(count, color.r, color.g, color.b, 0.2);

					//console.log(count);
					count++;
				}

			} else {

			}

			zidx++;
		}

		ground.add(self._hCont);

		stopQueue();

		function getDeviceById(did)
		{
			for(var i = 0; i < devices.length; i++) {
				if(devices[i].id == did) {
					return devices[i];
				}
			}
			return null;
		}


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
	});
}

HealthView.prototype.show = function()
{
	ground.add(this._hCont);
}

HealthView.prototype.hide = function()
{
	// clear timeline
	ground.remove(this._hCont);

	//for(var i = 0; i < this.devices.length; i++) {
	//	if(this.devices[i].type != "blank") {
	//		for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
	//			var box = this.devices[i].healthBoxes[j];
	//			if(box != null) {
	//
	//				ground.remove(box);
	//				box.geometry.dispose();
	//				box.material.dispose();
	//
	//				//console.log(box);
	//				//box.userData = null;
	//				//TweenMax.to(box.material, 0.6, {opacity:0, ease:Expo.easeOut, onComplete:function() {
	//				//	ground.remove(box);
	//				//	box.geometry.dispose();
	//				//	box.material.dispose();
	//				//}});
	//			}
	//		}
	//		this.devices[i].healthBoxes = new Array();
	//	}
	//}
}

HealthView.prototype.arrange = function(mode)
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

HealthView.prototype.onMouseOver = function(did)
{
	for (var key in this._healthTable) {
		if (this._healthTable.hasOwnProperty(key)) {
			if(key == did) {
				$("#health_tooltip").css("visibility", "visible");
				$("#health_tooltip").text(did);
				$("#health_tooltip").css("left", this._mouseX + 13);
				$("#health_tooltip").css("top", this._mouseY - 10);

				// make

			} else {
				//
			}
		}
	}

	return;

	//for(var i = 0; i < this._healthTable.length; i++) {
	//	if(this.devices[i].type != "blank") {
	//
	//		if(this.devices[i].id == did) {
	//
	//
	//			for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
	//				var box = this.devices[i].healthBoxes[j];
	//				if(box != null) {
	//					TweenMax.to(box.material, 0.5, {opacity:1, ease:Expo.easeOut});
	//				}
	//			}
	//
	//		} else {
	//			for(var j = 0; j < this.devices[i].healthBoxes.length; j++) {
	//				var box = this.devices[i].healthBoxes[j];
	//				if(box != null) {
	//					TweenMax.to(box.material, 0.5, {opacity:0.01, ease:Expo.easeOut});
	//				}
	//			}
	//		}
	//	}
	//}
}

HealthView.prototype.onMouseOut = function()
{
	return;

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