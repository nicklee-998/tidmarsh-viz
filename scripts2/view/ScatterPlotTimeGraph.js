/**
 * Created by marian_mcpartland on 15/4/7.
 */

function ScatterPlotTimeGraph(cont_name)
{
	$("#" + cont_name).append("<div id='scatterplottime_panel'></div>");

	this._width = $("#scatterplottime_panel").width();
	this._height = $("#scatterplottime_panel").height();

	var domain = [0, 24];
	var range = [0, this._width];
	this._timescale = d3.scale.linear().domain(domain).range(range);

	var xAxis = d3.svg.axis()
		.scale(this._timescale)
		.orient("bottom");

	this._svg = d3.select("#scatterplottime_panel")
		.append("svg:svg")
		.attr("width", this._width)
		.attr("height", this._height)
		.append("svg:g")
		.attr("id", "time_container")
		.attr("transform", "translate(0, 0)");

	var svg = d3.select("#scatterplottime_panel")
		.append("svg")
		.attr("width", this._width + 50)
		.attr("height", this._height)
		.append("g")
		.attr("transform", "translate(0, 0)");

	svg.append("svg:g")
		.attr("class", "x axis")
		.attr("transform", "translate(0, 0)")
		.call(xAxis)
		.selectAll("text")
		.attr("y", 6)
		.attr("x", 6)
		.attr("dy", "1.71em")
		.style("font-size", 6)
		.style("fill", "white")
		.style("text-anchor", "end");

	// hide
	$("#scatterplottime_panel").css("visibility", "hidden");
}

ScatterPlotTimeGraph.prototype.show = function()
{
	$("#scatterplottime_panel").css("visibility", "visible");
}

ScatterPlotTimeGraph.prototype.hide = function()
{
	$("#scatterplottime_panel").css("visibility", "hidden");
}

ScatterPlotTimeGraph.prototype.draw = function(tarr)
{
	var self = this;

	$("#time_container").empty();

	// 计算每个时间段数据的数量
	//var temptable = {};
	//for(var i = 0; i < tarr.length; i++) {
	//	var date = new Date(tarr[i]);
	//	var hour = date.getHours();
	//	//console.log(date + ", " + hour);
	//	if(temptable.hasOwnProperty(hour.toString())) {
	//		temptable[hour.toString()] += 1;
	//	} else {
	//		temptable[hour.toString()] = 1;
	//	}
	//}
	//console.log(temptable);

	this._svg.selectAll("rect")
		.data(tarr)
		.enter().append("svg:rect")
		.attr("class", "scatterplot_cell")
		.attr("y", 0)
		.attr("x", function(d) {
			var date = new Date(d);
			return self._timescale(date.getHours());
		})
		.attr("width", this._width / 12)
		.attr("height", this._height);
}

