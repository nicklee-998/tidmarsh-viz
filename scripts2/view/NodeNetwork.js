/**
 * Created by marian_mcpartland on 14/12/15.
 */
function NodeNetwork()
{
	// Network
	this.animatedObjects;
	//this._devices;

	// Google Map
	var swBound = new google.maps.LatLng(41.903035641078105, -70.57352721691132);
	var neBound = new google.maps.LatLng(41.90461270194438, -70.57067334651946);
	var center = new google.maps.LatLng(41.9038421429, -70.5725723505);

	this.bounds = new google.maps.LatLngBounds(swBound, neBound);

	var canvas = document.getElementById('map-canvas');
	var mapOptions = {
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

		// ---------------------------
		//  SEND GMAP INIT EVENT
		// ---------------------------
		jQuery.publish(GMAP_INIT);
	};

	var self = this;
}

NodeNetwork.prototype.createDevices = function()
{
	this.animatedObjects = 0;

	this.latLngToCube(41.90411, -70.572693);

	var positions = [[41.9040328, -70.5724945], [41.9039989, -70.5721499], [41.903913, -70.5725536],
		[41.9040477, -70.5730968], [41.9041645, -70.5722826], [41.9040398, -70.5723256],
		[41.90411, -70.572693], [41.90401837, -70.57267121], [41.90372, -70.57265],
		[41.9036425, -70.5713814], [41.9036036, -70.5725093], [41.9036824, -70.5724623],
		[41.9035537, -70.5717758], [41.9036984, -70.5727628], [41.90376, -70.57261],
		[41.9037663, -70.5723685], [41.9042024, -70.5719058], [41.9041944, -70.5717475],
		[41.9035367, -70.5713533], [41.9036485, -70.5716041], [41.9037533, -70.5719085],
		[41.9037413, -70.57208], [41.9041804, -70.57158], [41.9037443, -70.5715974],
		[41.9042204, -70.5722049], [41.9042075, -70.5720574], [41.9037353, -70.5714083],
		[41.9042314, -70.5723471], [41.9040857, -70.571989], [41.9035516, -70.571946],
		[41.9035607, -70.5726662], [41.9041066, -70.5723363], [41.9036645, -70.5721647],
		[41.9042504, -70.5726729], [41.9042484, -70.5724973], [41.9034748, -70.5725321],
		[41.9040049, -70.5719943], [41.9039709, -70.571474], [41.9040637, -70.5715129],
		[41.9035517, -70.5716081], [41.9039939, -70.5718241], [41.9040487, -70.5727011],
		[41.9036505, -70.5719326], [41.9035607, -70.57218], [41.903896, -70.571474],
		[41.9036395, -70.5726448], [41.9040717, -70.5716577], [41.9035547, -70.5724195],
		[41.9039869, -70.5716644], [41.903914, -70.5723229], [41.90391, -70.5719997],
		[41.9040917, -70.572146], [41.9037523, -70.5717623], [41.9038991, -70.5716765],
		[41.9040797, -70.5718187], [41.9035697, -70.57289], [41.903901, -70.5721485],
		[41.9034958, -70.5730189], [41.9036505, -70.5717677], [41.9034908, -70.5727816]];
	devices = new Array();
	vertices = new Array();
	for(var i = 0; i < positions.length; i++) {
		var box = new THREE.Mesh(
			new THREE.CylinderGeometry( 10, 10, 6, 10 ),
			new THREE.MeshLambertMaterial({color: 0x0d304d, shading: THREE.FlatShading})
		);
		var pnt = this.latLngToCube(positions[i][0], positions[i][1]);
		box.position.x = pnt.x * groundWid - groundWid / 2;
		box.position.z = pnt.y * groundHei - groundHei / 2;
		box.position.y = groundZero + 8;
		devices.push(box);
		scene.add(box);

		// for voronoi graph
		vertices.push([pnt.x * groundWid, pnt.y * groundHei]);
	}

	this.growAnimation();
}

NodeNetwork.prototype.growAnimation = function()
{
	console.log();
	//for(var i = 0; i < devices.length; i++) {
	//	var d = devices[i];
	//	var goalY = d.position.y;
	//	d.position.y = -250;
	//	d.scale.x = 0;
	//	d.scale.z = 0;
	//	TweenMax.to(d.position, 2, {y:goalY, delay:i * 0.25, ease:Elastic.easeOut});
	//	TweenMax.to(d.scale, 2, {x:1, z:1, delay:i * 0.25, ease:Elastic.easeOut});
	//}
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