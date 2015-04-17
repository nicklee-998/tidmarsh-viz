/**
 * Created by marian_mcpartland on 15/1/22.
 */
function UiLineChart()
{
	this._width = window.innerWidth;
	this._height = 170;
	this._margin = {left: 30, right: 0, top: 50, bottom: 0};

	this._draggerDown = false;
	this._mouseOffsetX;

	this._dateScale = null;

	this._viz = d3.select("#chart_div")
		.append("svg")
		.attr("id", "line_g_cont")
		.attr("width", this._width)
		.attr("height", this._height)
		.append("g");

	$("#chart_div").css("bottom", -this._height);

	function onDraggerMove(event)
	{
		if(self._draggerDown) {
			//console.log(event);
			var px = event.clientX;
			d3.select("#drag_bar").attr("x", px - self._mouseOffsetX);
			d3.select("#line_chart_dragger_date").attr("x", px - 23);
		}

		var baroffsetx = d3.select("#drag_bar").attr("x");
		var set_perc = (baroffsetx - self._margin.left) / (self._width - self._margin.left - self._margin.right);
		//console.log(set_perc);

		if(set_perc >= 0 && set_perc <= 1) {
			jQuery.publish(LINE_CHART_DRAG, precToDate(set_perc));
			//updateNetworkNode();
			//updateVGraphBySlider();

			var date = new Date(self._dateScale(set_perc));
			var cstr = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
			d3.select("#line_chart_dragger_date").text(cstr);
		} else if(set_perc < 0) {
			d3.select("#drag_bar").attr("x", self._margin.left);
			//jQuery.publish(LINE_CHART_DRAG, precToDate(0));
		} else {
			d3.select("#drag_bar").attr("x", self._margin.right);
			//jQuery.publish(LINE_CHART_DRAG, precToDate(1));
		}
	}

	function onDraggerUp(event)
	{
		if(!self._draggerDown)
			return;
		self._draggerDown = false;

		var baroffsetx = d3.select("#drag_bar").attr("x");
		var set_perc = (baroffsetx - self._margin.left) / (self._width - self._margin.left - self._margin.right);
		//console.log(set_perc);
		document.body.removeEventListener('mousemove', onDraggerMove, false);
		document.body.removeEventListener('mouseup', onDraggerUp, false);
		if(set_perc >= 0 && set_perc <= 1) {
			//jQuery.publish(LINE_CHART_DRAG, precToDate(set_perc));
		}
	}

	function precToDate(prec)
	{
		var date = new Date(self._dateScale(prec));
		return date;
	}

	var dragger_svg = d3.select("#chart_div")
		.append("svg")
		.attr("width", this._width)
		.attr("height", this._height)
		.attr("class", "line_chart_svg_dragger");

	dragger_svg.append("rect")
		.attr("id", "drag_bar")
		.attr("x", 50)
		.attr("y", this._margin.top)
		.attr("width", 5)
		.attr("height", this._height - this._margin.top)
		.attr("class", "line_chart_dragger")
		.on("mousedown", function() {
			self._draggerDown = true;
			self._mouseOffsetX = d3.event.offsetX - d3.select("#drag_bar").attr("x");

			var baroffsetx = d3.select("#drag_bar").attr("x");
			var set_perc = (baroffsetx - self._margin.left) / (self._width - self._margin.left - self._margin.right);
			//console.log(set_perc);

			if(set_perc >= 0 && set_perc <= 1) {
				document.body.addEventListener('mousemove', onDraggerMove, false);
				document.body.addEventListener('mouseup', onDraggerUp, false);

				//jQuery.publish(LINE_CHART_DRAG, precToDate(set_perc));
			}
		})
		.on("mouseover", function() {
			d3.select(this).style("stroke-width", 3);
			d3.select(this).style("stroke", "#111111");
		})
		.on("mouseout", function() {
			d3.select(this).style("stroke-width", 2);
			d3.select(this).style("stroke", "#111111");
		});

	dragger_svg.append("text")
		.attr("x", 50 - 23)
		.attr("y", this._margin.top - 3)
		.attr("id", "line_chart_dragger_date")
		.attr("class", "line_chart_dragger_date")
		.text("");
		//.text("9:37:14");

	var self = this;
}

// ---------------------------------
//  手动调整dragger的位置
// ---------------------------------
UiLineChart.prototype.updateDragger = function(prec)
{
	var px = ((this._width - this._margin.left - this._margin.right) * prec) + this._margin.left;
	d3.select("#drag_bar").attr("x", px);
	d3.select("#line_chart_dragger_date").attr("x", px - 23);

	var date = new Date(this._dateScale(prec));
	var cstr = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	d3.select("#line_chart_dragger_date").text(cstr);

	jQuery.publish(LINE_CHART_DRAG, date);
}

UiLineChart.prototype.make = function(sid, start, end, dataset)
{
	// clear graph before
	d3.select("#line_g_cont").remove();

	this._viz = d3.select("#chart_div")
		.append("svg")
		.attr("id", "line_g_cont")
		.attr("width", this._width)
		.attr("height", this._height)
		.append("g");

	// min and max
	var min = null;
	var max = null;
	var dataset2 = new Array();

	// set dataset
	for (var i = 0; i < dataset.length; i++) {

		var values = dataset[i].datas;
		var currData = [];
		//countryCodes[countries[i][1]] = countries[i][0];

		//var started = false;
		for (var j = 0; j < values.length; j++) {

			//console.log(values[j].timestamp);
			var date = new Date(values[j].timestamp);

			// 寻找最小和最大值
			if (values[j].value != -999) {
				currData.push({x: date, y: values[j].value});

				if(min == null) {
					min = values[j].value;
					max = values[j].value;
				} else {
					if(values[j].value < min) {
						min = values[j].value;
					} else if(values[j].value > max) {
						max = values[j].value;
					}
				}
			}

			//if (!started) {
			//	startEnd[countries[i][1]] = { 'startYear':years[j], 'startVal':values[j] };
			//	started = true;
			//} else if (j == values.length-1) {
			//	startEnd[countries[i][1]]['endYear'] = years[j];
			//	startEnd[countries[i][1]]['endVal'] = values[j];
			//}
		}

		dataset2.push(currData);
	}

	// just in case...
	if(min == null || max == null) {
		var iobj = getConfigBySensor(sid);
		min = iobj.min;
		max = iobj.max;
	}

	var x = d3.time.scale()
		.domain([start, end])
		.range([0 + this._margin.left, (this._width - this._margin.right)]);
	var y = d3.scale.linear()
		.domain([max, min])
		.range([0 + this._margin.top, (this._height - this._margin.bottom)]);

	this._dateScale = d3.scale.linear().domain([0, 1]).range([start.getTime(), end.getTime()]);

	var line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); });

	for(var k = 0; k < dataset2.length; k++) {
		var currData = dataset2[k];
		if(currData.length > 0) {
			this._viz.append("svg:path")
				.data([currData])
				//.attr("country", countries[i][1])
				.attr("class", "line_chart_path")
				.attr("d", line)
				.attr("name", function(d) {
					return dataset[k].did;
				})
				.on("mouseover", function() {

				})
				.on("mouseout", function() {

				});
		}
	}

	// draw graph
	this._viz.append("svg:line")
		.attr("x1", x(start))
		.attr("y1", y(min))
		.attr("x2", x(end))
		.attr("y2", y(min))
		.attr("class", "line_chart_axis");

	this._viz.append("svg:line")
		.attr("x1", x(start))
		.attr("y1", y(min))
		.attr("x2", x(start))
		.attr("y2", y(max))
		.attr("class", "line_chart_axis_y");

	//this._viz.selectAll(".xLabel")
	//	.data(x.ticks(5))
	//	.enter().append("svg:text")
	//	.attr("class", "xLabel")
	//	.text("womemenne")
	//	.attr("x", function(d) { return x(d) })
	//	.attr("y", this._height-10)
	//	.attr("text-anchor", "middle");

	this._viz.selectAll(".yLabel")
		.data(y.ticks(4))
		.enter().append("svg:text")
		.attr("class", "yLabel")
		.text(function(d) { return d; })
		.attr("x", 3)
		.attr("y", function(d) { return y(d) })
		.attr("text-anchor", "right")
		.attr("dy", 3);

	//this._viz.selectAll(".xTicks")
	//	.data(x.ticks(5))
	//	.enter().append("svg:line")
	//	.attr("class", "xTicks")
	//	.attr("x1", function(d) { return x(d); })
	//	.attr("y1", y(iobj.min))
	//	.attr("x2", function(d) { return x(d); })
	//	.attr("y2", y(iobj.max)+7);

	this._viz.selectAll(".yTicks")
		.data(y.ticks(4))
		.enter().append("svg:line")
		.attr("class", "yTicks")
		.attr("y1", function(d) { return y(d); })
		.attr("x1", x(start) - 3)
		.attr("y2", function(d) { return y(d); })
		.attr("x2", x(start));
}

UiLineChart.prototype.highlight = function(did)
{
	if(did == null) {
		this._viz.selectAll("path")
			.style("stroke", "#ffffff")
			.style("stroke-opacity", 0.6);
	} else {
		this._viz.selectAll("path")
			.attr("name", function(d) {

				if(d3.select(this).attr("name") == did) {
					d3.select(this)
						.style("stroke", sensorColorTable[mainmenu.currSelectSensorIdx])
						.style("stroke-opacity", 1);
					d3.select(this).moveToFront();
				} else {
					d3.select(this)
						.style("stroke", "#ffffff")
						.style("stroke-opacity", 0.6);
				}

				return d3.select(this).attr("name");
			});
	}
}