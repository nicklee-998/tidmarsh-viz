/**
 * Created by marian_mcpartland on 15/3/4.
 */

function PowerView(scene)
{
	this._scene = scene;

	// style
	this._dayWidth = 2000;
	this._dayLength = 80;
	this._dayHeight = 500;

	// data buffer
	this._dayList;
	this._sunDataArr;
	this._weatherDataArr;
}

// ---------------------------------------------------
// --- PUBLIC METHOD ---------------------------------
// ---------------------------------------------------

PowerView.prototype.show = function()
{

}

PowerView.prototype.hide = function()
{

}


PowerView.prototype.genMonthGraph = function(year, month)
{
	var suncsvfile = "./res/data_power/sunrise_sunset_" + year + "_" + month + ".csv";
	var weathercsvfile = "./res/data_power/weather_" + year + "_" + month + ".csv";
	var csvfile = "./res/data_power/tidbase4_" + year + "_" + month + ".csv";
	var self = this;

	this._dayList = d3.time.days(new Date(year, month-1, 1), new Date(year, month, 1));

	d3.csv(suncsvfile, function(csv) {
		// save sunrise & sunset infomation
		self._sunDataArr = csv;

		// ------------------------------------
		//  Draw monthly sunrise & sunset
		// ------------------------------------
		self._drawSunriseSunsetByMonth();
	});

	d3.csv(weathercsvfile, function(csv) {
		// save weather information
		self._weatherDataArr = csv;

		// ------------------------------------
		//  Draw weather box
		// ------------------------------------
		self._drawWeatherByMonth();
	});

	d3.csv(csvfile, function(csv) {

		if(csv.length == 0)
			return;

		var date = new Date(csv[0].date);
		var currday = date.getDate();
		var arr = new Array();
		var dayidx = 0;
		for(var i = 0; i < csv.length; i++) {
			var obj = csv[i];
			date = new Date(obj.date);
			//console.log(date);

			if(currday == date.getDate()) {
				arr.push(obj);
			} else {
				self._genDayLine(arr, dayidx);

				arr = new Array();
				arr.push(obj);
				currday = date.getDate();
				dayidx++;

				// FOR DEBUG
				//if(dayidx == 3)
				//	break;
			}
		}
	});
}

PowerView.prototype.dispose = function()
{

}

// ---------------------------------------------------
// --- PRIVATE METHOD --------------------------------
// ---------------------------------------------------

PowerView.prototype._genDayLine = function(datset, idx)
{
	//console.log(datset);

	// time scale
	var _scaleTime = d3.time.scale()
		.domain([new Date(datset[0].date), new Date(datset[datset.length-1].date)])
		.rangeRound([-this._dayWidth / 2, this._dayWidth / 2]);
	// current scale
	var _scaleCurrent = d3.scale.linear()
		.domain([0, 8])
		.rangeRound([0, 500]);
	// voltage scale
	var _scaleVoltage = d3.scale.linear()
		.domain([8, 15])
		.range([0, this._dayHeight]);

	var c1 = "hsl(0, 100%, 100%)";
	var c2 = "hsl(0, 100%, 50%)";
	//var min = this._getMinTemperature(datset);
	//var max = this._getMaxTemperature(datset);
	var min = -10;
	var max = 50;
	var _scaleTemprature = d3.scale.sqrt()
		//.linear()
		.domain([min, max])
		.range([c1, c2])
		.interpolate(d3.interpolateHsl);

	var c3 = "hsl(120, 100%, 100%)";
	var c4 = "hsl(120, 100%, 50%)";
	var _scaleColorCurrent = d3.scale.sqrt()
		//.linear()
		.domain([0, 8])
		.range([c3, c4])
		.interpolate(d3.interpolateHsl);

	// -------------------------
	//  Draw Day box
	// -------------------------
	var posday = -this._dayLength * idx;           // day position
	var daybox = new THREE.Mesh(
		new THREE.BoxGeometry(this._dayWidth, this._dayHeight, this._dayLength),
		new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0})
	);
	daybox.position.x = 0;
	daybox.position.y = this._dayHeight / 2;
	daybox.position.z = posday;
	this._scene.add(daybox);

	// ---------------------------------
	//  Draw Day sunrise & sunset
	// ---------------------------------
	//var tmpd = new Date(datset[0].date);
	//var year = tmpd.getFullYear();
	//var month = tmpd.getMonth();
	//var day = tmpd.getDate();
	//this._drawSunriseSunset(year, month, day, posday, _scaleTime);

	// -------------------------
	//  Draw Graph
	// -------------------------
	for(var i = 0; i < datset.length-1; i++) {
		var obj1 = datset[i];
		var obj2 = datset[i+1];

		if(obj1.battery_voltage != "null" && obj2.battery_voltage != "null") {

			// -------------------------
			//  For running
			// -------------------------

			// voltage
			var posv1 = _scaleVoltage(obj1.battery_voltage);
			var posv2 = _scaleVoltage(obj2.battery_voltage);

			// time
			var postime1 = _scaleTime(new Date(obj1.date));
			var postime2 = _scaleTime(new Date(obj2.date));

			// temprature
			var tcolor = _scaleTemprature(obj1.battery_temperature);
			tcolor = tcolor.substring(1);
			var cstr = "0x" + tcolor;

			// draw line
			var material = new THREE.LineBasicMaterial({
				linewidth: 5
			});
			material.color.setHex(cstr);

			var geometry = new THREE.Geometry();
			geometry.vertices.push(
				new THREE.Vector3(postime1, posv1, posday),
				new THREE.Vector3(postime2, posv2, posday)
			);

			var line = new THREE.Line(geometry, material, THREE.LineStrip);
			this._scene.add(line);

			// -------------------------
			//  For charging
			// -------------------------
			if(obj1.charging > 0 && obj2.charging > 0) {

				var posv3 = _scaleCurrent(obj1.charge_current);
				var posv4 = _scaleCurrent(obj2.charge_current);

				// charge current
				tcolor = _scaleColorCurrent(obj1.charge_current);
				tcolor = tcolor.substring(1);
				cstr = "0x" + tcolor;

				// draw line
				var material1 = new THREE.LineBasicMaterial({
					linewidth: 5
				});
				material1.color.setHex(cstr);

				var geometry1 = new THREE.Geometry();
				geometry1.vertices.push(
					new THREE.Vector3(postime1, posv3, posday),
					new THREE.Vector3(postime2, posv4, posday)
				);

				var line1 = new THREE.Line(geometry1, material1, THREE.LineStrip);
				this._scene.add(line1);
			}
		}
	}
}

PowerView.prototype._drawSunriseSunset = function(year, month, day, posday, timescale)
{
	var boxcolor = 0x000000;
	var boxopacity = 1;

	var sundat = this._getSunTime(year, month, day);

	var postime1 = timescale(sundat.sunrise);
	var postime2 = timescale(sundat.sunset);

	// sunrise box
	var sunrisewid = postime1 - (-this._dayWidth / 2);
	var sunrisebox = new THREE.Mesh(
		new THREE.BoxGeometry(sunrisewid, this._dayHeight, this._dayLength, 10, 10, 10),
		new THREE.MeshBasicMaterial({color: boxcolor, transparent: false, opacity: boxopacity})
	);
	sunrisebox.position.x = -this._dayWidth / 2 + sunrisewid / 2;
	sunrisebox.position.y = this._dayHeight / 2;
	sunrisebox.position.z = posday;
	this._scene.add(sunrisebox);

	// sunset box
	var sunsetwid = (this._dayWidth / 2) - postime2;
	var sunsetbox = new THREE.Mesh(
		new THREE.BoxGeometry(sunsetwid, this._dayHeight, this._dayLength, 10, 10, 10),
		new THREE.MeshBasicMaterial({color: boxcolor, transparent: false, opacity: boxopacity})
	);
	sunsetbox.position.x = postime2 + sunsetwid / 2;
	sunsetbox.position.y = this._dayHeight / 2;
	sunsetbox.position.z = posday;
	this._scene.add(sunsetbox);
}

PowerView.prototype._drawSunriseSunsetByMonth = function()
{
	var sunrise_pts = new Array();
	var sunset_pts = new Array();
	var ii = this._sunDataArr.length * 2;
	for(var i = 0; i < this._sunDataArr.length; i++) {

		// time scale
		var date1 = new Date(this._sunDataArr[i].year, this._sunDataArr[i].month, this._sunDataArr[i].day);
		var date2 = new Date(this._sunDataArr[i].year, this._sunDataArr[i].month, this._sunDataArr[i].day);
		date2.setHours(date2.getHours() + 24);
		var _scaleTime = d3.time.scale()
			.domain([date1, date2])
			.rangeRound([-this._dayWidth / 2, this._dayWidth / 2]);

		// day pos
		var daypos = this._dayLength * i;

		// sunrise
		var sunrise = new Date(this._sunDataArr[i].sunrise);
		var sunrise_pos1 = -this._dayWidth / 2;
		var sunrise_pos2 = _scaleTime(sunrise);

		//sunrise_pts.push(new THREE.Vector2(sunrise_pos1, daypos));
		//sunrise_pts.push(new THREE.Vector2(sunrise_pos2, daypos));

		ii--;

		sunrise_pts[ii] = new THREE.Vector2(sunrise_pos1, daypos);
		sunrise_pts[i] = new THREE.Vector2(sunrise_pos2, daypos);

		// sunset
		var sunset = new Date(this._sunDataArr[i].sunset);
		var sunset_pos1 = _scaleTime(sunset);
		var sunset_pos2 = this._dayWidth / 2;

		sunset_pts[ii] = new THREE.Vector2(sunset_pos1, daypos);
		sunset_pts[i] = new THREE.Vector2(sunset_pos2, daypos);

		//console.log(postime1 + ", " + postime2);
	}

	var extrudeSettings = {
		amount: 500,
		steps: 200,
		bevelEnabled: false
	};

	var sunriseShape = new THREE.Shape(sunrise_pts);
	var sunsetShape = new THREE.Shape(sunset_pts);
	var geometry = new THREE.ExtrudeGeometry( [sunriseShape, sunsetShape], extrudeSettings );
	var material = new THREE.MeshBasicMaterial( {
		color: 0x000000,
		transparent: true,
		opacity: 0.5,
		depthTest: false,
		depthWrite: false,
		side: THREE.FrontSide } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.rotation.x = -Math.PI / 2;
	this._scene.add( mesh );

}

PowerView.prototype._drawWeatherByMonth = function()
{
	// shape
	var ptsClear = new Array();
	var ptsCloud = new Array();
	var ptsRain = new Array();
	var ptsSnow = new Array();

	for(var i = 0; i < this._dayList.length-1; i++) {

		// day position
		var daypos = this._dayLength * i;

		// time scale
		var date1 = this._dayList[i];
		var date2 = this._dayList[i+1];
		var _scaleTime = d3.time.scale()
			.domain([date1, date2])
			.rangeRound([-this._dayWidth / 2, this._dayWidth / 2]);

		var _tmpconds = "";
		var _tmppnts = new Array();
		for(var j = 0; j < this._weatherDataArr.length-1; j++) {

			var wdate1 = new Date(
				this._weatherDataArr[j].year,
				this._weatherDataArr[j].month-1,
				this._weatherDataArr[j].day,
				this._weatherDataArr[j].hour,
				this._weatherDataArr[j].minute,
				this._weatherDataArr[j].second
			);
			// 用于判断是否为当天最后一个值
			var wdate2 = new Date(
				this._weatherDataArr[j+1].year,
				this._weatherDataArr[j+1].month-1,
				this._weatherDataArr[j+1].day,
				this._weatherDataArr[j+1].hour,
				this._weatherDataArr[j+1].minute,
				this._weatherDataArr[j+1].second
			);

			if(wdate1 < date2 && wdate1 > date1) {

				var pos1 = _scaleTime(wdate1);
				//var pos2 = _scaleTime(wdate2);

				var lt = new THREE.Vector2(pos1, daypos + this._dayLength /2);
				var lb = new THREE.Vector2(pos1, daypos - this._dayLength / 2);
				//var rt = new THREE.Vector2(pos2, daypos + this._dayLength / 2);
				//var rb = new THREE.Vector2(pos2, daypos - this._dayLength / 2);

				if(this._rollupConds(this._weatherDataArr[j].conds) != _tmpconds) {

					if(_tmppnts.length == 0) {
						_tmppnts.push(lt);
						_tmppnts.push(lb);

						_tmpconds = this._rollupConds(this._weatherDataArr[j].conds);
					} else {
						_tmppnts.push(lb);
						_tmppnts.push(lt);

						if(_tmpconds.indexOf("CLEAR") != -1) {
							ptsClear.push(_tmppnts);
						} else if(_tmpconds.indexOf("CLOUDY") != -1) {
							ptsCloud.push(_tmppnts);
						} else if(_tmpconds.indexOf("RAIN") != -1) {
							ptsRain.push(_tmppnts);
						} else if(_tmpconds.indexOf("SNOW") != -1) {
							ptsSnow.push(_tmppnts);
						} else {
							console.log(_tmpconds);
						}

						_tmppnts = new Array();
						_tmppnts.push(lt);
						_tmppnts.push(lb);

						_tmpconds = this._rollupConds(this._weatherDataArr[j].conds);
					}

				} else {

					// 如何下一个日子是第二天了，就保存图形数组
					if(wdate2 > date2) {
						_tmppnts.push(lb);
						_tmppnts.push(lt);

						if(_tmpconds.indexOf("CLEAR") != -1) {
							ptsClear.push(_tmppnts);
						} else if(_tmpconds.indexOf("CLOUDY") != -1) {
							ptsCloud.push(_tmppnts);
						} else if(_tmpconds.indexOf("RAIN") != -1) {
							ptsRain.push(_tmppnts);
						} else if(_tmpconds.indexOf("SNOW") != -1) {
							ptsSnow.push(_tmppnts);
						} else {
							console.log(_tmpconds);
						}

					} else {
						if(_tmppnts.length == 0) {
							_tmppnts.push(lt);
							_tmppnts.push(lb);
						} else {
							_tmppnts.push(lb);
						}
					}
				}
			}
		}
	}

	// Draw Weather
	//this._drawWeatherBox(ptsClear, 0xd6aa95);
	//this._drawWeatherBox(ptsCloud, 0x4f5f64);
	//this._drawWeatherBox(ptsRain, 0x3d8db8);
	//this._drawWeatherBox(ptsSnow, 0xffffff);
}

PowerView.prototype._drawWeatherBox = function(pts, color)
{
	var extrudeSettings = {
		amount: 500,
		steps: 20,
		bevelEnabled: false
	};

	var shapes = new Array();
	for(var k = 0; k < pts.length; k++) {
		shapes.push(new THREE.Shape(pts[k]));
	}
	var geometry = new THREE.ExtrudeGeometry( shapes, extrudeSettings );
	var material = new THREE.MeshBasicMaterial( {
		color: color,
		transparent: true,
		opacity: 0.5,
		depthTest: false,
		depthWrite: false,
		side: THREE.FrontSide } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.rotation.x = -Math.PI / 2;
	this._scene.add( mesh );
}

PowerView.prototype._getSunTime = function(year, month, day)
{
	var obj = {};
	for(var i = 0; i < this._sunDataArr.length; i++) {
		var yy = parseInt(this._sunDataArr[i].year);
		var mm = parseInt(this._sunDataArr[i].month);
		var dd = parseInt(this._sunDataArr[i].day);

		if(yy == year && mm == month && dd == day) {
			obj.sunrise = new Date(this._sunDataArr[i].sunrise);
			obj.sunset = new Date(this._sunDataArr[i].sunset);

			break;
		}
	}

	return obj;
}

// --------------------------------------------------------------
//  将不同的气象描述词语归纳成四种状态：CLEAR, CLOUDY, SNOW, RAIN
// --------------------------------------------------------------
PowerView.prototype._rollupConds = function(conds)
{
	var newconds;
	if(conds.indexOf("Clear") != -1) {
		newconds = "CLEAR";
	} else if(conds.indexOf("Cloudy") != -1 ||
		conds.indexOf("Overcast") != -1 ||
		conds.indexOf("Clouds") != -1 ||
		conds.indexOf("Haze") != -1 ||
		conds.indexOf("Mist") != -1 ||
		conds.indexOf("Fog") != -1) {
		newconds = "CLOUDY";
	} else if(conds.indexOf("Rain") != -1) {
		newconds = "RAIN";
	} else if(conds.indexOf("Snow") != -1) {
		newconds = "SNOW";
	}

	return newconds;
}

PowerView.prototype._getMinTemperature = function(datset)
{
	var min = 10000;
	for(var i = 0; i < datset.length; i++) {
		if(datset[i].battery_temperature != "null") {
			var tvalue = parseFloat(datset[i].battery_temperature);
			if(tvalue < min) {
				min = tvalue;
			}
		}
	}

	return min;
}

PowerView.prototype._getMaxTemperature = function(datset)
{
	var max = -10000;
	for(var i = 0; i < datset.length; i++) {
		if(datset[i].battery_temperature != "null") {
			var tvalue = parseFloat(datset[i].battery_temperature);
			if(tvalue > max) {
				max = tvalue;
			}
		}
	}

	return max;
}