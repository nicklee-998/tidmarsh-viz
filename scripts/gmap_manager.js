// JavaScript Document
function MapManager(canvas)
{
	// set up google map overlay, just for caculate the area
	var swBound = new google.maps.LatLng(41.9028759365, -70.5742943287);
  	var neBound = new google.maps.LatLng(41.9048163196, -70.5703139305);
	
  	this.bounds = new google.maps.LatLngBounds(swBound, neBound);
	this.sw;	// 右下角坐标
	this.ne;	// 左上角坐标
	this.wid;	// 绘制区域宽度
	this.hei;	// 绘制区域高度
			
	var allowZoom = 19;
  	this.mapOptions = { 
		zoom: allowZoom,
		center: this.bounds.getCenter(),
		disableDefaultUI: true,
    		mapTypeId: google.maps.MapTypeId.SATELLITE
  	};

  	this.map = new google.maps.Map(canvas, this.mapOptions);
	
	google.maps.event.addListener(this.map, 'idle', function(){
		$('#map-canvas').css('visibility', 'visible');
		$('#map-canvas').css('opacity', '0');
		$("#map-canvas").animate({opacity:'1'}, 'slow', 'swing');
		
		// ----------------------------
		// 发送地图初始化完毕事件
		// ----------------------------
		jQuery.publish(GMAP_INIT_SHOW);
	});
	
	this.features;
	this.overlay = new google.maps.OverlayView();
	this.overlay.setMap(this.map); 
	
	// -------------------
	// animation
	// -------------------
	this.animIdx;
	this.animEnd;
	this._animType;
	this._animParamList;
	
	// -------------------
	// voronoi graph
	// -------------------
	this._voronoi;
	this._nodeNum = 100; 		// 图中点的数量
	
	var self = this;
	
	// ---------------------------------------------
	// Overlay event fired after setOverlay()
	// ---------------------------------------------
	this.overlay.onAdd = function() {
		self._setAllowedArea();
		self._setAllowedZoom();
		
		// ----------------------------
		// 发送地图初始化完毕事件
		// ----------------------------
		jQuery.publish(GMAP_INIT);
	}
	
	this.overlay.draw = function() {
		//console.log("draw");
	}
	
	this.overlay.onRemove = function() {
		
	}
}

//------------------------------------------------------
// PUBLIC METHOD: 
// 	initzalize map voronoi layer
//	devlist -> device list
//------------------------------------------------------
MapManager.prototype.initVGraph = function(devlist)
{
	// voronoi graph 
	var vertices = new Array();
	var verticeInfos = new Array();
	for(var i = 0; i < sManager.devices.length; i++)
	{
		// 如果没有经纬度的设备，不处理
		if(sManager.devices[i].lat == 0 && sManager.devices[i].lng == 0)
			continue;
					
		var pnt = this.LatlngToScreen(devlist[i].lat, devlist[i].lng);
		vertices.push([pnt.x, pnt.y]);
		verticeInfos.push(devlist[i]);
	}
	// 如果vertice数量不够，再随机补充一些
	if(vertices.length < this._nodeNum)
	{
		for(var i = 0; i < (this._nodeNum-vertices.length); i++)
		{
			var px = Math.random() * this.wid;
			var py = Math.random() * this.hei;
			vertices.push([px, py]);
			verticeInfos.push(null);
		}
	}
				
	this._voronoi = new VoronoiGraph(this.sw.x, this.ne.y, this.wid, this.hei, vertices, verticeInfos);
				
	// CHANGE VERTICES SCREEN POSITION TO LATLNG
	var narr = new Array();
	for(var i = 0; i < vertices.length; i++)
	{
		var latlng = this.screenToLatLng(vertices[i][0], vertices[i][1]);
		narr.push([latlng.lng(), latlng.lat()]);
	}
				
	// CHANGE POLYGONS SCREEN POSITION TO LATLNG
	var parr = this._voronoi.genPolygons();
	var marr = new Array();
	for(var j = 0; j < parr.length; j++)
	{
		var arr = new Array();
		for(var k = 0; k < parr[j].length; k++)
		{
			var latlng = gMap.screenToLatLng(parr[j][k][0], parr[j][k][1]);
			arr.push([latlng.lng(), latlng.lat()]);
		}
		marr.push(arr);
	}
				
	// genrate geo json
	this._voronoi.genGeoJSON(narr, marr);
	// set gmap geo json
	this._genVGraph(this._voronoi.geojson);
}

// Init voronoi graph using geo json
MapManager.prototype._genVGraph = function(json)
{
	var self = this;
	
	// get voronoi graph
	this.features = this.map.data.addGeoJson(json);
				
	this.map.data.setStyle(function(feature) {
		//console.log("### " + feature.getProperty('name') + ", " + feature.getProperty('color'));
		var color = feature.getProperty('color');
		var clickable = true;
		var alpha = 1;
		if(feature.getProperty('fake') || feature.getProperty('prop0') == "point") {
			clickable = false;
			//alpha = 0.5;
		}
						
    		return ({
			clickable:clickable,		// mouse&touch interactive
      			fillColor:color,		// only polygon
			fillOpacity:alpha,		// only polygon
      			strokeColor:'rgb(0,0,0)',	// line & polygon
      			strokeWeight:0.5,		// line & polygon
			strokeOpacity:1,		// line & polygon
			icon: {anchor:new google.maps.Point(0,0) , path:google.maps.SymbolPath.CIRCLE, scale:1.25},	// only point
			iconOpacity:1
    		});
  	});
	
	this.map.data.addListener('setgeometry', function(event) {
		console.log('setgeometry');
	});
				
	this.map.data.addListener('mouseover', function(event) {
    		self.map.data.revertStyle();
    		self.map.data.overrideStyle(event.feature, {fillColor:'yellow'});
										
		var lat = event.feature.getProperty('latlng')[1];
		var lng = event.feature.getProperty('latlng')[0];
		var latlng = new google.maps.LatLng(lat, lng);
					
		/*if(!infoTooltip)
		{
			infoTooltip = new google.maps.InfoWindow({
				content:$("#tooltip").html(),
				disableAutoPan: false
			});
		}*/
		//infoTooltip.setContent(event.feature.getProperty('name'));
		//infoTooltip.setPosition(latlng);
		//infoTooltip.open(map);
  	});
				
	this.map.data.addListener('mouseout', function(event) {
    		self.map.data.revertStyle();
		//Hide the tooltip
		//infoTooltip.close();
  	});
	
	this.map.data.addListener('click', function(event) {
		// ----------------------------
		// 发送地图初始化完毕事件
		// ----------------------------
		jQuery.publish(GMAP_CLICK, event.feature);
	});
								
	// remove overlay
	this.overlay.setMap(null);
}

// -----------------------------------------------------------------------------------------
// PUBLIC METHOD: 
// 	restore voronoi layer
// -----------------------------------------------------------------------------------------
MapManager.prototype.restoreVGraph = function()
{
	this._animType = '_COLOR_RESTORE';
	this._animParamList = new Array();
	var self = this;	
	this.map.data.forEach(function(feature) {
		if(feature.getProperty('prop0') == 'cell' && feature.getProperty('name') != 'blank') {
			var clr = feature.getProperty('color');
			var clr2 = feature.getProperty('origcolor');
			var scale = d3.scale.linear()
					.domain([0, self.animEnd])
					.range([clr, clr2]);
			self._animParamList.push({name:feature.getProperty('name'), param:scale});
		}
	});
}

// -----------------------------------------------------------------------------------------
// PUBLIC METHOD: 
// 	clear voronoi layer
// -----------------------------------------------------------------------------------------
MapManager.prototype.clearVGraph = function()
{
	this._animType = '_COLOR';
	this._animParamList = new Array();
	var self = this;	
	this.map.data.forEach(function(feature) {
		if(feature.getProperty('prop0') == 'cell' && feature.getProperty('name') != 'blank') {
			var clr = feature.getProperty('origcolor');
			var scale = d3.scale.linear()
					.domain([0, self.animEnd])
					.range([clr, 'rgb(247,247,247)']);
			self._animParamList.push({name:feature.getProperty('name'), param:scale});
		}
		
	});
}

MapManager.prototype.doAnimation = function() 
{
	if(this.animIdx == this.animEnd) {
		jQuery.publish(GMAP_ANIMATION_DONE);
		return;	
	}
	
	var self = this;
	if(this._animType = '_COLOR') {
		this.map.data.forEach(function(feature) {
			if(feature.getProperty('prop0') == 'cell' && feature.getProperty('name') != 'blank') {
				for(var i = 0; i < self._animParamList.length; i++) {
					if(feature.getProperty('name') == self._animParamList[i].name) {
						feature.setProperty('color', self._animParamList[i].param(self.animIdx));
						break;
					}
				}
			}
		});
	} else if(this._animType == '_COLOR_RESTORE') {
		this.map.data.forEach(function(feature) {
			if(feature.getProperty('prop0') == 'cell' && feature.getProperty('name') != 'blank') {
				for(var i = 0; i < self._animParamList.length; i++) {
					if(feature.getProperty('name') == self._animParamList[i].name) {
						feature.setProperty('color', self._animParamList[i].param(self.animIdx));
						break;
					}
				}
			}
		});
	} else if(this._animType == '_COLOR_UPDATE') {
		this.map.data.forEach(function(feature) {
			if(feature.getProperty('prop0') == 'cell' && feature.getProperty('name') != 'blank') {
				for(var i = 0; i < self._animParamList.length; i++) {
					if(feature.getProperty('name') == self._animParamList[i].name) {
						feature.setProperty('color', self._animParamList[i].param(self.animIdx));
						break;
					}
				}
			}
		});
	}

	self.animIdx++;
}

// -----------------------------------------------------------------------------------------
// PUBLIC METHOD: 
// 	update map voronoi layer
//	objs -> [{did:"0x8112", sid:"sht_temperature", property:"color", value:"12"}] 
// -----------------------------------------------------------------------------------------
MapManager.prototype.updateVGraph = function(objs)
{
	this._animType = '_COLOR_UPDATE';
	this._animParamList = new Array();
	var self = this;	
	this.map.data.forEach(function(feature) {
		for(var i = 0; i < objs.length; i++) {
			var obj = objs[i];
			if(feature.getProperty("name") == obj.did) {
				var clr = feature.getProperty('color');
				var fobj = self._voronoi.genColorByValue(obj.did, obj.sid, obj.value);
				var scale = d3.scale.linear()
						.domain([0, self.animEnd])
						.range([clr, fobj.value]);
				self._animParamList.push({name:feature.getProperty('name'), param:scale});		
				break;
			}
		}	
	});
}





// Change Screen Position to LatLng
MapManager.prototype.screenToLatLng = function(px, py)
{
	var project = this.overlay.getProjection();
	var pnt = new google.maps.Point(px + this.sw.x, py + this.ne.y);
	var latlng = project.fromContainerPixelToLatLng(pnt);
	
	return latlng;
}

// Change LatLng to Screen Position
MapManager.prototype.LatlngToScreen = function(lat, lng)
{
	var project = this.overlay.getProjection();
	var latlng = new google.maps.LatLng(lat, lng);
	var pnt = project.fromLatLngToContainerPixel(latlng);
	pnt.x -= this.sw.x;
	pnt.y -= this.ne.y;

	return pnt;
}

//----------------------------------------------
// PRIVATE METHOD
//----------------------------------------------
MapManager.prototype._setAllowedArea = function() 
{
	var self = this;
	var project = this.overlay.getProjection();
	
	this.sw = project.fromLatLngToContainerPixel(this.bounds.getSouthWest());
	this.ne = project.fromLatLngToContainerPixel(this.bounds.getNorthEast());
	this.wid = this.ne.x - this.sw.x;
	this.hei = this.sw.y - this.ne.y;
	
	// create limit area
	var ssw = project.fromLatLngToContainerPixel(self.map.getBounds().getSouthWest());
	var sne = project.fromLatLngToContainerPixel(self.map.getBounds().getNorthEast());
	var swid = sne.x - ssw.x;
	var shei = ssw.y - sne.y;
	var limitsw = new google.maps.Point(this.sw.x + swid/2, this.sw.y - shei/2);
	var limitne = new google.maps.Point(this.ne.x - swid/2, this.ne.y + shei/2);
	var newsw = project.fromContainerPixelToLatLng(limitsw);
	var newne = project.fromContainerPixelToLatLng(limitne);
	var allowBound = new google.maps.LatLngBounds(newsw, newne);
	
	// Limit the area
	google.maps.event.addListener(this.map,'center_changed', function() 
	{ 
		if(!allowBound.contains(self.map.getCenter())) {
      		var C = self.map.getCenter();
      		var X = C.lng();
      		var Y = C.lat();

      		var AmaxX = allowBound.getNorthEast().lng();
      		var AmaxY = allowBound.getNorthEast().lat();
     		var AminX = allowBound.getSouthWest().lng();
      		var AminY = allowBound.getSouthWest().lat();

      		if (X < AminX) {X = AminX;}
      		if (X > AmaxX) {X = AmaxX;}
      		if (Y < AminY) {Y = AminY;}
      		if (Y > AmaxY) {Y = AmaxY;}

      		self.map.setCenter(new google.maps.LatLng(Y,X));
   		}
	});
}

MapManager.prototype._setAllowedZoom = function()
{
	// Limit the zoom level
	var self = this;
	var allowZoom = this.mapOptions.zoom;
   	google.maps.event.addListener(this.map, 'zoom_changed', function() {
     		if (self.map.getZoom() < allowZoom || self.map.getZoom() > allowZoom) {
			self.map.setZoom(allowZoom);
		}
   	});
}
