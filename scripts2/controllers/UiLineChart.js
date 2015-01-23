/**
 * Created by marian_mcpartland on 15/1/22.
 */
function UiLineChart()
{
	this._width = window.innerWidth;
	this._height = 200;
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

	function onDraggerMove(event)
	{
		if(self._draggerDown) {
			//console.log(event);
			var px = event.clientX;
			d3.select("#drag_bar").attr("x", px - self._mouseOffsetX);
		}

		var baroffsetx = d3.select("#drag_bar").attr("x");
		var set_perc = (baroffsetx - self._margin.left) / (self._width - self._margin.left - self._margin.right);
		//console.log(set_perc);

		if(set_perc >= 0 && set_perc <= 1) {
			jQuery.publish(LINE_CHART_DRAG, precToDate(set_perc));
			//updateNetworkNode();
			//updateVGraphBySlider();
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

	d3.select("#chart_div")
		.append("svg")
		.attr("width", this._width)
		.attr("height", this._height)
		.attr("class", "line_chart_svg_dragger")
		.append("rect")
		.attr("id", "drag_bar")
		.attr("x", 50)
		.attr("y", 0)
		.attr("width", 30)
		.attr("height", this._height)
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
		});

	var self = this;
}

//UiLineChart.prototype.updateDragger = function(moffsetX, prec)
//{
//	d3.select("#drag_bar").attr("x", self._margin.left);
//
//	sliderCurrent = new Date(sliderScale(perc));
//	slider.style.left = (mousex - bar.offsetLeft - 9) + 'px';
//	var cstr = sliderCurrent.getHours() + ":" + sliderCurrent.getMinutes() + ":" + sliderCurrent.getSeconds();
//	slider_curr_date.value = cstr;
//	slider_curr_date.style.left = (mousex - bar.offsetLeft - 65) + 'px';
//}

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

	// start making graph
	var iobj = getConfigBySensor(sid);

	var x = d3.time.scale()
		.domain([start, end])
		.range([0 + this._margin.left, (this._width - this._margin.right)]);
	var y = d3.scale.linear()
		.domain([iobj.max, iobj.min])
		.range([0 + this._margin.top, (this._height - this._margin.bottom)]);

	this._dateScale = d3.scale.linear().domain([0, 1]).range([start.getTime(), end.getTime()]);

	var line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); });

	// set dataset
	for (var i = 0; i < dataset.length; i++) {

		var values = dataset[i].datas;
		var currData = [];
		//countryCodes[countries[i][1]] = countries[i][0];

		//var started = false;
		for (var j = 0; j < values.length; j++) {

			//console.log(values[j].timestamp);
			var date = new Date(values[j].timestamp);

			if (values[j].value == -999) {
				currData.push({x: date, y: iobj.min});
			} else {
				currData.push({x: date, y: values[j].value});
			}


			//if (!started) {
			//	startEnd[countries[i][1]] = { 'startYear':years[j], 'startVal':values[j] };
			//	started = true;
			//} else if (j == values.length-1) {
			//	startEnd[countries[i][1]]['endYear'] = years[j];
			//	startEnd[countries[i][1]]['endVal'] = values[j];
			//}
		}

		if(currData.length > 0) {
			this._viz.append("svg:path")
				.data([currData])
				//.attr("country", countries[i][1])
				.attr("class", "line_chart_path")
				.attr("d", line)
				.attr("name", function(d) {
					return dataset[i].did;
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
		.attr("y1", y(iobj.min))
		.attr("x2", x(end))
		.attr("y2", y(iobj.min))
		.attr("class", "line_chart_axis");

	this._viz.append("svg:line")
		.attr("x1", x(start))
		.attr("y1", y(iobj.min))
		.attr("x2", x(start))
		.attr("y2", y(iobj.max))
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
	var self = this;

	if(did == null) {
		this._viz.selectAll("path")
			.style("stroke", "#ffffff");
	} else {
		this._viz.selectAll("path")
			.attr("name", function(d) {

				if(d3.select(this).attr("name") == did) {
					d3.select(this).style("stroke", sensorColorTable[mainmenu.currSelectSensorIdx]);
					d3.select(this).moveToFront();
				} else {
					d3.select(this).style("stroke", "#ffffff");
				}

				return d3.select(this).attr("name");
			});
	}
}