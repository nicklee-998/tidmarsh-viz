/**
 * Created by marian_mcpartland on 15/1/19.
 */

var _calendarDays;
var _calendarIsHide;
var _calendarWidth;

var calendarCsv = null;

// pie chart
var pie_svg;
var pie_key;
var pie;
var pie_arc;
var pie_outerArc;
var pie_color;
var pheight;
var pradius;
var pieIsHide;

var _barSvg;
var _barWidth;
var _barHeight;
var _barXScale;
var _barYScale;
var _barIsHide;
var _barGoY;

function initHealthCalendar()
{
	//$("#health_calendar").append("<p id='health_calendar_year'>2015</p>");

	var monthTable = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];
	var year = 2014;
	var cellSize = 13;
	var gapSize = 6;

	//var arr = d3.time.days(new Date(2014, 2, 1), new Date(2014, 3, 1));
	//console.log(arr);

	var yearTitleHei = 30;

	var monthWid = cellSize * 8;
	var monthHei = cellSize * 6;

	// 总宽度 ＝ （一周7天 ＋ 月标题）* 两列
	// 总高度 ＝ 一个月最多6周 * 6行
	var width = monthWid * 2 + gapSize;
	var height = (monthHei + gapSize) * 6 + yearTitleHei;

	_calendarWidth = width;

	var day = d3.time.format("%w"),
		week = d3.time.format("%U"),
		percent = d3.format(".1%"),
		format = d3.time.format("%Y-%m-%d");

	var svg = d3.select("#health_calendar")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(0, 0)");

	$("#health_calendar").mouseover(function(evt) {
		//console.log(evt);
		_barGoY = evt.clientY;
	});
	$("#health_calendar").mouseout(function(evt) {
		if(evt.offsetX < 0 || evt.offsetY < 0 || evt.offsetX > width || evt.offsetY > height) {
			// hide chart
			showChart(false);
		}
	});

	var title = svg.append("text")
		.attr("class", "calendar_year")
		.attr("transform", "translate(0, 20)")
		//.style("text-anchor", "middle")
		.text(year);

	var idx = 0;
	var months = svg.selectAll("g")
		.data(d3.range(0, 12))
		.enter().append("g")
		.attr("width", monthWid)
		.attr("height", monthHei)
		.attr("transform", function(d, i) {
			var px, py;
			py = idx * (monthHei + gapSize) + yearTitleHei;
			if (i % 2 == 0) {
				px = 0;
			} else {
				px = monthWid + gapSize;
				idx++;
			}

			return "translate(" + px + "," + py + ")";
		});

	var monthidx = 0;
	months.selectAll(".title")
		.data(d3.range(0, 1))
		.enter().append("text")
		.attr("class", "calendar_month_title")
		.attr("transform", "translate(12," + (monthHei - cellSize) + ") rotate(-90)")
		.text(function(d, i) {
			var mstr = monthTable[monthidx];
			monthidx++;
			return mstr;
		});

	var lastmonth = 0;
	var lastweek = 0;
	var weekidx = 0;
	var dayidx = 0;
	_calendarDays = months.selectAll(".day")
		.data(function(d, i) { return d3.time.days(new Date(year, i, 1), new Date(year, i+1, 1));})
		.enter().append("rect")
		.attr("class", "calendar_day")
		.attr("width", cellSize)
		.attr("height", cellSize)
		.attr("x", function(d) { return day(d) * cellSize + cellSize; })
		.attr("y", function(d) {
			var date = new Date(d);
			var m = date.getMonth();

			if(lastmonth != m) {
				lastmonth = m;
				lastweek = week(new Date(year, m, 1));
				weekidx = 0;
			}

			if(week(d) != lastweek) {
				lastweek = week(d);
				weekidx++;
			}

			d3.select(this).attr("name", "day_" + dayidx);
			dayidx++;

			return weekidx * cellSize;
		})
		.on("mouseover", function(d, i) {

			if(calendarCsv != null) {
				var str = d3.select(this).attr("name");
				var idx = parseInt(str.substring(4));
				//console.log(calendarCsv[idx]);

				var arr = new Array();
				var arr2 = new Array();
				var obj = calendarCsv[idx];
				var total = 0;
				var date;
				for (value in obj) {
					if (value == "did" ||
						value.indexOf("wind_direction") != -1 ||
						value.indexOf("wind_speed") != -1 ||
						value.indexOf("solar_voltage") != -1 ||
						value.indexOf("charge_flags_charge") != -1 ||
						value.indexOf("charge_flags_fault") != -1) {
						//console.log(value + ", " + obj[value]);
						continue;

					} else if(value.indexOf("date") != -1) {
						date = new Date(obj[value]);
					} else {
						var val = parseInt(obj[value]);
						if (val == -999) {
							val = 0;
						}
						total += val;
						arr.push({label:value, value:val});

						// fixme: 4320 is the message ratio, it's hard code right now
						var f = val / 4320;
						arr2.push(f);
					}
				}

				// calculate health
				var tol = 0;
				for(index in arr2) {
					tol += arr2[index];
				}
				var health = tol / arr2.length * 100;

				$("#health_sensor_date").text("DATE: " + date.toLocaleDateString());
				$("#health_sensor_value").text("DEVICE HEALTH: " + health.toFixed(2) + "%");

				barChange(arr);
				showChart(true);

				//if(total != 0) {
				//	pieChange(arr);
				//} else {
				//	pieChange(null);
				//}
			}
		})
		.on("mouseout", function(d, i) {

		})
		.datum(format);

	//var cfile = "./res/data_2014/0x812A_2014.csv";
	//setHealthCalendar(cfile);

	// hide graph
	$("#health_calendar").css("left", -width);
	_calendarIsHide = true;

	// -----------------------------------------
	//  Sensor graph - Bar Chart
	// -----------------------------------------
	var margin = {top:50, right:0, bottom:10, left:10};
	_barWidth = 350;
	_barHeight = 140;

	_barXScale = d3.scale.ordinal()
		.domain(["sht_temperature", "illuminance", "bmp_pressure", "sht_humidity", "battery_voltage", "bmp_temperature"])
		.rangeRoundBands([0, _barWidth], 0.3);
	_barYScale = d3.scale.linear()
		.domain([0, 4320])
		.range([_barHeight - margin.bottom / 2, 0]);

	_barSvg = d3.select("#health_sensor")
		.append("svg")
		.attr("width", _barWidth + margin.left + margin.right)
		.attr("height", _barHeight + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var dataset = [{label:"sht_temperature", value:0}, {label:"bmp_temperature", value:0}, {label:"illuminance", value:0},
		{label:"bmp_pressure", value:0}, {label:"sht_humidity", value:0}, {label:"battery_voltage", value:0}];
	var colors = ["#E77227", "#FFC87D", "#D81E00", "#E445BA", "#3242DF", "#57C66C"];

	_barSvg.selectAll("rect")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("x", function(d) {
			return _barXScale(d.label);
		})
		.attr("y", function(d) { return _barYScale(d.value); })
		.attr("width", _barXScale.rangeBand())
		.attr("height", function(d) { return _barHeight - _barYScale(d.value); })
		.attr("fill", function(d, i) { return colors[i] });

	_barSvg.selectAll("text")
		.data(dataset)
		.enter()
		.append("text")
		.attr("class", "value_text")
		.attr("x", function(d) {
			return _barXScale(d.label) + _barXScale.rangeBand() / 2;
		})
		.attr("y", function(d) {
			return _barYScale(d.value) + 15;
		})
		.attr("font-size", "11px")
		.attr("text-anchor", "middle")
		.attr("fill", "white")
		.text(function(d) { return d.value; });

	var titleSvg = _barSvg.append("g");

	titleSvg.selectAll("text")
		.data(dataset)
		.enter()
		.append("text")
		.attr("y", function(d) {
			return _barXScale(d.label) + _barXScale.rangeBand() / 2 - 20;
		})
		.attr("x", -_barHeight)
		.attr("transform", "rotate(-90)")
		.attr("font-size", "10px")
		.attr("text-anchor", "left")
		.attr("fill", "#999999")
		.text(function(d) { return d.label; });

	// hide graph
	$("#health_sensor").css("top", -(_barHeight+100));
	_barIsHide = true;

	// -----------------------------------------
	//  Sensor graph - Pie Chart
	// -----------------------------------------
	//var pwidth = 440;
	//pheight = 200;
	//pradius = Math.min(pwidth, pheight) / 2;
	//
	//pie_svg = d3.select("#health_sensor")
	//	.append("svg")
	//	.attr("width", pwidth)
	//	.attr("height", pheight)
	//	.append("g");
	//pie_svg.append("g").attr("class", "slices");
	//pie_svg.append("g").attr("class", "pie_labels");
	//pie_svg.append("g").attr("class", "pie_polyline");
	//
	//pie = d3.layout.pie()
	//	.sort(null)
	//	.value(function(d) {
	//		return d.value;
	//	});
	//pie_arc = d3.svg.arc()
	//	.outerRadius(pradius * 0.8)
	//	.innerRadius(pradius * 0.5);
	//pie_outerArc = d3.svg.arc()
	//	.innerRadius(pradius * 0.9)
	//	.outerRadius(pradius * 0.9);
	//
	//pie_svg.attr("transform", "translate(" + pwidth / 2 + "," + pheight / 2 + ")");
	//pie_key = function(d) {
	//	return d.data.label;
	//};
	//
	//pie_color = d3.scale.ordinal()
	//	.domain(["sht_temperature", "illuminance", "bmp_pressure", "sht_humidity", "battery_voltage", "bmp_temperature"])
	//	.range(["#E77227", "#D81E00", "#E445BA", "#3242DF", "#57C66C", "#FFC87D"]);
	//
	//
	//function randomData (){
	//	var labels = pie_color.domain();
	//	return labels.map(function(label){
	//		return { label: label, value: Math.random() }
	//	});
	//}
	//pieChange(randomData());
}

function showChart(flag)
{
	if(flag) {
		//if(_barIsHide) {
		$("#health_sensor").css("visibility", "visible");
		$("#health_sensor").clearQueue();
		$("#health_sensor").animate({
			"top": _barGoY
		}, 500, "easeOutQuint", function() {
			_barIsHide = false;
		});
		//}
	} else {
		// hide
		var py = -_barHeight;
		$("#health_sensor").stop().animate({
			"top": py
		}, 500, "easeOutQuint", function() {
			$("#health_sensor").css("visibility", "hidden");
			_barIsHide = true;
		});
	}
}

function barChange(data)
{
	//console.log("bar change");
	//var dataset = [{label:"sht_temperature", value:430}, {label:"bmp_temperature", value:200}, {label:"illuminance", value:110},
	//	{label:"bmp_pressure", value:1240}, {label:"sht_humidity", value:1310}, {label:"battery_voltage", value:20}];

	_barSvg.selectAll("rect")
		.data(data)
		.transition()
		.duration(1000)
		.attr("y", function(d) { return _barYScale(d.value); })
		.attr("height", function(d) { return _barHeight - _barYScale(d.value); });

	_barSvg.selectAll(".value_text")
		.data(data)
		.transition()
		.duration(1000)
		.text(function(d) {
			return d.value;
		})
		.attr("y", function(d) {
			return _barYScale(d.value) + 15;
		});
}

function pieChange(data)
{
	if(data == null) {
		// hide
		if(!pieIsHide) {
			var py = -pheight;
			$("#health_sensor").animate({
				"top": py
			}, 500, "easeOutQuint", function() {
				pieIsHide = true;
			});
		}
		return;
	} else {
		// show
		if(pieIsHide) {
			$("#health_sensor").animate({
				"top": 150
			}, 500, "easeOutQuint", function() {
				pieIsHide = false;
			});
		}
	}

	/* ------- PIE SLICES -------*/
	var slice = pie_svg.select(".slices").selectAll("path.slice")
		.data(pie(data), pie_key);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { return pie_color(d.data.label); })
		.attr("class", "slice");

	slice
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return pie_arc(interpolate(t));
			};
		})

	slice.exit()
		.remove();

	/* ------- TEXT LABELS -------*/
	var text = pie_svg.select(".pie_labels").selectAll("text")
		.data(pie(data), pie_key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
		.text(function(d) {
			return d.data.label;
		});

	function midAngle(d){
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}

	text.transition().duration(1000)
		.attrTween("transform", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = pie_outerArc.centroid(d2);
				pos[0] = pradius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate("+ pos +")";
			};
		})
		.styleTween("text-anchor", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start":"end";
			};
		});

	text.exit()
		.remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/
	var polyline = pie_svg.select(".pie_polyline").selectAll("polyline")
		.data(pie(data), pie_key);

	polyline.enter()
		.append("polyline");

	polyline.transition().duration(1000)
		.attrTween("points", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = pie_outerArc.centroid(d2);
				pos[0] = pradius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [pie_arc.centroid(d2), pie_outerArc.centroid(d2), pos];
			};
		});

	polyline.exit()
		.remove();
}

function setHealthCalendar(csvfile)
{
	if(!_calendarIsHide) {
		var px = -_calendarWidth;
		$("#health_calendar").animate({
			"left": px
		}, 500, "easeOutQuint", function() {
			_calendarIsHide = true;
		});
	}

	// loading csv file
	var c1 = "hsl(0, 100%, 100%)";
	var c2 = "hsl(113, 100%, 55%)";
	var valueToColorScale = d3.scale
		.sqrt()
		//.linear()
		.domain([0, 1])
		.range([c1, c2])
		.interpolate(d3.interpolateHsl);

	d3.csv(csvfile, function(csv) {

		calendarCsv = csv;

		var idx = 0;
		_calendarDays
			.attr("fill", function (d, i) {

				var obj = csv[idx];
				var arr = new Array();
				var health = 0;
				for (value in obj) {
					if (value == "did" ||
						value.indexOf("date") != -1 ||
						value.indexOf("charge_flags_charge") != -1 ||
						value.indexOf("charge_flags_fault") != -1) {
						//console.log(value + ", " + obj[value]);
						continue;

					} else {
						var val = parseInt(obj[value]);
						if (val == -999) {
							continue;
						} else {
							// fixme: 4320 is the message ratio, it's hard code right now
							var f = val / 4320;
							arr.push(f);
						}
						//console.log(value + ", " + obj[value]);
					}
				}

				// calculate health
				var total = 0;
				for (index in arr) {
					total += arr[index];
				}
				health = total / arr.length;

				var hColor = valueToColorScale(health);

				idx++;

				return hColor;
			});

		$("#health_calendar").animate({
			"left": 50
		}, 500, "easeOutQuint", function () {
			_calendarIsHide = false;
		});
	});
}

function hideHealthCalendar()
{
	if(!_calendarIsHide) {
		var px = -_calendarWidth;
		$("#health_calendar").animate({
			"left": px
		}, 500, "easeOutQuint", function() {
			_calendarIsHide = true;
			calendarCsv = null;
		});
	}
}