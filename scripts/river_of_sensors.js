/**
 * Created by marian_mcpartland on 14/11/3.
 */

function SensorRiver(canvas)
{
	this._svg = d3.select(canvas);
	this._timer = null;

	this._dlist = null;
	this._slist = null;
	this._st = null;
	this._ed = null;

	this._idx = 0;
}

SensorRiver.prototype.initGraph = function(devlist)
{

}

SensorRiver.prototype.drawGraph = function(dlist, slist, st, ed)
{
	this._dlist = dlist;
	this._slist = slist;
	this._st = st;
	this._ed = ed;
	this._idx = 0;

	jQuery.subscribe(RIVER_DRAW_COMPLETE, this._onRiverDraw);

	this._drawGraph();
}

SensorRiver.prototype._onRiverDraw = function(e, d)
{
	console.log("onRiverDraw Complete!");

	if(d._idx == d._dlist.length) {
		jQuery.unsubscribe(RIVER_DRAW_COMPLETE, d._onRiverDraw);
		return;
	}

	d._drawGraph();
}


SensorRiver.prototype._drawGraph = function()
{
	console.log("draw device = " + this._dlist[this._idx]);

	var interval = 1200;
	var num = 86400 / interval;

	//x and y axis maps.
	var x = d3.scale.linear().domain([0, num]).range([0, 1900]);
	var y = d3.scale.linear().domain([0, 1]).range([0, 300]);

	var area = d3.svg.area()
		.x(function(d) { return x(d.x); })
		.y0(function(d) { return y(d.y0); })
		.y1(function(d) { return y(d.y0 + d.y); })
		.interpolate("basis");

	var stack = d3.layout.stack()
		.offset("zero")
		.values(function(d) { return d.values; });

	var pnt = new Date(this._st.year, this._st.month, this._st.day, this._st.hour, this._st.minu, this._st.sec);		// change to timestamp
	var end = new Date(this._ed.year, this._ed.month, this._ed.day, this._ed.hour, this._ed.minu, this._ed.sec);		// change to timestamp
	var k = 0;
	var did = this._dlist[this._idx];
	var self = this;

	// prepare svg
	var dsvg = this._svg.append("g")
		.attr("id", did)
		.attr("transform", function() {
			return "translate(" + 0 + "," + 310 * self._idx + ")";
		});

	// 记录前一个点的坐标
	var prevArr = [];

	this._timer = setInterval(function() {
		if(pnt <  end) {
			console.log("draw time: " + pnt.toString() + ", k = " + k);
			console.log("---------------------------------------------");

			// A data set to draw
			var sensorArr = [];

			for(var ii = 0; ii < self._slist.length; ii++) {
				var obj = {name:self._slist[ii], values:[], color:null};

				// calculate sum and perc
				var realvalue = 0;
				var percentage = 0;
				var sum = 0;
				for(var iii = 0; iii < self._slist.length; iii++) {
					var cobj = getConfigBySensor(self._slist[iii]);
					var perc = 0;
					var data = sManager.fetchData(did, self._slist[iii], pnt);

					if(data != null) {
						perc = data.value / (cobj.max - cobj.min);
					}

					if(self._slist[ii] == self._slist[iii]) {
						realvalue = data.value;
						percentage = perc;
					}
					sum += perc;
				}

				//console.log(self._slist[ii] + ": " + percentage + ", sum = " + sum);

				// 在之前的数组中进行查找
				var isfind = false;
				for(var q = 0; q < prevArr.length; q++) {
					if(prevArr[q].name == obj.name) {
						// 如果找到之前的信息了
						obj.values.push({x:prevArr[q].x, y:prevArr[q].y});
						obj.values.push({x:k, y:(percentage / sum)});

						var conf = getConfigBySensor(self._slist[ii]);
						var crange = ["hsl(" + conf.hueL + ", " + conf.saturationL + "%, " + conf.lightnessL + "%)",
							"hsl(" + conf.hueR + ", " + conf.saturationR + "%, " + conf.lightnessR + "%)"];
						var valueToColorScale = d3.scale.linear()
							.domain([conf.min, conf.max])
							.range(crange)
							.interpolate(d3.interpolateHsl);
						obj.color = valueToColorScale(realvalue);

						prevArr[q].x = k;
						prevArr[q].y = (percentage / sum);

						sensorArr.push(obj);

						isfind = true;
						break;
					}
				}

				// 如果之前的数组中没有，此次先不画
				if(!isfind) {
					prevArr.push({name:obj.name, x:k, y:(percentage / sum)});
				}
			}

			if(sensorArr.length > 0) {
				var g = dsvg.append("g");
				g.selectAll("path")
					.data(stack(sensorArr))
					.enter()
					.append("path")
					.attr("d", function(d) { return area(d.values); })
					.attr("fill", function(d) { return d.color; })
					.attr("stroke", function(d) { return d.color; })
					.attr("stroke-width", 1)
					.append("title")
					.text(function(d) { return d.name; });
			}

			pnt.setSeconds(pnt.getSeconds() + interval);
			k++;
		} else {
			// 清除定时器
			clearInterval(self._timer);
			self._idx++;

			// ---------------------------
			// Send draw complete event
			// ---------------------------
			jQuery.publish(RIVER_DRAW_COMPLETE, self);
		}
	}, 30);
}