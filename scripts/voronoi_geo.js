// JavaScript Document
function VoronoiGraph(px, py, wid, hei, vertices, infos)
{
	/**********************
	 * PUBLIC VARIABLES
	 **********************/
	this.mode = 0;	// 0 - normal; 1 - detail; 2 - color;
	this.geojson = null;
	
	/**********************
	 * PRIVATE VARIABLES
	 **********************/
	this._px = px;
	this._py = py;
	this._wid = wid;
	this._hei = hei;
	this._len = vertices.length;
	
	this._vertices = vertices;		// 记录设备位置信息
	this._verticeInfos = infos;		// 和vertices数组完全相同，保存设备信息，没有就是null
	this._polygons;
	this.verticesSmall; 			// 该数据只保存有device信息的points，用于计算triangle
	this.flgVertices;
	this.devices;					// 记录设备信息
	
	this.path;
	this.arrColor = ["rgb(77,146,33)", "rgb(222,119,174)", "rgb(241,182,218)", 
					"rgb(197,27,125)", "rgb(253,224,239)", "rgb(247,123,247)",
					"rgb(230,245,208)", "rgb(184,225,134)", "rgb(127,188,65)", 
					"rgb(247,247,247)"];
	this.blankColor = "rgb(247,247,247)";
					
	/*this.arrColor = ["rgb(254,11,11)", "rgb(216,195,3)", "rgb(1,106,103)", 
					"rgb(219,214,162)", "rgb(155,96,32)", "rgb(0,0,0)"];*/
	
	this.tmpPathStr = "";
	this.tmpColor = "";
	this.tmpPath = "";
	
	this._voronoi = d3.geom.voronoi().clipExtent([[0, 0], [this._wid, this._hei]]);
}

VoronoiGraph.prototype.genPolygons = function()
{
	this._polygons = this._voronoi(this._vertices);
	return this._polygons;
}

VoronoiGraph.prototype.genGeoJSON = function(varr, parr)
{
	var self = this;
	var geojson = {type:"FeatureCollection", features:null};
					
	var vertjson = new Array();
	for(var i = 0; i < varr.length; i++)
	{
		var pnt = {type:"Point", coordinates:varr[i]};
		var prop = {prop0:"point"};
		var vobj = {type:"Feature", geometry:pnt, properties:prop};
		vertjson.push(vobj);
	}
					
	//var polyjson = new Array();
	var end = this.arrColor.length - 2;
	for(var i = 0; i < parr.length; i++)
	{
		if(parr[i].length == 0)
			continue;
			
		parr[i].push(parr[i][0]);
		
		var temp = new Array();
		temp.push(parr[i]);
		var pnt = {type:"Polygon", coordinates:temp};
		var cstr, nstr, f;
		if(this._verticeInfos[i] != null) {
			cstr = this.arrColor[i % end];
			nstr = this._verticeInfos[i].title;
			f = false;
		} else {
			//cstr = this.arrColor[i % end];
			cstr = self.arrColor[self.arrColor.length-1]
			nstr = "blank";
			f = true;
		}
		// property of polygon
		var prop = {
			prop0:"cell",
			//color:'rgb(247,247,247)',
			color:cstr,
			origcolor:cstr,
			name:nstr,
			latlng:varr[i],
			fake:f
		};
		var pobj = {type:"Feature", geometry:pnt, properties:prop};
		vertjson.push(pobj);
	}
	
	geojson.features = vertjson;
	this.geojson = geojson;
	
	return geojson;
}

VoronoiGraph.prototype.genColorByValue = function(deviceid, sensorid, value)
{
	var conf = getConfigBySensor(sensorid);
	var c1 = "hsl(" + conf.hue + ", 0%, 97%)";
	var c2 = "hsl(" + conf.hue + ", 70%, 40%)";
	
	var valueToColorScale = d3.scale.sqrt()
				   .domain([conf.min, conf.max])
				   .range([c1, c2])
				   .interpolate(d3.interpolateHsl);
	var obj = {name:deviceid, property:"color", value:valueToColorScale(value)};
	
	return obj;
}








VoronoiGraph.prototype.resetGraph = function()
{
	var self = this;
	
	if(this.mode == 1)
	{
		this.tmpPath.transition()
			.duration(800)
			.attr("class", this.tmpColor)
			.attr("d", this.tmpPathStr)
			.each("end", function() { 	// <-- 在过渡结束时执行
				// send amin done event
				jQuery.publish(HIDE_DEVICE_ANIM_DONE);
			});
					
		this.enablePath(true);
		this.enableCircle(true);
		this.enableText(true);
	}
	else if(this.mode == 2)
	{
		d3.select(this.container).selectAll("path")
			.style("fill", function(d, i) {
				// Decide a rule to map DeviceList to area
				return d3.select(this).attr("clr");
			});
			
		d3.select(this.container).selectAll("text")
			.text("");
	}
				
	this.mode = 0;
}

VoronoiGraph.prototype.redrawGraph = function(wid, hei, len, infos)
{
	d3.select(this.container)
			.selectAll("g")
			.remove();
	d3.select(this.container)
			.selectAll("circle")
			.remove();
	d3.select(this.container)
			.selectAll("text")
			.remove();
			
	this.width = wid;
	this.height = hei;
	
	this.initGraph(len, infos);
}

/*****************************
 * Draw Method
 *****************************/
VoronoiGraph.prototype.drawCircle = function()
{
	var self = this;
	
	// 绘制点
	d3.select(this.container).select("#graph").selectAll("circle")
		.data(this.vertices)
		.enter()
		.append("circle")
		.attr("transform", function(d) {return "translate(" + d + ")";})
		.attr("r", 1.5);
				
	// 绘制文字区
	d3.select(this.container).select("#graph").selectAll("text")
		.data(this.vertices)
		.enter()
		.append("text")
		.style("pointer-events", "none")
		.style("font-size", "10px")
		.attr("name", function(d, i) {
			if(self.devices[i] != null) {
				return self.devices[i].name;	
			}
			return "blank";
		})
		.attr("transform", function(d) {
			var px = d[0];
			var py = d[1];
			px += 6;
			py += 15;
			return "translate(" + px + "," + py + ")";
		})
		.text(function(d, i) {
			if(self.devices[i] != null)
				return "";
			else
				return "";
		});
		
	d3.select(this.container)
		.append("g")
		.attr("id", "eco");
}
		 
VoronoiGraph.prototype.drawArea = function() 
{
	// 绘制图形
	var self = this;
	
	this.path = d3.select(this.container)
					.append("g")
					.attr("id", "graph")
					.selectAll("path");
	this.path = this.path.data(this.voronoi(this.vertices))
				.enter().append("path")
				.style("pointer-events", function(d, i) { return self.devices[i] != null?"auto":"none"; })
				.style("cursor", "pointer")
				.style("fill", function(d, i) {
					// Decide a rule to map DeviceList to area
					if(self.devices[i] != null) {
						var end = self.arrColor.length - 2;
						// Record fill color
						d3.select(this).attr("clr", self.arrColor[i % end]);
						return self.arrColor[i % end];
						
						// FOR TEST
						//return self.arrColor[self.arrColor.length-1];
					} else {
						d3.select(this).attr("clr", self.arrColor[self.arrColor.length-1]);
						return self.arrColor[self.arrColor.length-1];
					}	
				})
				.attr("pos", function(d, i) { return self.vertices[i]; })
				.attr("name", function(d, i) {
					if(self.devices[i] != null) {
						return self.devices[i].name;	
					}
					return "blank";
				})
				.attr("d", function(d) {
					console.log(d);
					return "M" + d.join("L") + "Z";	
				})
				.on("mouseover", function(d, i) {
					//Get this bar's x/y values, then augment for the tooltip
					var coordinates = self.vertices[i];
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
					d3.select("#tooltip").classed("hidden", false);
			   	})
			   	.on("mouseout", function() {
					//Hide the tooltip
					d3.select("#tooltip").classed("hidden", true);
			   	})
				.on("click", function() {
					self.tmpPathStr = d3.select(this).attr("d");
					self.tmpColor = d3.select(this).attr("class");
					self.tmpPath = d3.select(this);
					
					var dname = d3.select(this).attr("name");
					
					//console.log("tmpPathStr: " + self.tmpPathStr);
					d3.select(this.parentNode.appendChild(this));
					d3.select(this)
						.transition()
						.duration(800)
						.attr("class", self.tmpColor)
						.attr("d", function(d) {
							var dd = [[0, 0], [0, self.height], [self.width, self.height], [self.width, 0]];
							return "M" + dd.join("L") + "Z";	
						})
						.each("end", function() { 	// <-- 在过渡结束时执行
							// send amin done event
							jQuery.publish(SHOW_DEVICE_ANIM_DONE, dname);
						});
					//path.order();
						
					self.enablePath(false);
					self.enableCircle(false);
					self.enableText(false);
					
					changeSensorMenuMode(1);
											
					//Hide the tooltip
					//d3.select("#tooltip").classed("hidden", true);
					
					self.mode = 1;
				});
				
	/*this.path = this.path
					.data(d3.geom.delaunay(this.verticesSmall)
					.map(function(d) { return "M" + d.join("L") + "Z"; }), String)
					.enter()
					.append("path")
					.style("fill", function(d, i) { return "rgba(247,247,247,0)"; })
					.style("stroke", "rgba(255,0,0,0.3)")
					.style("stroke-width", 4)
					.style("stroke-dasharray", "5,5")
					.style("pointer-events", "none")
					.attr("d", String);*/
}

/******************************************
 * Data Mode
 ******************************************/
VoronoiGraph.prototype.enterDataMode = function(type, blocknum)
{
	//---------------------------
	// 1. 先把当前颜色复原成白色
	// 2. 设置数据范围
	// 3. 根据服务器的数据改变颜色
	//---------------------------
	
	// FOR TEST: REMOVE ALL THE ECO THING
	d3.select(this.container).select("#eco").remove();
	d3.select(this.container).append("g").attr("id", "eco");
	
	d3.select(this.container).selectAll("path")
			//.transition()
			//.duration(500)
			.style("fill", "hsl(0, 0%, 97%)");
	d3.select(this.container).selectAll("text")
			.text("");
			
	var obj = getConfigBySensor(type);
	var c1 = "hsl(" + obj.hue + ", 0%, 97%)";
	var c2 = "hsl(" + obj.hue + ", 70%, 40%)";
	
	this.valueToColorScale = d3.scale.linear()
                          		.domain([obj.min, obj.avg * blocknum])
                          		.range([c1, c2])
                          		.interpolate(d3.interpolateHsl);
	this.value4ColorMode = 0;
	this.mode = 2;
}

VoronoiGraph.prototype.resetDataMode = function()
{
	this.value4ColorMode = 0;
}
 
VoronoiGraph.prototype.updateDataMode = function(dname, val, unit)
{
	var self = this;
	
	this.value4ColorMode += val;

	d3.select(this.container).selectAll("path")
			.transition()
			.duration(100)
			.style("fill", function(d, i) {
				if(d3.select(this).attr("name") == dname) {
					//console.log(self.value4ColorMode + ", " + val + ", " + self.valueToColorScale(self.value4ColorMode));
					return self.valueToColorScale(self.value4ColorMode);
				} else {
					return d3.select(this).style("fill");
				}
			});
	
	d3.select(this.container).selectAll("text")
		.text(function(d, i) {
			if(d3.select(this).attr("name") == dname) {
				return Math.floor(self.value4ColorMode) + " " + unit;
			} else {
				return d3.select(this).text();
			}
		});
}

/*****************************
 * Water Effect
 *****************************/
VoronoiGraph.prototype.drawWater = function(device, level)
{
	var name;
	var box;
	var clip;
	d3.select(this.container).selectAll("path")
		.attr("name", function(d, i) {
			if(d3.select(this).attr("name") == device)
			{
				name = d3.select(this).attr("name");
				box = this.getBBox();
				clip = d3.select(this).attr("d");
			}
			return d3.select(this).attr("name");
		});
		
	var str = "clipper" + name;
	d3.select(this.container)
		.append("clipPath")
		.attr("id", function(d) { return str;})
		.append("path")
		.attr("pos", [box.x, box.y])
		.attr("d", clip);
	
	var range = d3.scale.linear()
					.domain([0, 1])
					.range([0, box.height]);
	var newhei = range(level);
	var newpy = box.y + (box.height - newhei);
	var rect = d3.select(this.container)
					.append("rect")
					.attr("y", box.y+box.height)
					.transition()
					.attr("x", box.x)
					.attr("y", newpy)
					.attr("width", box.width)
					.attr("height", newhei)
					.attr("clip-path", function(d) {return "url(#" + str + ")";})
					.style("fill", "rgba(0,0,0,0.45)");
	
}

VoronoiGraph.prototype.drawAllWater = function()
{
	///////////////////////
	// JUST FOR TEST
	///////////////////////
	
	var self = this;
	
	// REMOVE THE LETTER
	d3.select(this.container).selectAll("text").text("");
	
	// CLEAN UP
	d3.select(this.container).select("#eco").remove();
	d3.select(this.container).append("g").attr("id", "eco");
	
	d3.select(this.container).selectAll("path")
		.attr("name", function(d, i) 
		{
			var name = d3.select(this).attr("name");
			if(name != "blank") 
			{
				var box = this.getBBox();
				var clip = d3.select(this).attr("d");
				var str = "clipper" + name;
				var str2 = "clipper_text" + name;
				var range = d3.scale.linear()
								.domain([0, 1.2])
								.range([0, box.height]);
			
				d3.select(self.container).select("#eco")
					.append("clipPath")
					.attr("id", function(d) { return str;})
					.append("path")
					.attr("pos", [box.x, box.y])
					.attr("d", clip);
				
				var newhei = range(Math.random());
				var newpy = box.y + (box.height - newhei);
				var rect = d3.select(self.container).select("#eco")
								.append("rect")
								.attr("y", box.y+box.height)
								.transition()
								.duration(600)
								.delay(i * 30)
								.attr("x", box.x)
								.attr("y", newpy)
								.attr("width", box.width)
								.attr("height", newhei)
								.attr("clip-path", function(d) {return "url(#" + str + ")";})
								.style("fill", "rgba(0,0,0,0.45)");
								
					
				var ppw = 18;
				var pph = ppw * 336.811 / 258.18;
				var ppx = self.vertices[i][0] - ppw * 1.4;
				var ppy = self.vertices[i][1] - pph;
				var node = d3.select(self.container).select("#eco")
  								.append("svg")
								.attr("x", ppx)
								.attr("y", ppy)
								.attr("width", ppw)
								.attr("height", pph)
								.attr("viewBox", "0 0 258.18 336.811")
								.append("use")
  								.attr("xlink:href","#tree");
								
				var text = d3.select(self.container).select("#eco")
								.append("text")
//								.transition()
//								.duration(600)
//								.delay(i * 30)
								.style("pointer-events", "none")
								.attr("class", "water_text")
								.attr("name", str2)
								.attr("transform", function(d) {
									var pos = [ppx+3, self.vertices[i][1] + 15];
									return "translate(" + pos + ")";
								})
								.text(function(d, i) {
									return Math.floor(newhei);
								});
			}
	
			return d3.select(this).attr("name");
		});
}

VoronoiGraph.prototype.drawAllCircleWater = function()
{
	///////////////////////
	// JUST FOR TEST
	///////////////////////
	
	var self = this;
	
	// REMOVE THE LETTER
	d3.select(this.container).selectAll("text").text("");
	// CLEAN UP
	d3.select(this.container).select("#eco").remove();
	d3.select(this.container).append("g").attr("id", "eco");
	
	d3.select(this.container).selectAll("path")
		.attr("name", function(d, i) 
		{
			var name = d3.select(this).attr("name");
			//if(name != "blank") 
			{
				var px = self.vertices[i][0];
				var py = self.vertices[i][1];
				var str = "clipper" + name;
				var str2 = "clipper_text" + name;
				var range = d3.scale.linear()
								.domain([0, 1.2])
								.range([0, 30]);
				var pr = range(Math.random());
				
				var rect = d3.select(self.container).select("#eco")
								.append("circle")
								.attr("r", 0)
								.transition()
								.duration(600)
								.delay(i * 30)
								.attr("r", pr)
								.attr("cx", px)
								.attr("cy", py)
								.style("fill", "rgba(0,0,0,0.45)");
					
				var ppw = 13;
				var pph = ppw * 336.811 / 258.18;
				var ppx = self.vertices[i][0] - ppw/2;
				var ppy = self.vertices[i][1] - pph*1.2;
				var node = d3.select(self.container).select("#eco")
  								.append("svg")
								.attr("x", ppx)
								.attr("y", ppy)
								.attr("width", ppw)
								.attr("height", pph)
								.attr("viewBox", "0 0 258.18 336.811")
								.append("use")
  								.attr("xlink:href","#tree");
								
				var text = d3.select(self.container).select("#eco")
								.append("text")
//								.transition()
//								.duration(600)
//								.delay(i * 30)
								.style("pointer-events", "none")
								.attr("class", "water_text")
								.attr("name", str2)
								.attr("transform", function(d) {
									var pos = [ppx+3, self.vertices[i][1] + 15];
									return "translate(" + pos + ")";
								})
								.text(function(d, i) {
									return Math.floor(pr);
								});
			}
	
			return d3.select(this).attr("name");
		});
}

/******************************************
 * Something about UI
 ******************************************/	
VoronoiGraph.prototype.enablePath = function(flg)
{
	var self = this;
	
	if(flg) {
		this.path.style("pointer-events", function(d, i) { return self.devices[i] != null?"auto":"none"; })
	} else {
		this.path.style("pointer-events", "none");	
	}
}

VoronoiGraph.prototype.enableText = function(flg)
{
	var self = this;
	
	if(flg) {
		d3.select(this.container).selectAll("text").transition().duration(500).style("opacity", 1);
	} else {
		d3.select(this.container).selectAll("text").transition().duration(500).style("opacity", 0);
	}
}
		
VoronoiGraph.prototype.enableCircle = function(flg)
{
	if(flg) {
		d3.select(this.container).selectAll("circle").transition().duration(500).attr("r", 1.5);
	} else {
		// set all circle to alpha 0
		d3.select(this.container).selectAll("circle").transition().duration(500).attr("r", 0);
	}
}

VoronoiGraph.prototype.enableEco = function(flg)
{
	if(flg) {
		d3.select(this.container).select("#eco").style("visibility", "visible");
	} else {
		d3.select(this.container).select("#eco").style("visibility", "hidden");
	}
}

/******************************************
 * Utilts
 ******************************************/
VoronoiGraph.prototype.rollupVertices = function(target)
{
	var cloestPt;
	var cloestDist = 200;
	var idx = 0;
	for(var i = 0; i < this.vertices.length; i++)
	{
		// get rid of idx
		var isfind = false;
		for(var j = 0; j < this.flgVertices.length; j++)
		{
			if(i == this.flgVertices[j].idx)
			{
				//console.log(this.flgVertices.length + " - " + i + ", " + this.flgVertices[j]);
				isfind = true;
				break;	
			}
		}
		if(isfind)
			continue;
		
		var dist = this.distance(this.vertices[i][0], this.vertices[i][1], target[0], target[1]);
		//console.log(this.vertices[i][0] + ", " + this.vertices[i][1] + ", " + target[0] + ", " + target[1]);
		if(dist < cloestDist)
		{
			cloestPt = this.vertices[i];
			cloestDist = dist;
			idx = i;
		}
	}
	
	this.vertices[idx] = target;
	
	return idx;
}

VoronoiGraph.prototype.distance = function(x, y, x0, y0)
{
    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
}