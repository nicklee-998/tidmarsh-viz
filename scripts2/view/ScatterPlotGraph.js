/**
 * Created by marian_mcpartland on 15/4/1.
 */

function ScatterPlotGraph()
{
	// scatter plot parameters
	this._start_time = new Date(2014, 9, 10);
	this._end_time = new Date(2014, 9, 15);


	this._sensors = ["bmp_temperature", "illuminance", "bmp_pressure", "sht_humidity"];
	this._sensorColorTable;
	this._selectedData;

	this._csvidx;
	this._csvobj;

	// Size parameters.
	this._size = 120;
	this._padding = 10;
	this._n = 4;

	// Position scales.
	this._x = {};
	this._y = {};

	// scatter plot svg
	this._scatterplot_svg;
	this._scatterplot_bursh;
	this._scatterplot_axis;
}

// -----------------------------------------
//  Init dataset
// -----------------------------------------
ScatterPlotGraph.prototype.initDataset = function(devices, year)
{
	var self = this;

	this._csvidx = 0;
	this._csvobj = {};
	this._sensorColorTable = {};
	// Start queue...
	_startQueue();

	function _startQueue() {
		if(self._csvidx >= devices.length) {
			// 绘制散点图
			self._updateDataset();
			self._drawScatterPlot();

			return;
		}

		var url = "./res/data_sensor/" + year + "/" + devices[self._csvidx].title + ".csv";
		d3.csv(url, function(dataset) {
			console.log(url);
			self._csvobj[devices[self._csvidx].title] = dataset;
			self._sensorColorTable[devices[self._csvidx].title] = _getRandomColor();
			self._csvidx++;
			_startQueue();
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

ScatterPlotGraph.prototype.show = function()
{
	var wid = parseInt($('#scatterplot_cont').css('width'));
	$('#scatterplot_cont').css('visibility', 'visible');
	$('#scatterplot_cont').css('left', '-' + wid + 'px');
	$('#scatterplot_cont').animate({left:'30px'}, 500, 'easeOutQuint');
}

ScatterPlotGraph.prototype.hide = function()
{
	var wid = parseInt($('#scatterplot_cont').css('width'));
	$('#scatterplot_cont').animate({left:'-' + wid + 'px'}, 500, 'easeOutQuint', function() {
		$('#scatterplot_cont').css('visibility', 'hidden');
	});
}

ScatterPlotGraph.prototype.resetDate = function(st, ed)
{
	this._start_time = st;
	this._end_time = ed;

	this._updateDataset();
	this._updateScatterPlot();
}

ScatterPlotGraph.prototype.highlightDevices = function(darr)
{
	var self = this;

	// clear selected area
	this._scatterplot_svg.selectAll("g.cell").call(self._scatterplot_bursh.clear());

	// highlight selected devices circle
	this._scatterplot_svg.selectAll(".cell circle").style("fill", function(d) {
		var isfind = false;
		for(var i = 0; i < darr.length; i++) {
			if(darr[i] == d.did) {
				d3.select(this).moveToFront();
				isfind = true;
				break;
			}
		}
		return isfind ? self._sensorColorTable[d.did] : null;
	});
}

// ----------------------------------------------------------------
//  PRIVATE METHODS
// ----------------------------------------------------------------
ScatterPlotGraph.prototype._updateDataset = function()
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

					//if(date.getHours() >= 12 && date.getHours() <= 17) {

						var flag = true;
						this._sensors.forEach(function(d) {
							if(parseInt(item[d]) == -999) {
								flag = false;
							}
						});

						if(flag) {
							this._selectedData.push(item);
						}
					//}

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
		var domain = [d3.min(self._selectedData, value), d3.max(self._selectedData, value)];
		//var domain;
		//if(sensor == "bmp_temperature") {
		//	domain = [-20, 50];
		//} else if(sensor == "illuminance") {
		//	domain = [0, 50000];
		//} else if(sensor == "bmp_pressure") {
		//	domain = [980, 1200];
		//} else if(sensor == "sht_humidity") {
		//	domain = [0, 100];
		//}
		var range = [self._padding / 2, self._size - self._padding / 2];
		var range2 = [self._size - self._padding / 2, self._padding / 2];

		self._y[sensor] = d3.scale.linear().domain(domain).range(range2);
		self._x[sensor] = d3.scale.linear().domain(domain).range(range);
	});

	console.log("Data selected number: " + this._selectedData.length);
}

ScatterPlotGraph.prototype._drawScatterPlot = function()
{
	var self = this;

	// Axes.
	this._scatterplot_axis = d3.svg.axis()
		.ticks(5)
		.tickSize(this._size * this._n);

	// Brush.
	this._scatterplot_bursh = d3.svg.brush()
		.on("brushstart", brushstart)
		.on("brush", brush)
		.on("brushend", brushend);

	// Root panel.
	this._scatterplot_svg = d3.select("#scatterplot_cont").append("svg:svg")
		.attr("width", this._size * this._n + this._size / 2 + 20)
		.attr("height", this._size * this._n + this._size / 2)
		.append("svg:g")
		.attr("transform", "translate(50, 0)");

	// X-axis.
	this._scatterplot_svg.selectAll("g.x.axis")
		.data(this._sensors)
		.enter().append("svg:g")
		.attr("class", "x axis")
		.attr("transform", function(d, i) { return "translate(" + i * self._size + ",0)"; })
		.each(function(d) { d3.select(this).call(self._scatterplot_axis.scale(self._x[d]).orient("bottom")); })
		.selectAll("text")
		.attr("y", 0)
		.attr("x", this._size * this._n)
		.attr("dy", ".55em")
		.attr("transform", "rotate(90)")
		.style("fill", "white")
		.style("text-anchor", "start");

	// Y-axis.
	this._scatterplot_svg.selectAll("g.y.axis")
		.data(this._sensors)
		.enter().append("svg:g")
		.attr("class", "y axis")
		.attr("transform", function(d, i) { return "translate(0," + i * self._size + ")"; })
		.each(function(d) { d3.select(this).call(self._scatterplot_axis.scale(self._y[d]).orient("right")); })
		.selectAll("text")
		.attr("y", 0)
		.attr("x", 0)
		.attr("dy", ".55em")
		.style("fill", "white")
		.style("text-anchor", "end");

	// Cell and plot.
	var idarr = new Array();
	var cell = this._scatterplot_svg.selectAll("g.cell")
		.data(cross(this._sensors, this._sensors))
		.enter().append("svg:g")
		.attr("class", "cell")
		.attr("transform", function(d) { return "translate(" + d.i * self._size + "," + d.j * self._size + ")"; })
		.each(function(p) {
			var cell = d3.select(this);

			// Plot frame.
			cell.append("svg:rect")
				.attr("class", "frame")
				.attr("x", self._padding / 2)
				.attr("y", self._padding / 2)
				.attr("width", self._size - self._padding)
				.attr("height", self._size - self._padding);

			// Plot dots.
			cell.selectAll("circle")
				.data(self._selectedData)
				.enter()
				.append("svg:circle")
				.style("fill", function(d) {
					// 找到不一样的did
					var color = self._sensorColorTable[d.did];
					var isfind = false;
					for(var i = 0; i < idarr.length; i++) {
						if(idarr[i] == d.did) {
							isfind = true;
							break;
						}
					}
					if(!isfind) {
						// That's the problem make it slow...
						//idarr.push({did: d.did, clr: color});
						idarr.push(d.did)
					}
					return color;
				})
				.attr("cx", function(d) { return self._x[p.x](d[p.x]); })
				.attr("cy", function(d) { return self._y[p.y](d[p.y]); })
				.attr("r", 3);

			// Plot brush.
			cell.call(self._scatterplot_bursh.x(self._x[p.x]).y(self._y[p.y]));
		});

	// ----------------------------
	//  Send device init event
	// ----------------------------
	jQuery.publish(SCATTER_PLOT_SELECTED, {list:idarr, tlist:[]});


	// Titles for the diagonal.
	cell.filter(function(d) { return d.i == d.j; }).append("svg:text")
		.attr("x", this._padding)
		.attr("y", this._padding - this._size - 20)
		.attr("dy", ".71em")
		.attr("transform", "rotate(90)")
		.style("fill", "rgba(220, 220, 220, 0.85)")
		.text(function(d) { return d.x; });

	// Clear the previously-active brush, if any.
	function brushstart(p) {
		if (self._scatterplot_bursh.data !== p) {
			cell.call(self._scatterplot_bursh.clear());
			self._scatterplot_bursh.x(self._x[p.x]).y(self._y[p.y]).data = p;
		}
	}

	// Highlight the selected circles.
	function brush(p) {
		var e = self._scatterplot_bursh.extent();
		var idarr = new Array();
		var tdarr = new Array();
		self._scatterplot_svg.selectAll(".cell circle").style("fill", function(d) {
			if(e[0][0] <= d[p.x] && d[p.x] <= e[1][0] && e[0][1] <= d[p.y] && d[p.y] <= e[1][1]) {
				// 找到不一样的did
				var color = self._sensorColorTable[d.did];
				var isfind = false;
				for(var i = 0; i < idarr.length; i++) {
					if(idarr[i] == d.did) {
						isfind = true;
						break;
					}
				}
				if(!isfind) {
					// That's the problem make it slow...
					//idarr.push({did: d.did, clr: color});
					idarr.push(d.did)
				}
				tdarr.push(d.date);
				return color;
			} else {
				return null;
			}
		});

		// ----------------------------
		//  Send device init event
		// ----------------------------
		jQuery.publish(SCATTER_PLOT_SELECTED, {list:idarr, tlist:tdarr});
	}

	// If the brush is empty, select all circles.
	function brushend() {
		if (self._scatterplot_bursh.empty()) {
			var idarr = new Array();
			self._scatterplot_svg.selectAll(".cell circle").style("fill", function(d) {
				// 找到不一样的did
				var color = self._sensorColorTable[d.did];
				var isfind = false;
				for(var i = 0; i < idarr.length; i++) {
					if(idarr[i] == d.did) {
						isfind = true;
						break;
					}
				}
				if(!isfind) {
					idarr.push(d.did)
				}
				return color;
			});

			// ----------------------------
			//  Send device init event
			// ----------------------------
			jQuery.publish(SCATTER_PLOT_SELECTED, {list:idarr, tlist:[]});
		}
	}

	function cross(a, b) {
		var c = [], n = a.length, m = b.length, i, j;
		for (i = -1; ++i < n;) {
			for (j = -1; ++j < m;) {
				if(i <= j) {
					c.push({x: a[i], i: i, y: b[j], j: j});
				}
			}
		}
		return c;
	}
}

ScatterPlotGraph.prototype._updateScatterPlot = function()
{
	var self = this;

	// X-axis.
	this._scatterplot_svg.selectAll("g.x.axis")
		.each(function(d) { d3.select(this).call(self._scatterplot_axis.scale(self._x[d]).orient("bottom")); })
		.selectAll("text")
		.attr("y", 0)
		.attr("x", this._size * this._n)
		.attr("dy", ".55em")
		.attr("transform", "rotate(90)")
		.style("fill", "white")
		.style("text-anchor", "start");

	// Y-axis.
	this._scatterplot_svg.selectAll("g.y.axis")
		.each(function(d) { d3.select(this).call(self._scatterplot_axis.scale(self._y[d]).orient("right")); })
		.selectAll("text")
		.attr("y", 0)
		.attr("x", 0)
		.attr("dy", ".55em")
		.style("fill", "white")
		.style("text-anchor", "end");

	// Cell and plot.
	this._scatterplot_svg.selectAll("g.cell")
		.each(function(p) {
			var cell = d3.select(this);
			// Plot dots.
			cell = cell.selectAll("circle").data(self._selectedData);
			cell.exit().remove();
			cell.transition()
				.duration(500)
				.attr("cx", function(d) { return self._x[p.x](d[p.x]); })
				.attr("cy", function(d) { return self._y[p.y](d[p.y]); });
			cell.enter()
				.append("svg:circle")
				.style("fill", function(d) { return self._sensorColorTable[d.did]; })
				.attr("cx", function(d) { return self._x[p.x](d[p.x]); })
				.attr("cy", function(d) { return self._y[p.y](d[p.y]); })
				.attr("r", 3);
		});

	// ----------------------------
	//  Send device init event
	// ----------------------------
	var arr = new Array();
	for(var i = 0; i < self._selectedData.length; i++) {
		var isfind = false;
		for(var j = 0; j < arr.length; j++) {
			if(arr[j] == self._selectedData[i].did) {
				isfind = true;
				break;
			}
		}

		if(!isfind) {
			arr.push(self._selectedData[i].did);
		}
	}

	jQuery.publish(SCATTER_PLOT_SELECTED, {list:idarr, tlist:[]});
}

ScatterPlotGraph.prototype._genDeviceIdList = function(darr)
{
	var arr = new Array();
	for(var i = 0; i < darr.length; i++) {
		var isfind = false;
		for(var j = 0; j < arr.length; j++) {
			if(arr[j] == darr[i]) {
				isfind = true;
				break;
			}
		}

		if(!isfind) {
			arr.push({did: darr[i], clr: this._sensorColorTable[darr[i]]});
		}
	}
	return arr;
}