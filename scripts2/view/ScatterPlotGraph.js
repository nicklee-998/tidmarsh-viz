/**
 * Created by marian_mcpartland on 15/4/1.
 */

function ScatterPlotGraph()
{
	// ---------------------------------------
	//  PUBLIC VARIABLE
	// ---------------------------------------
	this.dataHead = null;                  // 最早的数据
	this.dataTrail = null;                 // 最后的数据

	// scatter plot parameters
	this._end_time = null;
	this._start_time = null;

	this._sensors = ["bmp_temperature", "illuminance", "bmp_pressure", "sht_humidity"];
	this._sensorColorTable;

	this._selectedData;

	this._csvidx;
	this._csvobj;

	// Size parameters.
	this._size = 140;
	this._padding = 10;
	this._n = 4;

	// Position scales.
	this._x = {};
	this._y = {};
	// Color
	this._color = {};

	this._threshold = 0;

	// Scatter plot svg
	this._scatterplot_svg;
	this._scatterplot_bursh;
	this._scatterplot_axis;
	this._currentCell;              // 当前所选择的格子(cell)
}

// -----------------------------------------
//  Init dataset
// -----------------------------------------
ScatterPlotGraph.prototype.initDataset = function(devices)
{
	var self = this;

	this._csvidx = 0;
	this._csvobj = {};
	this._sensorColorTable = {};

	// -----------------------------------
	//  Send scatter plot start event
	// -----------------------------------
	jQuery.publish(SCATTER_PLOT_START);

	// Start queue...
	_startQueue();

	function _startQueue() {
		if(self._csvidx >= devices.length) {
			// 初始化时间
			if(self._start_time == null && self._end_time == null) {
				self._end_time = new Date(self.dataTrail.getFullYear(), self.dataTrail.getMonth(), self.dataTrail.getDate());
				self._start_time = new Date(self.dataTrail.getFullYear(), self.dataTrail.getMonth(), self.dataTrail.getDate());
				self._start_time.setDate(self._start_time.getDate() - 10);
			}

			// 绘制散点图
			self._updateDataset();
			self._drawScatterPlot();

			// -----------------------------------
			//  Send scatter plot init event
			// -----------------------------------
			jQuery.publish(SCATTER_PLOT_INIT);

			return;
		}

		var url = "./res/data_sensor/" + devices[self._csvidx].title + ".csv";
		d3.csv(url, function(dataset) {
			self._csvobj[devices[self._csvidx].title] = dataset;
			self._sensorColorTable[devices[self._csvidx].title] = _getRandomColor();
			self._csvidx++;

			// 查找最早和最晚的点
			if(dataset != null && dataset.length > 1) {
				var head = new Date(dataset[0].date);
				var trail = new Date(dataset[dataset.length-1].date);

				if(self.dataHead == null) {
					self.dataHead = head;
				} else {
					if(head < self.dataHead) {
						self.dataHead = head;
					}
				}

				if(self.dataTrail == null) {
					self.dataTrail = trail;
				} else {
					if(trail > self.dataTrail) {
						self.dataTrail = trail;
					}
				}
			}

			// -----------------------------------
			//  Send scatter plot progress event
			// -----------------------------------
			jQuery.publish(SCATTER_PLOT_PROGRESS, {idx:self._csvidx, total:devices.length});

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

					//if(date.getHours() >= 22 && date.getHours() <= 24) {

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
		//	domain = [-20, 70];
		//} else if(sensor == "illuminance") {
		//	domain = [0, 70000];
		//} else if(sensor == "bmp_pressure") {
		//	domain = [980, 1200];
		//} else if(sensor == "sht_humidity") {
		//	domain = [0, 110];
		//}
		var range = [self._padding / 2, self._size - self._padding / 2];
		var range2 = [self._size - self._padding / 2, self._padding / 2];

		self._y[sensor] = d3.scale.linear().domain(domain).range(range2);
		self._x[sensor] = d3.scale.linear().domain(domain).range(range);
	});
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

			for(var i = 0; i < self._selectedData.length; i++) {
				var d = self._selectedData[i];
				var px = self._x[p.x](d[p.x]);
				var py = self._y[p.y](d[p.y]);
				d.pos = [px, py];
			}

			var hexbin = d3.hexbin()
				.size([self._size, self._size])
				.radius(2);
			var darr = hexbin(self._selectedData);

			// 获得最大的值
			var max = 0;
			for(var j = darr.length - 1; j >= 0; j--) {

				//if(darr.length < 60) {
				//	darr.splice(j, 1);
				//	continue;
				//}

				if(max < darr[j].length) {
					max = darr[j].length;
				}
			}

			// Color
			self._color[p.i+"-"+p.j] = d3.scale.linear()
				.domain([0, max])
				.range(["#ffffff", "#ff0000"])
				.interpolate(d3.interpolateLab);

			cell.selectAll(".hexagon")
				.data(darr)
				.enter().append("path")
				.attr("class", "hexagon")
				.attr("d", hexbin.hexagon())
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
				.style("fill", function(d) { return self._color[p.i+"-"+p.j](d.length); });

			// Plot dots.
			//cell.selectAll("circle")
			//	.data(self._selectedData)
			//	.enter()
			//	.append("svg:circle")
			//	.style("fill", function(d) {
			//		// 找到不一样的did
			//		var color = self._sensorColorTable[d.did];
			//		var isfind = false;
			//		for(var i = 0; i < idarr.length; i++) {
			//			if(idarr[i] == d.did) {
			//				isfind = true;
			//				break;
			//			}
			//		}
			//		if(!isfind) {
			//			// That's the problem make it slow...
			//			//idarr.push({did: d.did, clr: color});
			//			idarr.push(d.did)
			//		}
			//		return color;
			//	})
			//	.attr("cx", function(d) { return self._x[p.x](d[p.x]); })
			//	.attr("cy", function(d) { return self._y[p.y](d[p.y]); })
			//	.attr("r", 3);

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
		self._currentCell = p;
		self._updateSelectedArea();
	}

	// If the brush is empty, select all circles.
	function brushend() {
		if (self._scatterplot_bursh.empty()) {

			var idarr = new Array();
			var tdarr = new Array();
			self._scatterplot_svg.selectAll("g.cell")
				.each(function(k, i) {
					var cell = d3.select(this);
					cell.selectAll(".cell path").style("fill", function(d) {
						return self._color[k.i+"-"+k.j](d.length);
					});
				});

			// Clear select cell
			self._currentCell = null;

			// ----------------------------
			//  Send device init event
			// ----------------------------
			//jQuery.publish(SCATTER_PLOT_SELECTED, {list:idarr, tlist:tdarr});
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

			for(var i = 0; i < self._selectedData.length; i++) {
				var d = self._selectedData[i];
				var px = self._x[p.x](d[p.x]);
				var py = self._y[p.y](d[p.y]);
				d.pos = [px, py];
			}

			var hexbin = d3.hexbin()
				.size([self._size, self._size])
				.radius(2);
			var darr = hexbin(self._selectedData);

			// 获得最大的值
			var max = 0;
			for(var j = 0; j < darr.length; j++) {
				if(max < darr[j].length) {
					max = darr[j].length;
				}
			}
			// Color
			self._color[p.i+"-"+p.j] = d3.scale.linear()
				.domain([0, max])
				.range(["#ffffff", "#ff0000"])
				.interpolate(d3.interpolateLab);

			cell = cell.selectAll(".hexagon").data(darr);
			cell.exit().remove();
			cell.transition()
				.duration(500)
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
				.style("fill", function(d) { return self._color[p.i+"-"+p.j](d.length); });
			cell.enter()
				.append("path")
				.attr("class", "hexagon")
				.attr("d", hexbin.hexagon())
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
				.style("fill", function(d) { return self._color[p.i+"-"+p.j](d.length); });

			// Plot dots.
			//cell = cell.selectAll("circle").data(self._selectedData);
			//cell.exit().remove();
			//cell.transition()
			//	.duration(500)
			//	.attr("cx", function(d) { return self._x[p.x](d[p.x]); })
			//	.attr("cy", function(d) { return self._y[p.y](d[p.y]); });
			//cell.enter()
			//	.append("svg:circle")
			//	.style("fill", function(d) { return self._sensorColorTable[d.did]; })
			//	.attr("cx", function(d) { return self._x[p.x](d[p.x]); })
			//	.attr("cy", function(d) { return self._y[p.y](d[p.y]); })
			//	.attr("r", 3);
		});

	this._updateSelectedArea();

	// ----------------------------
	//  Send device init event
	// ----------------------------
	//var idarr = new Array();
	//for(var i = 0; i < self._selectedData.length; i++) {
	//	var isfind = false;
	//	for(var j = 0; j < idarr.length; j++) {
	//		if(idarr[j] == self._selectedData[i].did) {
	//			isfind = true;
	//			break;
	//		}
	//	}
	//
	//	if(!isfind) {
	//		idarr.push(self._selectedData[i].did);
	//	}
	//}
	//
	//jQuery.publish(SCATTER_PLOT_SELECTED, {list:idarr, tlist:[]});
}

ScatterPlotGraph.prototype._updateSelectedArea = function()
{
	var self = this;
	if(self._currentCell == null) {
		return;
	}

	//self._scatterplot_bursh.x(self._x[self._currentCell.x]).y(self._y[self._currentCell.y]).data = self._currentCell;
	var e = self._scatterplot_bursh.extent();
	var idarr = new Array();
	var tdarr = new Array();

	self._scatterplot_svg.selectAll("g.cell")
		.each(function(k, i) {
			var cell = d3.select(this);
			if(self._currentCell.i == k.i && self._currentCell.j == k.j) {

				// Plot dots.
				cell.selectAll(".cell path").style("fill", function(d) {
					//console.log(self._x[self._currentCell.x](e[0][0]) + ", " + self._x[self._currentCell.x](e[1][0]));
					//console.log(self._y[self._currentCell.y](e[1][1]) + ", " + self._y[self._currentCell.y](e[0][1]));
					//console.log(d.x + ", " + d.y);
					if(self._x[self._currentCell.x](e[0][0]) <= d.x && d.x <= self._x[self._currentCell.x](e[1][0]) &&
						self._y[self._currentCell.y](e[1][1]) <= d.y && d.y <= self._y[self._currentCell.y](e[0][1])) {

						//console.log(d.x);

						// 找到不一样的did
						var color = self._color[k.i+"-"+k.j](d.length);

						// 只在第一个格子里面寻找，这样效率又提高很多：）
						for(var ii = 0; ii < d.length; ii++) {
							idarr.push(d[ii].did);
							tdarr.push(d[ii].date);
						}

						return color;
					} else {
						return null;
					}
				});
			} else {
				// Plot dots.
				cell.selectAll(".cell path").style("fill", function(d) {
					return null;
				});
			}
		});

	//console.log(count);
	//self._scatterplot_svg.selectAll(".cell circle").style("fill", function(d) {
	//
	//});

	// ----------------------------
	//  Send device init event
	// ----------------------------
	jQuery.publish(SCATTER_PLOT_SELECTED, {list:idarr, tlist:tdarr});
}