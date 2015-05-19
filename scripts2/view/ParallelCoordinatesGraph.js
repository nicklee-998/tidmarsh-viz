/**
 * Created by marian_mcpartland on 15/4/30.
 */

function ParallelCoordinatesGraph()
{
	// scatter plot parameters
	this._start_time = new Date(2014, 6, 1);
	this._end_time = new Date(2014, 8, 1);

	this._selectedData;
	this._csvobj;

	this._sensors = ["bmp_temperature", "illuminance", "bmp_pressure", "sht_humidity"];
	this._sensorColorTable;

	this._m = [80, 160, 200, 160];
	this._w = 1280 - this._m[1] - this._m[3];
	this._h = 600 - this._m[0] - this._m[2];

	this._x = d3.scale.ordinal().domain(this._sensors).rangePoints([0, this._w]);
	this._y = {};

	this._svg;
	this._foreground;
}

ParallelCoordinatesGraph.prototype.initDataset = function(devices)
{
	var self = this;

	this._csvobj = {};
	this._sensorColorTable = {};

	// Start loading csv files...
	var loadIdx = 0;
	var totalNum = devices.length;
	for(var i = 0; i < devices.length; i++) {
		var url = "./res/data_sensor/" + devices[i].title + ".csv";
		d3.csv(url, function(dataset) {
			if(dataset && dataset.length > 0) {
				var did = dataset[0].did;
				self._csvobj[did] = dataset;
				self._sensorColorTable[did] = _getRandomColor();
			}

			loadIdx++;
			if(loadIdx == totalNum) {
				console.log("载入完毕");

				self._updateDataset();
				self._drawGraph();
			}
		});
	}

	// 随机生成颜色
	function _getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
}

// ----------------------------------------------------------------
//  PRIVATE METHODS
// ----------------------------------------------------------------
ParallelCoordinatesGraph.prototype._updateDataset = function()
{
	var self = this;

	// Select the dataset
	this._selectedData = new Array();
	for (var i in this._csvobj) {
		var arr = this._csvobj[i];
		if(arr != null) {
			for(var j = 0; j < arr.length; j++) {
				var item = arr[j];
				var date = new Date(item.date);
				if(date > this._start_time && date < this._end_time) {

					if(date.getHours() >= 0 && date.getHours() <= 7) {
						var flag = true;
						this._sensors.forEach(function(d) {
							if(parseInt(item[d]) == -999) {
								flag = false;
							}
						});

						if(flag) {
							this._selectedData.push(item);
						}
					}

				} else if(date >= this._end_time) {
					break;
				}
			}
		}
	}

	this._sensors.forEach(function(sensor) {
		// Coerce values to numbers.
		self._selectedData.forEach(function(d) {
			d[sensor] = +d[sensor];
		});

		var value = function(d) { return d[sensor] };
		//var domain = [d3.min(self._selectedData, value), d3.max(self._selectedData, value)];
		var domain;
		if(sensor == "bmp_temperature") {
			domain = [-20, 80];
		} else if(sensor == "illuminance") {
			domain = [0, 70000];
		} else if(sensor == "bmp_pressure") {
			domain = [980, 1300];
		} else if(sensor == "sht_humidity") {
			domain = [0, 120];
		}

		self._y[sensor] = d3.scale.linear().domain(domain).range([self._h, 0]);
		self._y[sensor].brush = d3.svg.brush()
			.y(self._y[sensor])
			.on("brush", function() {
				var actives = self._sensors.filter(function(p) { return !self._y[p].brush.empty(); });
				var extents = actives.map(function(p) { return self._y[p].brush.extent(); });
				self._foreground.classed("fade", function(d) {
					d3.select(this).moveToFront();
					return !actives.every(function(p, i) {
						return extents[i][0] <= d[p] && d[p] <= extents[i][1];
					});
				});
			});
	});
}

ParallelCoordinatesGraph.prototype._drawGraph = function()
{
	var self = this;

	var i;
	var line = d3.svg.line();
	var axis = d3.svg.axis().orient("left");

	this._svg = d3.select("body").append("svg:svg")
		.attr("width", this._w + this._m[1] + this._m[3])
		.attr("height", this._h + this._m[0] + this._m[2])
		.append("svg:g")
		.attr("transform", "translate(" + this._m[3] + "," + this._m[0] + ")");

	// Add foreground lines.
	this._foreground = this._svg.append("svg:g")
		.attr("class", "foreground")
		.selectAll("path")
		.data(this._selectedData)
		.enter().append("svg:path")
		.attr("d", _path)
		.attr("stroke", function(d) {
			return self._sensorColorTable[d.did];
		});

	// Add a group element for each trait.
	var g = this._svg.selectAll(".sensor")
		.data(this._sensors)
		.enter().append("svg:g")
		.attr("class", "sensor")
		.attr("transform", function(d) {
			return "translate(" + self._x(d) + ")";
		})
		.call(d3.behavior.drag()
			.origin(function(d) { return {x: self._x(d)}; })
			.on("dragstart", dragstart)
			.on("drag", drag)
			.on("dragend", dragend));

	// Add an axis and title.
	g.append("svg:g")
		.attr("class", "axis")
		.each(function(d) { d3.select(this).call(axis.scale(self._y[d])); })
		.append("svg:text")
		.attr("text-anchor", "start")
		.attr("x", 5)
		.attr("y", self._h)
		.text(String);

	// Add a brush for each axis.
	g.append("svg:g")
		.attr("class", "brush")
		.each(function(d) { d3.select(this).call(self._y[d].brush); })
		.selectAll("rect")
		.attr("x", -8)
		.attr("width", 16);

	function dragstart(d) {
		//i = self._sensors.indexOf(d);
	}

	function drag(d) {
		//self._x.range()[i] = d3.event.x;
		//self._sensors.sort(function(a, b) { return self._x(a) - self._x(b); });
		//g.attr("transform", function(d) { return "translate(" + self._x(d) + ")"; });
		//self._foreground.attr("d", _path);
	}

	function dragend(d) {
		//self._x.domain(self._sensors).rangePoints([0, self._w]);
		//var t = d3.transition().duration(500);
		//t.selectAll(".sensor").attr("transform", function(d) { return "translate(" + self._x(d) + ")"; });
		//t.selectAll(".foreground path").attr("d", _path);
	}

	function _path(d) {
		return line(self._sensors.map(function(p) {
			return [self._x(p), self._y[p](d[p])];
		}));
	}
}