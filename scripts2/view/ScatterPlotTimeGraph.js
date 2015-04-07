/**
 * Created by marian_mcpartland on 15/4/7.
 */

function ScatterPlotTimeGraph(cont_name)
{
	$("#" + cont_name).append("<div id='scatterplottime_panel'></div>");
	this._svg = d3.select("#scatterplottime_panel")
		.append("svg:svg")
		.attr("width", 500)
		.attr("height", 50)
		.append("svg:g")
		.attr("id", "time_container")
		.attr("transform", "translate(0, 0)");

	var domain = [0, 24];
	var range = [0, $("#scatterplottime_panel").width()];
	this._timescale = d3.scale.linear().domain(domain).range(range);
}

ScatterPlotTimeGraph.prototype.show = function()
{

}

ScatterPlotTimeGraph.prototype.hide = function()
{

}

ScatterPlotTimeGraph.prototype.draw = function(tarr)
{
	var self = this;

	$("#time_container").empty();

	this._svg.selectAll("rect")
		.data(tarr)
		.enter().append("svg:rect")
		.attr("class", "scatterplot_cell")
		.attr("y", 0)
		.attr("x", function(d) {
			var date = new Date(d);
			return self._timescale(date.getHours())
		})
		.attr("width", 500 / 12)
		.attr("height", 50);
}

