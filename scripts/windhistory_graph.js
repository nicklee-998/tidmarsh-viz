// JavaScript Document
function WindHistoryGraph(wid, hei, container, captionText, conf, start, end)
{
	this._wid = wid;
	this._hei = hei;
	this._center = Math.min(wid, hei) / 2; 
	this._outer_p = 20;				// padding on outside of major elements
	this._inner_p = wid * 0.12;			// padding on inner circle
	
	this._vmin = conf.min;
	this._vmax = conf.max;
	this._step = conf.step;
	this._unit = conf.unit;
	this._crange = ["hsl(" + conf.hue + ", 70%, 90%)", "hsl(" + conf.hue + ", 70%, 30%)"];
	
	// 刻度的数量
	this._start = start;
	this._end = end;
	var lasttime = end.getTime() - start.getTime();
	this._scalenum = parseInt((lasttime / 1000) / 20);	// 每隔20秒一个刻度
	
	this._container = container;
		
	// Map a wind probability to an outer radius for the chart
	this._probabilityToRadiusScale;
	// Options for drawing the complex arc chart
	this._windroseArcOptions;
	// Map a wind speed to a color
	this._valueToColorScale;
	
	// The main SVG visualization element						
	this._vis = d3.select(this._container)
        		.append("svg:svg")
			.attr("id", 'wgraphroot')
        		.attr("width", this._wid + "px")
			.attr("height", (this._hei * 1.25) + "px");
			
	// backgroud
	this._vis.append("svg:rect")
		.attr('width', this._wid + 'px')
		.attr('height', this._hei + 'px')
		.style('fill', 'rgb(38,50,55)')
		.style('stroke-width', 0);
	this._vis.append('svg:rect')
		.attr('width', this._wid + 'px')
		.attr('height', this._hei / 4 + 'px')
		.attr('transform', 'translate(' + 0 + ',' + this._hei + ')')
		.style('fill', 'rgb(70,90,98)')
		.style('stroke-width', 0);
		
	// circle in the middle
	this._vis.append("svg:circle")
		.attr('cx', this._wid / 2)
		.attr('cy', this._hei / 2)
		.attr('r', this._inner_p)
		.style('stroke', 'black')
		.style('stroke-width', 1)
		.style('fill', 'rgb(247,247,247)');
		
	// close button
/*	this._vis.append('svg:circle')
		.attr('cx', this._wid)
		.attr('cy', 0)
		.attr('r', 30)
		.style('stroke', 'black')
		.style('stroke-width', 0.5)
		.style('fill', 'rgb(170,170,170)');*/
	
	// caption
	this._vis.append("svg:text")
		.text(captionText)
       		.style( {font:'28px Roboto', 'text-anchor':'middle', 'fill':'rgba(247,247,247,1)'})
       		.attr("transform", "translate(" + this._wid / 2 + "," + (this._hei + 50) + ")");
	pstr = start.toDateString() + " - " + end.toDateString();
	this._vis.append('svg:text')
		.text(pstr)
		.style( {font:'13px Roboto', 'text-anchor':'middle', 'fill':'rgba(210,210,210,0.8)'})
       		.attr("transform", "translate(" + this._wid / 2 + "," + (this._hei + 80) + ")");
}

WindHistoryGraph.prototype.initGraphScale = function() 
{
	this._probabilityToRadiusScale = d3.scale.linear()
						.domain([this._vmin, this._vmax])
						.range([this._inner_p, (this._center - this._outer_p)])
						.clamp(true);
	this._windroseArcOptions = {width:180 / this._scalenum, from:this._inner_p, to:this._probabilityToRadiusScale};
	this._valueToColorScale = d3.scale.linear()
					.domain([this._vmin, this._vmax])
					.range(this._crange)
					.interpolate(d3.interpolateHsl);
								
	// make self...
	var self = this;
	
	// axes
	// "+1"是为了多画最外面的一个圈
	var ticks = d3.range(this._vmin, this._vmax, this._step);
	var tickmarks = d3.range(this._vmin, this._vmax, this._step);
	var vRangeScale = d3.scale.linear()
				.domain([this._vmin, this._vmax])
				.range([this._inner_p, this._center-this._outer_p])
				.clamp(true);
	
	// Circles representing chart ticks
    	this._vis.append("svg:g")
        	.attr("class", "axes")
      		.selectAll("circle")
        	.data(ticks).enter()
		.append("svg:circle")
		.style("fill", "none")
		.style("stroke", "rgba(247,247,247,0.6)")
		.style("stroke-width", "0.8px")
        	.attr("cx", this._center)
		.attr("cy", this._center)
        	.attr("r", vRangeScale);
		
    	// Text representing chart tickmarks
    	this._vis.append("svg:g").attr("class", "tickmarks")
        	.selectAll("text")
        	.data(tickmarks).enter()
		.append("svg:text")
        	.text(function(d) {return d;})
		.style( {font:'14px Roboto', 'text-anchor':'middle', 'fill':'rgba(247,247,247,0.6)'})
        	.attr("dy", "-3px")
        	.attr("transform", function(d) {
            		var y = self._center - vRangeScale(d) - 1;
            		return "translate(" + self._center + "," + y + ")"; 
		});
        
    	// Labels: degree markers
	var tRangeScale = d3.scale.linear()
				.domain([1, this._scalenum])
				.range([0, 360])
				.clamp(true);
						
/*    	this._vis.append("svg:g")
      		.attr("class", "labels")
      		.selectAll("text")
        	.data(d3.range(1, this._scalenum, 1)).enter()
		.append("svg:text")
        	.attr("dy", "-4px")
        	.attr("transform", function(d) { 
            		return "translate(" + self._center + "," + self._outer_p + ") rotate(" + tRangeScale(d) + ",0," + (self._center - self._outer_p) + ")";
		})        
        	.text(function(dir, i) { 
			var str = "";
			if(i % 4 == 0) {
				var day = dir / 4;
				str = Math.ceil(day);
			}
			return str; 
		});*/
			
			
	//Style the plots, this doesn't capture everything from windhistory.com  
	//d3.select(this._container).selectAll("text").style( { font: "14px sans-serif", "text-anchor": "middle" });
	//d3.select(this._container).selectAll("text.labels").style( { "letter-spacing": "1px", fill: "#444", "font-size": "12px" });
	//d3.select(this._container).selectAll("text.arctext").style( { "font-size": "9px" });
}

WindHistoryGraph.prototype.drawBigWindrose = function(datset)
{
	// Draw Graph
	var ret = {};
	ret.dats = new Array();
	var dScale = d3.scale.linear().domain([this._start.getTime(), this._end.getTime()]).range([0, 360]).clamp(true);
	
	var sum = 0;
	var avg = 0;
	if(datset != null) {
		for(var k = 0; k < datset.length; k++) {
			// 计算block所对应的角度
			var date = new Date(datset[k].timestamp);
			ret.dats.push({d:dScale(date.getTime()), value:datset[k].value, ts:date.toTimeString()});
		
			sum += datset[k].value;
		}
		avg = sum / datset.length;
	}
	ret.average = avg;
	
	this.drawComplexArcs(this._vis, ret, this._valueToColorScale, this._speedText, this._windroseArcOptions, this._probArcTextT);
}

// Draw a complete wind rose visualization, including axes and center text
WindHistoryGraph.prototype.drawComplexArcs = function(parent, plotData, colorFunc, arcTextFunc, complexArcOptions, arcTextT) 
{
	var self = this;
	
    	// Draw the main wind rose arcs
    	parent.append("svg:g")
        	.attr("class", "arcs")
        	.selectAll("path")
        	.data(plotData.dats).enter()
		.append("svg:path")
        	.attr("d", this.arc(complexArcOptions))
        	.style("fill", function(d) {return colorFunc(d.value);})
		.style("stroke", function(d) {return colorFunc(d.value);})
		.style("stroke-width", "0.5px")
		.style("fill-opacity", "1")
        	.attr("transform", "translate(" + this._center + "," + this._center + ")")
		.on("mouseover", function(d, i) {
			var x = d3.event.pageX + 30;
			var y = d3.event.pageY;
					
			d3.select("#wgraphtooltip")
				.style("left", x + "px")
				.style("top", y + "px")	
				.select("#value")			
				.text(String(d.value) + self._unit + "  -  " + d.ts);
					
			//Show the tooltip
			d3.select("#wgraphtooltip").classed("hidden", false);
		})
		.on("mouseout", function(d, i) {
			//Hide the tooltip
			d3.select("#wgraphtooltip").classed("hidden", true);
		});
        
    	// Annotate the arcs with speed in text
/*    	if (false) {   // disabled: just looks like chart junk
        	parent.append("svg:g")
            		.attr("class", "arctext")
            		.selectAll("text")
            		.data(plotData.dirs)
          		.enter().append("svg:text")
            		.text(arcTextFunc)
            		.attr("dy", "-3px")
            		.attr("transform", arcTextT);
    	}*/

    	// Add the calm wind probability in the center
    	var cw = parent.append("svg:g").attr("class", "calmwind")
        		.selectAll("text")
        		.data([0])
        		.enter();
    	cw.append("svg:text")
		.attr("class", "calmcaption")
        	.attr("transform", "translate(" + this._wid / 2 + "," + this._hei / 2 + ")")
        	.text(function(d) { return plotData.average.toFixed(2) + String(self._unit) });
    	cw.append("svg:text")
        	.attr("transform", "translate(" + this._wid / 2 + "," + (this._hei/2+14) + ")")
        	.attr("class", "calmcaption")
        	.text("Avg.");
}

// Update a specific digram to the newly selected months
WindHistoryGraph.prototype.updateBigWindrose = function(windroseData, unit) 
{
	// Change the unit to something easy read~
	this.unit = unit;
	if(unit == "percent")
		this.unit = "%";
	if(unit == "celsius")
		this.unit = "°C";
	
    	var rollup = this.rollupForBlocks(windroseData);
    	this.updateComplexArcs(this.vis, rollup, this.valueToColorScale, this._speedText, this.windroseArcOptions, this.probArcTextT);
}

// Update drawn arcs, etc to the newly selected months
WindHistoryGraph.prototype.updateComplexArcs = function(parent, plotData, colorFunc, arcTextFunc, complexArcOptions, arcTextT) 
{
	var self = this;
	
	var sum = 0;
	var avg = 0;
	var count = 0;
	
    	// Update the arcs' shape and color
    	parent.select("g.arcs").selectAll("path")
        	.data(plotData.dirs)
        	.transition().duration(200)
		.delay(function(d, i) { return i * 30; })
        	.style("fill", function(d, i) { 
			if(d.avg != 0) {
				sum += d.avg;
				count++;
				avg = sum / count;
			}
			return colorFunc(d.avg);
		})
        	.attr("d", this.arc(complexArcOptions));

    	// Update the arcs' title tooltip
    	parent.select("g.arcs").selectAll("path").select("title")
        	.text(function(d) { return Math.floor(d.avg) + String(self.unit) });
        
    	// Update the calm wind probability in the center
    	parent.select("g.calmwind").select("text")
        	.data([avg])
        	.text(function(d) { return Math.round(d) + String(self.unit) });
}


// Function to draw a single arc for the wind rose
// Input: Drawing options object containing
//   width: degrees of width to draw (ie 5 or 15)
//   from: integer, inner radius
//   to: function returning the outer radius
// Output: a function that when called, generates SVG paths.
//   It expects to be called via D3 with data objects from totalsToFrequences()
WindHistoryGraph.prototype.arc = function(o) 
{
	return d3.svg.arc()
        	.startAngle(function(d) { return (d.d - o.width) * Math.PI/180; })
        	.endAngle(function(d) { return (d.d + o.width) * Math.PI/180; })
        	.innerRadius(o.from)
        	.outerRadius(function(d) { return o.to(d.value); });
};

// Filter input data, giving back frequencies for the selected block 
// Convert a dictionary of {direction: total} to frequencies
// Output is an array of objects with three parameters:
//   d: wind direction
//   p: probability of the wind being in this direction
//   s: average speed of the wind in this direction
WindHistoryGraph.prototype._rollupForDatas = function(d) 
{
	
}

// Return a string representing the wind speed for this datum
WindHistoryGraph.prototype._speedText = function(d) 
{ 
	return d.s < 10 ? "" : d.s.toFixed(0); 
};

// Transformation to place a mark on top of an arc
WindHistoryGraph.prototype._probArcTextT = function(d) 
{
	var tr = probabilityToRadiusScale(d.avg);
	return "translate(" + 200 + "," + (200-tr) + ")" + "rotate(" + d.d + ",0," + tr + ")"; 
};