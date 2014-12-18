// JavaScript Document
function MapManager(canvas)
{
	// map state
	this.state = 1;			// 1.normal, 2.sensor, 22.sensor #2, 3.topology, 4.ghost, 5.multi ghost, 6.farm
	// ghost state
	this.ghostState = 'single'; 	// 1.single, 2.multiple
	
	// set up google map overlay, just for caculate the area
	var swBound = new google.maps.LatLng(41.90093549448898, 289.42344188690186);
  	var neBound = new google.maps.LatLng(41.913423563137016, 289.4401788711548);
	var center = new google.maps.LatLng(41.9038421429, -70.5725723505);
	
  	this.bounds = new google.maps.LatLngBounds(swBound, neBound);
	this.sw;	// 右下角坐标
	this.ne;	// 左上角坐标
	this.wid;	// 绘制区域宽度
	this.hei;	// 绘制区域高度
			
	this._allowZoomMin = 17;
	this._allowZoomMax = 20;
			
	var allowZoom = 19;
  	this.mapOptions = { 
		zoom: allowZoom,
		center: center,
		disableDefaultUI: true,
    		mapTypeId: google.maps.MapTypeId.SATELLITE
  	};

  	this.map = new google.maps.Map(canvas, this.mapOptions);
	
	google.maps.event.addListener(this.map, 'idle', function(){
		// ----------------------------
		// 发送地图初始化完毕事件
		// ----------------------------
		jQuery.publish(GMAP_INIT_SHOW);
	});
	
	this.features;
	this.layer;
	this.overlay = new google.maps.OverlayView();
	this.overlay.setMap(this.map); 
	
	this._farmBoundarys;
	this._wholeBoundary;		// 整个tidmarsh的边界

	this._mouseoverItem = null;
	this._mouseoverOrigColor = null;
	
	this._allowBound = null;
	
	// ---------------------------------------------
	// Drag Gesture
	// ---------------------------------------------
	this._prevPosX;
	this._prevPosY;
	
	// ---------------------------------------------
	// Overlay event fired after setOverlay()
	// ---------------------------------------------
	this.overlay.onAdd = function() {
		
		//self._setAllowedZoom();
				
		var project = self.overlay.getProjection();
	
		self.sw = project.fromLatLngToContainerPixel(self.bounds.getSouthWest());
		self.ne = project.fromLatLngToContainerPixel(self.bounds.getNorthEast());
		self.wid = self.ne.x - self.sw.x;
		self.hei = self.sw.y - self.ne.y;
		
		self.layer = d3.select(self.overlay.getPanes().overlayMouseTarget).append("div")
				.attr('id', 'vgcontainer')
				.attr('class', "stations");
						
		// ----------------------------
		// 发送地图初始化完毕事件
		// ----------------------------
		jQuery.publish(GMAP_INIT);
	}
	
	this.overlay.draw = function() {
		var project = self.overlay.getProjection();
		var ssw = project.fromLatLngToDivPixel(self.bounds.getSouthWest());
		var sne = project.fromLatLngToDivPixel(self.bounds.getNorthEast());
		var swid = sne.x - ssw.x;
		var shei = ssw.y - sne.y;
				
		$('#vgraphroot').css('left', ssw.x + 'px');
		$('#vgraphroot').css('top', sne.y + 'px');
		$('#vgraphroot').css('width', (sne.x - ssw.x) + 'px');
		$('#vgraphroot').css('height', (ssw.y - sne.y) + 'px');
		
		//self._setAllowedArea();
	}
	
	this.overlay.onRemove = function() {
		
	}
	
	// ----------------------------
	// Limit the area
	// ----------------------------
	google.maps.event.addListener(this.map, 'center_changed', function() {
		
		if(self._allowBound == null)
			return;
	
		if(!self._allowBound.contains(self.map.getCenter())) {
      			var C = self.map.getCenter();
      			var X = C.lng();
      			var Y = C.lat();

      			var AmaxX = self._allowBound.getNorthEast().lng();
      			var AmaxY = self._allowBound.getNorthEast().lat();
     			var AminX = self._allowBound.getSouthWest().lng();
      			var AminY = self._allowBound.getSouthWest().lat();

      			if (X < AminX) {X = AminX;}
      			if (X > AmaxX) {X = AmaxX;}
      			if (Y < AminY) {Y = AminY;}
      			if (Y > AmaxY) {Y = AmaxY;}

      			self.map.setCenter(new google.maps.LatLng(Y,X));
   		}
	});
	
	// -------------------
	// voronoi graph
	// -------------------
	this.blankColor = "rgb(247,247,247)";
	this.ghostColor = "rgb(255,255,0)";
	
	this._voronoi;
	this._vgsvg;
	this._vgpath;
	this._vginfo;			// 显示sensor信息（如温度、湿度等等）
	this._vgid;			// 显示device ID
	this._vgcenter;			// 每个cell的中点
	this._vgclip;
	this._vgclipwhole;
	this._vgboundary;
	this._nodeNum = 300; 		// 图中点的数量
	
	this._vertices;
	this._verticeInfos;

	// -------------------
	// poisson disc
	// -------------------
	this._k;
	this._R;
	this._radius2;
	this._cellSize;
	this._gridWidth = 0;
	this._gridHeight = 0;
	this._grid;
	this._queue = [];
	this._queueSize = 0;
	this._sampleSize = 0;
	
	// ghost 
	this.ghostNum = 5;		// ghost总数量
		
	var self = this;
}

//------------------------------------------------------
// PUBLIC METHOD: 
// 	initzalize map voronoi layer
//	devlist -> device list
// 	device info: {type, device, style}
//------------------------------------------------------
MapManager.prototype.initVGraph = function(devlist)
{
	var self = this;
	var tmpvertices = new Array();	// 临时记录device的坐标，为了blank区域不要生成在sensor区中

	// Poisson Disc
	// TODO: radius should put in config file
	var radius = this.wid / 100;
	this._k = 30;
	this._radius2 = radius * radius;
	this._R = 3 * this._radius2;
	this._cellSize = radius * Math.SQRT1_2;
	this._gridWidth = Math.ceil(this.wid / this._cellSize);
	this._gridHeight = Math.ceil(this.hei / this._cellSize);
	this._grid = new Array(this._gridWidth * this._gridHeight);

	// voronoi graph 
	this._vertices = new Array();
	this._verticeInfos = new Array();
	for(var i = 0; i < this.ghostNum; i++) {
		var px = Math.random() * this.wid;
		// TODO: adjust ghost init position, now we let ghost all in 1/3 upper space just for simplify.
		var py = Math.random() * this.hei / 3;
		var sobj = {};
		sobj.color = this.ghostColor;
		sobj.origColor = this.ghostColor;
		sobj.opacity = 1;
		sobj.stroke = 'rgba(0,0,0,1)';
		sobj.strokeWidth = 1;
		sobj.pointerEvents = 'none';
		this._vertices.push([px, py]);
		this._verticeInfos.push({type:'ghost', device:{title:'ghost_' + i}, style:sobj});
	}
	for(var i = 0; i < sManager.devices.length; i++) {
		// 如果没有经纬度的设备，不处理
		if(sManager.devices[i].lat == 0 && sManager.devices[i].lng == 0)
			continue;

		//console.log("[" + devlist[i].lat + ", " + devlist[i].lng + "]");
		var pnt = this.LatlngToScreen(devlist[i].lat, devlist[i].lng);
		this._vertices.push([pnt.x, pnt.y]);
		// poisson dict -
		this._sample(pnt.x, pnt.y);
		// tmp vertices
		tmpvertices.push([pnt.x, pnt.y]);
		
		// 新增device的style信息
		var sobj = {};
		sobj.color = this.blankColor;
		sobj.origColor = this.blankColor;
		sobj.opacity = 1;
		sobj.stroke = 'rgba(0,0,0,1)';
		sobj.strokeWidth = 1;
		sobj.pointerEvents = 'auto';
		sobj.circleR = 17;
		sobj.circleColor = 'rgb(253,162,49)';
		this._verticeInfos.push({type:'cell', device:devlist[i], style:sobj});
	}
	// 如果vertice数量不够，再随机补充一些
	if(this._vertices.length < this._nodeNum) {
		var len = this._vertices.length;
		var i = 0;
		var over = false;
		while(i < (this._nodeNum - len) && !over) {
			var s = this._poissonDiscSampler();
			//console.log(i + ", " + s);
			if(s) {
				var px = s[0];
				var py = s[1];

				var sobj = {};
				sobj.color = this.blankColor;
				sobj.origColor = this.blankColor;
				sobj.opacity = 1;
				sobj.stroke = 'rgba(0,0,0,1)';
				sobj.strokeWidth = 1;
				sobj.pointerEvents = 'none';
				this._vertices.push([px, py]);
				this._verticeInfos.push({type:'blank', device:{title:'fake_' + i}, style:sobj});

				i++;
			} else {
				over = true;
			}
		}
	}

	this._voronoi = d3.geom.voronoi().clipExtent([[0, 0], [this.wid, this.hei]]);

	/***************************************************
	 * 开始绘制地图
	 ***************************************************/
	this._vgsvg = this.layer.append("svg")
			.attr('id', 'vgraphroot')
    			.attr("width", this.wid)
    			.attr("height", this.hei)
			.attr('viewBox', '0 0 '+ this.wid + ' ' + this.hei)
			.style('left', this.sw.x + 'px')
			.style('top', this.ne.y + 'px');

	this._vgpath = this._vgsvg.append("g").selectAll("path");
	this._vgcenter = this._vgsvg.append("g");
	this._vginfo = this._vgsvg.append("g");
	this._vgid = this._vgsvg.append("g");

	// 绘制点
	this._vgcenter.selectAll("circle")
    		.data(this._vertices)
  		.enter().append("circle")
		.attr('id', function(d, i) {
			if(self._verticeInfos[i].type == 'cell')
				return self._verticeInfos[i].device.title + '_c';
			return 'blank';
		})
    		.attr("transform", function(d) {
			return "translate(" + d + ")";
		})
    		.attr("r", 1.5)
		.on("mouseover", function(d, i) {
			
		})
		.on("mouseout", function() {
			
		})
		.on("click", function(d, i) {
			var _d = d;
			var project = self.overlay.getProjection();
			var latlng = new google.maps.LatLng(self._verticeInfos[i].device.lat, self._verticeInfos[i].device.lng);
			var pnt = project.fromLatLngToContainerPixel(latlng);
			
			// effect
			self._vgsvg.selectAll("circle")
				.transition().duration(500)
				.style("fill", function(d, i) {
					if(d[0] == _d[0] && d[1] == _d[1]) {
						return 'rgb(253,162,49)';
					} else {
						return 'rgb(93, 63, 17)';
					}
				})
				.style("fill-opacity", function() {
					if(d[0] == _d[0] && d[1] == _d[1]) {
						return 1;
					} else {
						return 0.65;
					}
				});
			
			// ----------------------------
			// 发送点击事件
			// ----------------------------
			jQuery.publish(GMAP_CIRCLE_CLICK, {cid:d3.select(this).attr('id'), px:pnt.x, py:pnt.y});
		});
		
	// 绘制文字区
	this._vginfo.selectAll("text")
		.data(this._vertices)
		.enter().append("text")
		.attr("name", function(d, i) {
			return self._verticeInfos[i].device.title;
		})
		.attr("transform", function(d) {
			var px = d[0];
			var py = d[1];
			py += 15;
			return "translate(" + px + "," + py + ")";
		})
		.style('text-anchor', 'middle')
		.style('pointer-events', 'none')
		.text(function(d) {return "";});

	// 绘制设备ID
	this._vgid.selectAll("text")
		.data(this._vertices)
		.enter().append("text")
		.attr("name", function(d, i) {
			return self._verticeInfos[i].device.title;
		})
		.attr("transform", function(d) {
			var px = d[0];
			var py = d[1];
			py += 10;
			py -= 15;
			return "translate(" + px + "," + py + ")";
		})
		.attr("class", "gmap_deviceid")
		.text(function(d, i) {
			if(self._verticeInfos[i].type == "cell") {
				return self._verticeInfos[i].device.title;
			} else {
				return "";
			}
		});

	this._redraw();
	
	// load tidmarsh farm boundary
	$.getJSON("res/map.geojson", function(dat) {
		// find whole area and map center
		self._farmBoundarys = new Array();
		var tmparr = dat['features'];
		for(var i = 0; i < tmparr.length; i++) {
			var mobj = tmparr[i];
			var arr = new Array();
			if(mobj.geometry.type == "Polygon" && mobj.properties.name != "whole_area") {
				var geo = mobj.geometry.coordinates[0];
				for(var j = 0; j < geo.length; j++) {
					var pnt = self.LatlngToScreen(geo[j][1], geo[j][0]);
					arr.push([pnt.x, pnt.y]);
				}
				self._farmBoundarys.push(arr);
			}
		}
		
		self._vgclip = self._vgsvg.append('clipPath')
					.attr('id', 'farm-boundary')
					.selectAll('path')
					.data(self._farmBoundarys, self._polygon)
					.enter()
					.append('path')
					.attr("d", self._polygon)
					.attr('id', function(d) {
						return "d";
					});
	});

	// load boundary
	$.getJSON("res/boundary.geojson", function(dat) {
		self._wholeBoundary = new Array();
		var tmparr = dat['features'];
		for(var i = 0; i < tmparr.length; i++) {
			var mobj = tmparr[i];
			var arr = new Array();
			var geo = mobj.geometry.coordinates[0];
			for(var j = 0; j < geo.length; j++) {
				var pnt = self.LatlngToScreen(geo[j][1], geo[j][0]);
				arr.push([pnt.x, pnt.y]);
			}
			self._wholeBoundary.push(arr);
		}

		self._vgclipwhole = self._vgsvg.append('clipPath')
			.attr('id', 'whole-boundary')
			.selectAll('path')
			.data(self._wholeBoundary, self._polygon)
			.enter()
			.append('path')
			.attr("d", self._polygon)
			.attr('id', function(d) {
				return "d";
			});

		self._vgsvg.attr('clip-path', function(d) {return "url(#whole-boundary)";});

		// add the whole boundary
		self._vgboundary = self._vgsvg.append('svg')
			.attr('id', 'fBoundary')
			.selectAll('path')
			.data(self._wholeBoundary, self._polygon)
			.enter()
			.append('path')
			.attr("d", self._polygon)
			.attr('id', function(d) {
				return "d";
			})
			.style("stroke", "rgba(255,0,0,0.45)")
			.style("stroke-width", 35)
			.style("fill-opacity", 0);
	});
}

// -----------------------------------------------------------------------------------------
// PUBLIC METHOD: 
// 	restore voronoi layer
//	mode: 
// -----------------------------------------------------------------------------------------
MapManager.prototype.restoreVGraph = function(mode)
{
	// If in farm mode, exit first
	if(this.state == 6) {
		this.exitFarmMode();
	}

	var self = this;
	
	if(mode == 1) {		// regular mode
		this._vgpath
			.transition()
			.duration(500)
			.style("fill-opacity", function(d, i) {
				self._verticeInfos[i].style.opacity = 1;
				return 1;
			})
			.style('stroke-width', function(d, i) {
				self._verticeInfos[i].style.strokeWidth = 1;
				return 1;
			})
			.style("fill", function(d, i) {
				if(self._verticeInfos[i].type == 'ghost') {
					self._verticeInfos[i].style.color = self.ghostColor;
					return self.ghostColor;
				} else {
					self._verticeInfos[i].style.color = self.blankColor;
					return self.blankColor;
				}
			});
			
		this._vgpath.style('pointer-events', 'auto');
		
		//self._vgsvg.attr('clip-path', function(d) {return "";})

		this._vgcenter.selectAll("circle")
			.transition()
			.duration(500)
			.attr("r", function(d, i) {
				return 1.5;
			})
			.style("fill", 'rgb(0,0,0)')
			.style("stroke-width", 0)
			.style('pointer-events', 'none');

		this._vginfo.selectAll("text")
			.attr("transform", function(d) {
				var px = d[0];
				var py = d[1];
				py += 15;
				return "translate(" + px + "," + py + ")";
			})
			.text('');
		
		this.state = 1;
			
	} else if(mode == 2) {
		this._vgpath
			.transition().duration(500)
			.style("fill", function(d, i) {
				self._verticeInfos[i].style.color = self.blankColor;
				return self._verticeInfos[i].style.color;
			})
			.style('fill-opacity', function(d, i) {
				self._verticeInfos[i].style.opacity = 1;
				return 1;
			})
			.style('stroke-width', function(d, i) {
				self._verticeInfos[i].style.strokeWidth = 1;
				return 1;
			});
		this._vgcenter.selectAll("circle")
			.transition().duration(500)
			.attr("r", function(d, i) {
				return 1.5;
			})
			.style("fill", 'rgb(0,0,0)')
			.style("stroke-width", 0);
		this._vginfo.selectAll("text")
			.attr("transform", function(d) {
				var px = d[0];
				var py = d[1];
				py += 15;
				return "translate(" + px + "," + py + ")";
			})
			.text('');

		this.state = 2;

	} else if(mode == 22) {
		this._vgpath
			.transition().duration(500)
			.style('fill-opacity', function(d, i) {
				if(self._verticeInfos[i].style.color == self.blankColor) {
					self._verticeInfos[i].style.opacity = 0.1;
				} else {
					self._verticeInfos[i].style.opacity = 0.7;
				}

				return self._verticeInfos[i].style.opacity;
			});

		this.state = 22;

	}else if(mode == 3) {		// topology mode
		this._vgpath
			.transition()
			.duration(500)
			.style("fill-opacity", function(d, i) {
				self._verticeInfos[i].style.opacity = 0;
				return 0;
			})
			.style('stroke-width', function(d, i) {
				self._verticeInfos[i].style.strokeWidth = 0;
				return 0;
			});

		this._vgcenter.selectAll("circle")
			.attr("r", function(d, i) {
				if(self._verticeInfos[i].type == 'cell') {
					return 1.5;
				} else {
					return 0;
				}
			})
			.transition().duration(500)
			.style("fill", function(d, i) {
				return self._verticeInfos[i].style.circleColor;
			})
			.style("stroke", 'rgba(0,0,0,0.8)')
			.style("stroke-width", 1)
			.style('pointer-events', 'auto')
			.attr("r", function(d, i) {
				if(self._verticeInfos[i].type == 'cell') {
					return self._verticeInfos[i].style.circleR;
				} else {
					return 0;
				}
			});

		this._vginfo.selectAll("text")
			.text(function(d, i) {
				if(self._verticeInfos[i].type == 'cell') {
					var title = self._verticeInfos[i].device.title;
					var str = title.substr(title.length-2, 2);
					return str.toUpperCase();
				} else {
					return '';
				}
			})
			.attr("transform", function(d) {
				var px = d[0];
				var py = d[1];
				py += 5;
				return "translate(" + px + "," + py + ")";
			});
		
		this.state = 3;
		
	} else if(mode == 4) {	// ghost state
		this._vgpath
			.transition()
			.duration(500)
			.style('fill', function(d, i) {
				if(self._verticeInfos[i].type == 'ghost') {
					self._verticeInfos[i].style.color = self.ghostColor;
					return self.ghostColor;
				} else {
					self._verticeInfos[i].style.color = self.blankColor;
					return self.blankColor;
				}
			})
			.style("fill-opacity", function(d, i) {
				if(i < self.ghostNum) {
					self._verticeInfos[i].style.opacity = 1;
					return 1;
				} else {
					self._verticeInfos[i].style.opacity = 0;
					return 0;
				}
			})
			.style('stoke', 'rgb(2,15,83)')
			.style('stroke-width', function(d, i) {
				self._verticeInfos[i].style.strokeWidth = 1.5;
				return 1.5;
			});

		this._vgcenter.selectAll("circle")
			.transition().duration(500)
			.style("stroke", 'rgba(0,0,0,0.8)')
			.style("stroke-width", 1)
			.attr("r", function(d, i) {
				return 0;
			});

		this._vginfo.selectAll("text")
			.text(function(d, i) {
				return '';
			})
			.attr("transform", function(d) {
				var px = d[0];
				var py = d[1];
				py += 5;
				return "translate(" + px + "," + py + ")";
			});
			
		this.state = 4;
		
	} else if(mode == 5) {	// multi ghost state
		
		this.state = 5;
		
	} else {
		
	}
}

// -----------------------------------------------------------------------------------------
// PUBLIC METHOD: 
// 	update map voronoi layer
//	objs -> [{did:"0x8112", sid:"sht_temperature", property:"color", value:"12"}] 
// -----------------------------------------------------------------------------------------
MapManager.prototype.updateVGraph = function(objs)
{
	var self = this;

	this._vgpath
		.style("fill", function(d, i) {
			var pid = d3.select(this).attr("id");
			if(pid.indexOf("fake") != -1 || pid.indexOf("ghost") != -1) {
				return d3.select(this).style("fill");
			}

			for(var j = 0; j < objs.length; j++) {
				var obj = objs[j];
				if(d3.select(this).attr("id") == obj.did) {
					//console.log('###: ' + obj.did + " - " + obj.value);
					var fobj = self._genColorByValue(obj.did, obj.sid, obj.value);
					self._verticeInfos[i].style.color = fobj.value;
					//objs.splice(j, 1);
					return fobj.value;
				}
			}
			//console.log('============');
			return d3.select(this).style("fill");
		});

	this._vginfo.selectAll("text")
		.text(function(d, i) {
			var pid = d3.select(this).attr("name");
			if(pid.indexOf("fake") != -1 || pid.indexOf("ghost") != -1) {
				return d3.select(this).text();
			}

			for(var i = 0; i < objs.length; i++) {
				var obj = objs[i];
				if(d3.select(this).attr("name") == obj.did) {
					if(obj.value == -999) {
						return "";
					} else {
						return obj.value.toFixed(2);
					}
				}
			}
			return d3.select(this).text();
		});
}

// -----------------------------------------------------------------------------------------
// PUBLIC METHOD: 
// 	show infomation about incoming data
// -----------------------------------------------------------------------------------------
MapManager.prototype.showIncomingMessage = function(did, sid, msg, value)
{
	var self = this;
	this._vgpath
		.transition()
		.duration(500)
		.style("fill", function(d, i) {
			if(d3.select(this).attr("id") == did) {
				var fobj = self._genColorByValue(did, sid, value);
				self._verticeInfos[i].style.color = fobj.value;
				if(self.mode == 22) {
					self._verticeInfos[i].style.opacity = 0.6;
				} else {
					self._verticeInfos[i].style.opacity = 1;
				}
				return fobj.value;
			} else {
				return d3.select(this).style("fill");	
			}
		});

	this._vginfo.selectAll("text")
		.text(function(d, i) {
			if(d3.select(this).attr("name") == did) {
				var startclr, endclr;
				/*if(self.state == 4 || self.state == 5) {
					startclr = 'rgb(0,0,0)';
					endclr = 'rgb(255,255,255)';
				} else {
					startclr = 'rgb(255,255,255)';
					endclr = 'rgb(0,0,0)';
				}*/
				
				d3.select(this)
					.style('opacity', 0.7)
					.style('fill', 'rgb(255,255,255)')
					.transition()
					.duration(800)
					.ease('exp')
					.style('opacity', 1)
					.style('fill', 'rgb(0,0,0)');
				
				return msg;
			}
			return d3.select(this).text();
		});
}

MapManager.prototype.enterFarmMode = function()
{
	var self = this;

	this._vgsvg.attr('clip-path', function(d) {return "url(#farm-boundary)";});

	this._vgpath
		.transition()
		.duration(500)
		.style("fill-opacity", function(d, i) {
			if(self._verticeInfos[i].type == "ghost") {
				self._verticeInfos[i].style.opacity = 1;
			} else {
				self._verticeInfos[i].style.opacity = 0;
			}
			return self._verticeInfos[i].style.opacity;
		})
		.style("stroke-width", function(d, i) {
			if(self._verticeInfos[i].type == "ghost") {
				self._verticeInfos[i].style.strokeWidth = 1;
			} else {
				self._verticeInfos[i].style.strokeWidth = 0;
			}
			return self._verticeInfos[i].style.strokeWidth;
		});

	this._vgcenter.selectAll("circle")
		.transition()
		.duration(500)
		.attr("r", function(d, i) {
			return 1.5;
		})
		.style("fill", 'rgb(0,0,0)')
		.style("stroke-width", 0)
		.style('pointer-events', 'none');

	this._vginfo.selectAll("text")
		.attr("transform", function(d) {
			var px = d[0];
			var py = d[1];
			py += 15;
			return "translate(" + px + "," + py + ")";
		})
		.text('');

	// add the boundary
	this._vgboundary = this._vgsvg.append('svg')
		.attr('id', 'fBoundary')
		.selectAll('path')
		.data(this._farmBoundarys, this._polygon)
		.enter()
		.append('path')
		.attr("d", this._polygon)
		.attr('id', function(d) {
			return "d";
		})
		.style("stroke", "rgba(255,255,255,0.65)")
		.style("stroke-width", 25)
		.style("fill-opacity", 0);

	this.state = 6;
}

MapManager.prototype.exitFarmMode = function()
{
	var self = this;

	// restore to whole boundary
	this._vgsvg.attr('clip-path', function(d) {return "url(#whole-boundary)";});

	// remove the boundary
	this._vgboundary.remove();

	// add the whole boundary
	this._vgboundary = this._vgsvg.append('svg')
		.attr('id', 'fBoundary')
		.selectAll('path')
		.data(this._wholeBoundary, this._polygon)
		.enter()
		.append('path')
		.attr("d", this._polygon)
		.attr('id', function(d) {
			return "d";
		})
		.style("stroke", "rgba(255,0,0,0.45)")
		.style("stroke-width", 35)
		.style("fill-opacity", 0);

	this._vgpath
		.transition()
		.duration(500)
		.style("fill-opacity", function(d, i) {
			self._verticeInfos[i].style.opacity = 1;
			return 1;
		});
}

MapManager.prototype._genColorByValue = function(deviceid, sensorid, value)
{
	var conf = getConfigBySensor(sensorid);
	var obj;
	if(value < conf.min) {
		obj = {name:deviceid, property:"color", value:this.blankColor};
	} else {
		var c1 = "hsl(" + conf.hueL + ", " + conf.saturationL + "%, " + conf.lightnessL + "%)";
		var c2 = "hsl(" + conf.hueR + ", " + conf.saturationR + "%, " + conf.lightnessR + "%)";

		var valueToColorScale = d3.scale.sqrt()
			.domain([conf.min, conf.max])
			.range([c1, c2])
			.interpolate(d3.interpolateHsl);

		obj = {name:deviceid, property:"color", value:valueToColorScale(value)};
	}

	return obj;
}

MapManager.prototype._redraw = function() 
{
	var self = this;
	
	this._vgpath = this._vgpath.data(this._voronoi(this._vertices), this._polygon);
  	this._vgpath.exit().remove();
	this._vgpath.enter()
		.append("path")
		.attr('id', function(d, i) {
			var idstr = self._verticeInfos[i].device.title;
			return idstr;
		})
		.attr("d", this._polygon)
		.style('fill-opacity', function(d, i) {
			return self._verticeInfos[i].style.opacity;
		})
      		.style("fill", function(d, i) {
			return self._verticeInfos[i].style.color;
		})
		.style('stroke', function(d, i) {
			return self._verticeInfos[i].style.stroke;
		})
		.style('stroke-width', function(d, i) {
			return self._verticeInfos[i].style.strokeWidth;
		})
		.style('pointer-events', function(d, i) {
			return self._verticeInfos[i].style.pointerEvents;
		})
		.on("mouseover", function(d, i) {
			//d3.select(this).style('fill-opacity', 0);
			
			//Get this bar's x/y values, then augment for the tooltip
			/*var coordinates = self.vertices[i];
			var x = coordinates[0] + 20;
			var y = coordinates[1] - 15;
			var dname = d3.select(this).attr("name");

			//Update the tooltip position and value
			d3.select("#tooltip")
				.style("left", x + "px")
				.style("top", y + "px")						
				.select("#name")
				.text("device : " + dname);
			d3.select("#tooltip")
				.select("#value")
				.text("");
					
			//Show the tooltip
			d3.select("#tooltip").classed("hidden", false);*/
		})
		.on("mouseout", function() {
			//d3.select(this).style('fill-opacity', 1);

			//Hide the tooltip
			//d3.select("#tooltip").classed("hidden", true);
		})
                .on("mousedown", function(d) {
			self._prevPosX = d3.event.screenX;
			self._prevPosY = d3.event.screenY;
                })
		.on("mouseup", function() {
			var px = d3.event.screenX;
			var py = d3.event.screenY;
			var dist = self._lineDistance(self._prevPosX, self._prevPosY, px, py);

			if(dist < 20) {
				// ----------------------------
				// 发送点击事件
				// ----------------------------
				jQuery.publish(GMAP_CLICK, d3.select(this).attr('id'));
			}
		});
  	this._vgpath.order();
}

MapManager.prototype._polygon = function(d)
{
	return "M" + d.join("L") + "Z";
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
	var pnt = project.fromLatLngToDivPixel(latlng);
	pnt.x -= this.sw.x;
	pnt.y -= this.ne.y;

	return pnt;
}

//----------------------------------------------
// PRIVATE METHOD - Poisson Disc
//----------------------------------------------
MapManager.prototype._poissonDiscSampler = function()
{
	while(this._queueSize) {
		var i = Math.random() * this._queueSize | 0;
		var s = this._queue[i];

		for(var j = 0; j < this._k; ++j) {
			var a = 2 * Math.PI * Math.random();
			var r = Math.sqrt(Math.random() * this._R + this._radius2);
			var x = s[0] + r * Math.cos(a);
			var y = s[1] + r * Math.sin(a);

			if(0 <= x && x < this.wid && 0 <= y && y < this.hei && this._far(x, y))
				return this._sample(x, y);
		}

		this._queue[i] = this._queue[--this._queueSize];
		this._queue.length = this._queueSize;
	}
}

MapManager.prototype._far = function(x, y)
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

MapManager.prototype._sample = function(x, y)
{
	var s = [x, y];
	this._queue.push(s);
	this._grid[this._gridWidth * (y / this._cellSize | 0) + (x / this._cellSize | 0)] = s;
	++this._sampleSize;
	++this._queueSize;
	return s;
}

//----------------------------------------------
// PRIVATE METHOD - GOOGLE MAP EVENT
//----------------------------------------------
MapManager.prototype._setMapMouseListener = function() 
{
	var self = this;
	
	// 鼠标事件
	google.maps.event.addListener(this.map, 'mousemove', function(evt) {
		var project = self.overlay.getProjection();
		var offsetLeft = $('#vgraphroot').offset().left;
		var offsetTop = $('#vgraphroot').offset().top;
		var pnt = project.fromLatLngToContainerPixel(evt.latLng);
		//self._vertices[0] = [pnt.x - offsetLeft, pnt.y - offsetTop];
		//self._redraw();
			
		var root = document.getElementById('vgraphroot');
		var rpos = root.createSVGRect();
  		rpos.x = pnt.x - offsetLeft;
  		rpos.y = pnt.y - offsetTop;
  		rpos.width = rpos.height = 1;
		var nodelist = root.getIntersectionList(rpos, null);
		
		if(nodelist.length > 0) {
			if(nodelist[0].id != 'blank' && nodelist[0] != self._mouseoverItem) {
				if(self._mouseoverItem != null) {
					self._mouseoverItem.style.fill = self._mouseoverOrigColor;
				}
				self._mouseoverItem = nodelist[0];
				self._mouseoverOrigColor = nodelist[0].style.fill;
						
				if(nodelist[0].id.indexOf('_c') != -1) {
					nodelist[0].style.fill = 'rgb(255,0,255)';
				} else {
					nodelist[0].style.fill = 'rgb(255,255,0)';
				}
				
			} else if(nodelist[0].id == 'blank') {
				if(self._mouseoverItem != null) {
					self._mouseoverItem.style.fill = self._mouseoverOrigColor;
					self._mouseoverItem = null;
				}
			}
		}
	});
	
	google.maps.event.addListener(this.map, 'click', function(evt) {
		if(self._mouseoverItem != null) {
			// ----------------------------
			// 发送地图初始化完毕事件
			// ----------------------------
			jQuery.publish(GMAP_CLICK, self._mouseoverItem.id);
		}
	});
}

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
	
	this._allowBound = new google.maps.LatLngBounds(newsw, newne);
}

MapManager.prototype._setAllowedZoom = function()
{
	// Limit the zoom level
	var self = this;
	var allowZoom = this.mapOptions.zoom;
   	google.maps.event.addListener(this.map, 'zoom_changed', function() {
     		if (self.map.getZoom() < self._allowZoomMin) {
			self.map.setZoom(self._allowZoomMin);
		} else if(self.map.getZoom() > self._allowZoomMax) {
			self.map.setZoom(self._allowZoomMax);
		}

		// 只有在最大地图的状态下，显示设备ID
		//console.log(self.map.getZoom() + ", " + self._allowZoomMax);
		if(self.map.getZoom() == self._allowZoomMax) {
			self._vgid.selectAll("text").style("visibility", "visible");
		} else {
			self._vgid.selectAll("text").style("visibility", "hidden");
		}
   	});
}

MapManager.prototype._lineDistance = function(x, y, x0, y0)
{
	return Math.sqrt((x -= x0) * x + (y -= y0) * y);
}