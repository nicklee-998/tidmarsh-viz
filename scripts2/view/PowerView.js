/**
 * Created by marian_mcpartland on 15/3/4.
 */

function PowerView(scene, scene2, scene3, camera, tooltipid)
{
	// ---------------------------
	//  Public Variables
	// ---------------------------
	this.minChargingCurrent = 0;
	this.maxChargingCurrent = 8;
	this.minRunningVoltage = 11;
	this.maxRunningVoltage = 15;

	// for Axis and Sunrise/Sunset
	this._axisCont = new THREE.Object3D();
	this._axisCont.name = "axis_container";
	this._axisCont.position.x = 0;
	this._axisCont.position.y = -560;
	this._axisCont.position.z = 510;
	scene.add(this._axisCont);

	// for Weather
	this._wCont = new THREE.Object3D();
	this._wCont.name = "weather_container";
	this._wCont.position.x = 0;
	this._wCont.position.y = -560;
	this._wCont.position.z = 510;
	scene2.add(this._wCont);

	// for Charging and Running
	this._crCont = new THREE.Object3D();
	this._crCont.name = "charging_container";
	this._crCont.position.x = 0;
	this._crCont.position.y = -560;
	this._crCont.position.z = 510;
	scene3.add(this._crCont);

	this._camera = camera;

	// style
	this._dayWidth = 2000;
	this._dayLength = 80;
	this._dayHeight = 500;

	// data buffer
	this._dayList;
	this._sunDataArr;
	this._weatherDataArr = null;

	this._ptsClear;
	this._ptsCloud;
	this._ptsRain;
	this._ptsSnow;
	this._ptsTemp;
	this._ptsVis;

	this._ptsCharging;
	this._ptsRunning;

	this._meshClear = null;
	this._meshCloud = null;
	this._meshRain = null;
	this._meshSnow = null;
	this._meshSunrise = null;
	this._meshVisibility = null;
	this._meshTemprature = null;
	this._meshCharging = null;
	this._meshRunning = null;

	// graph buffer
	this._charging_lines;
	this._running_lines;

	// 数据轴
	this._axisDateLines = null;
	this._axisTimeLines = null;

	// For interactive
	this._raycaster = new THREE.Raycaster();
	this._raycaster.linePrecision = 3;
	this._currentIntersected;

	this._sphereInter = new THREE.Mesh(
		new THREE.SphereGeometry( 30 ),
		new THREE.MeshBasicMaterial({
			color: 0xff0000,
			transparent: true,
			depthTest: false,
			depthWrite: false,
			opacity: 0.5
		})
	);
	this._sphereInter.visible = false;
	scene.add( this._sphereInter );

	// mouse tooltip
	this._tooltipid = tooltipid;

	// 气象颜色
	this._weatherColors = [0xd6aa95, 0x4f5f64, 0x3d8db8, 0xffffff];

	// 运行状态
	this._view_state = {
		year: 0,
		month: 0,
		type: "",
		weather: {
			sunrisesunset: 0,
			clear: 0,
			cloud: 0,
			rain: 0,
			snow: 0,
			visibility: 0,
			temprature: 0
		},
		view: "3d"      // 默认是3d视角
	};
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

PowerView.prototype.genMonthGraph = function(cobj)
{
	var suncsvfile = "./res/data_power/sunrise_sunset_" + cobj.year + "_" + cobj.month + ".csv";
	var weathercsvfile = "./res/data_power/weather_" + cobj.year + "_" + cobj.month + ".csv";
	var csvfile = "./res/data_power/tidbase4_" + cobj.year + "_" + cobj.month + ".csv";
	var self = this;

	// 后面时间设置为2，要不然list中会少最后一天
	this._dayList = d3.time.days(new Date(cobj.year, cobj.month-1, 1), new Date(cobj.year, cobj.month, 2));

	// Draw monthly charging & running graph
	if(cobj.year != this._view_state.year || cobj.month != this._view_state.month) {

		this._view_state.year = cobj.year;
		this._view_state.month = cobj.month;
		this._view_state.type = cobj.type;

		// clear
		this.dispose();

		// 坐标轴标尺
		this._axisDateLines = new Array();
		this._axisTimeLines = new Array();

		// loading sunrise & sunset csv
		d3.csv(suncsvfile, function(csv) {
			// save sunrise & sunset infomation
			self._sunDataArr = csv;
			self._meshSunrise = self._genSunriseSunsetByMonth();

			// 根据menu state，决定显示否
			if(cobj.weather.sunrisesunset) {
				self._animateIn(self._axisCont, self._meshSunrise);
			}
		});

		// If date if not the same, clear and redraw
		d3.csv(csvfile, function(csv) {

			if(csv.length == 0)
				return;

			// for line
			self._charging_lines = new Array();
			self._running_lines = new Array();
			// for box
			self._ptsCharging = new Array();
			self._ptsRunning = new Array();

			var date = new Date(csv[0].date);
			var curryear = date.getFullYear();
			var currmonth = date.getMonth();
			var currday = date.getDate();
			var arr = new Array();
			var dayidx = 0;
			for(var i = 0; i < csv.length; i++) {
				var obj = csv[i];
				date = new Date(obj.date);
				//console.log(date);

				if(i == (csv.length - 1)) {
					// 生成最后一根日线
					self._genDayLine(arr, dayidx, new Date(curryear, currmonth, currday));
				} else {
					if(currday == date.getDate()) {
						arr.push(obj);
					} else {
						// 生成日线
						self._genDayLine(arr, dayidx, new Date(curryear, currmonth, currday));

						arr = new Array();
						arr.push(obj);
						curryear = date.getFullYear();
						currmonth = date.getMonth();
						currday = date.getDate();
						dayidx++;

						// FOR DEBUG
						//if(dayidx == 3)
						//	break;
					}
				}
			}
			self._drawChargingRunningGraph(cobj.type);
		});

		// loading weather csv
		d3.csv(weathercsvfile, function(csv) {
			// save weather information
			self._weatherDataArr = csv;

			// 根据menu state，显示weather效果
			self._drawWeatherByMenu(cobj);
		});
	} else {

		// Charging & Running
		if(cobj.type != this._view_state.type) {
			this._view_state.type = cobj.type;
			this._drawChargingRunningGraph(cobj.type);
		}

		// Weather
		this._drawWeatherByMenu(cobj);
	}
}

PowerView.prototype.changeView = function(type)
{
	var self = this;
	if(type == "2D") {

		this._view_state.view = "2D";

		this._camera.fov = 1;
		this._camera.position.x = 0;
		this._camera.position.y = 174399.25413348092;
		this._camera.position.z = 0;
		this._camera.updateProjectionMatrix();

		//this._container.rotation.x = 1.1;
		//this._container.rotation.y = 0.3;
		//this._container.rotation.z = -0.5;

		this._axisCont.position.x = 440;
		this._axisCont.position.y = -570;
		this._axisCont.position.z = 1340;

		this._wCont.position.x = 440;
		this._wCont.position.y = -570;
		this._wCont.position.z = 1340;

		this._crCont.position.x = 440;
		this._crCont.position.y = -570;
		this._crCont.position.z = 1340;

		this._setAxisMarkerView();

		//TweenMax.from(this._container, 1, {opacity:0, ease:Quart.easeIn});
		//TweenMax.to(this._container.position, 1, {x:200, y:-580, z:1090, ease:Quart.easeIn, onComplete:function() {
		//
		//}});

	} else if(type == "3D") {

		this._view_state.view = "3D";

		this._camera.fov = 45;
		this._camera.position.x = 1668;
		this._camera.position.y = 1505;
		this._camera.position.z = 2496.9999999999995;
		this._camera.updateProjectionMatrix();

		//this._container.rotation.x = 1.1;
		//this._container.rotation.y = 0.3;
		//this._container.rotation.z = -0.5;

		this._axisCont.position.x = 200;
		this._axisCont.position.y = -560;
		this._axisCont.position.z = 510;

		this._wCont.position.x = 200;
		this._wCont.position.y = -560;
		this._wCont.position.z = 510;

		this._crCont.position.x = 200;
		this._crCont.position.y = -560;
		this._crCont.position.z = 510;

		this._setAxisMarkerView();
	}
}

PowerView.prototype.dispose = function()
{
	var obj, i;
	for ( i = this._axisCont.children.length - 1; i >= 0 ; i -- ) {
		obj = this._axisCont.children[ i ];
		this._axisCont.remove(obj);
		obj.geometry.dispose();
		obj.material.dispose();
	}
	for ( i = this._wCont.children.length - 1; i >= 0 ; i -- ) {
		obj = this._wCont.children[ i ];
		this._wCont.remove(obj);
		obj.geometry.dispose();
		obj.material.dispose();
	}
	for ( i = this._crCont.children.length - 1; i >= 0 ; i -- ) {
		obj = this._crCont.children[ i ];
		this._crCont.remove(obj);
		obj.geometry.dispose();
		obj.material.dispose();
	}

	this._meshClear = null;
	this._meshCloud = null;
	this._meshRain = null;
	this._meshSnow = null;
	this._meshSunrise = null;
	this._meshVisibility = null;
	this._meshTemprature = null;

	this._meshCharging = null;
	this._meshRunning = null;
}

PowerView.prototype.update = function(mouse)
{
	this._raycaster.setFromCamera( mouse, this._camera );
	var intersects;
	if(this._view_state.type == POWER_MENU_CHARGING) {
		intersects = this._raycaster.intersectObjects( this._charging_lines, true);
	} else {
		intersects = this._raycaster.intersectObjects( this._running_lines, true);
	}

	if ( intersects.length > 0 ) {

		if ( this._currentIntersected !== undefined ) {
			this._currentIntersected.material.linewidth = 5;
		}

		this._currentIntersected = intersects[ 0 ].object;
		this._currentIntersected.material.linewidth = 20;

		this._sphereInter.visible = true;
		this._sphereInter.position.copy( intersects[ 0 ].point );

		// Tooltip
		if(this._tooltipid != null) {

			var str;
			if(this._view_state.type == POWER_MENU_CHARGING) {
				// current scale
				var scalecurrent = d3.scale.linear()
					.domain([0, this._dayHeight])
					.range([this.minChargingCurrent, this.maxChargingCurrent]);
				str = scalecurrent(this._sphereInter.position.y - this._axisCont.position.y);
				str = str.toFixed(2) + "A";

			} else {
				// voltage scale
				var scalevoltage = d3.scale.linear()
					.domain([0, this._dayHeight])
					.range([this.minRunningVoltage, this.maxRunningVoltage]);
				str = scalevoltage(this._sphereInter.position.y - this._axisCont.position.y);
				str = str.toFixed(2) + "V";

			}

			$("#" + this._tooltipid).text(str);
			$("#" + this._tooltipid).css("visibility", "visible");
			$("#" + this._tooltipid).css("left", (mouse.x + 1) / 2 * window.innerWidth + 10);
			$("#" + this._tooltipid).css("top", (-(mouse.y - 1) / 2) * window.innerHeight - 30);
		}

	} else {

		if ( this._currentIntersected !== undefined ) {
			this._currentIntersected.material.linewidth = 5;
		}

		this._currentIntersected = undefined;
		this._sphereInter.visible = false;

		// Tooltip
		if(this._tooltipid != null) {
			$("#" + this._tooltipid).css("visibility", "hidden");
		}
	}
}

// ---------------------------------------------------
// --- PRIVATE METHOD --------------------------------
// ---------------------------------------------------

PowerView.prototype._drawWeatherByMenu = function(menu_state)
{
	if(menu_state.weather.sunrisesunset != this._view_state.weather.sunrisesunset) {
		if(menu_state.weather.sunrisesunset == 1) {
			this._animateIn(this._axisCont, this._meshSunrise);
		} else {
			this._animateOut(this._meshSunrise);
		}
		this._view_state.weather.sunrisesunset = menu_state.weather.sunrisesunset;
	}

	// Clear
	if(menu_state.weather.clear != this._view_state.weather.clear) {
		if(menu_state.weather.clear == 1) {
			if(this._meshClear == null) {
				this._meshClear = this._genWeatherByName("CLEAR", this._weatherColors[0]);
			}
			this._animateIn(this._wCont, this._meshClear);
		} else {
			this._animateOut(this._meshClear);
		}
		this._view_state.weather.clear = menu_state.weather.clear;
	}

	// Cloud
	if(menu_state.weather.cloud != this._view_state.weather.cloud) {
		if(menu_state.weather.cloud == 1) {
			if(this._meshCloud == null) {
				this._meshCloud = this._genWeatherByName("CLOUDY", this._weatherColors[1]);
			}
			this._animateIn(this._wCont, this._meshCloud);
		} else {
			this._animateOut(this._meshCloud);
		}
		this._view_state.weather.cloud = menu_state.weather.cloud;
	}

	// Rain
	if(menu_state.weather.rain != this._view_state.weather.rain) {
		if(menu_state.weather.rain == 1) {
			if(this._meshRain == null) {
				this._meshRain = this._genWeatherByName("RAIN", this._weatherColors[2]);
			}
			this._animateIn(this._wCont, this._meshRain);
		} else {
			this._animateOut(this._meshRain);
		}
		this._view_state.weather.rain = menu_state.weather.rain;
	}

	// Snow
	if(menu_state.weather.snow != this._view_state.weather.snow) {
		if(menu_state.weather.snow == 1) {
			if(this._meshSnow == null) {
				this._meshSnow = this._genWeatherByName("SNOW", this._weatherColors[3]);
			}
			this._animateIn(this._wCont, this._meshSnow);
		} else {
			this._animateOut(this._meshSnow);
		}
		this._view_state.weather.snow = menu_state.weather.snow;
	}

	// Visibility
	if(menu_state.weather.visibility != this._view_state.weather.visibility) {
		if(menu_state.weather.visibility == 1) {
			if(this._meshVisibility == null) {
				this._meshVisibility = this._genWeatherByName("visibility", this._weatherColors[4]);
			}
			this._animateIn(this._wCont, this._meshVisibility);
		} else {
			this._animateOut(this._meshVisibility);
		}
		this._view_state.weather.visibility = menu_state.weather.visibility;
	}

	// Temprature
	if(menu_state.weather.temprature != this._view_state.weather.temprature) {
		if(menu_state.weather.temprature == 1) {
			if(this._meshTemprature == null) {
				this._meshTemprature = this._genWeatherByName("temprature", this._weatherColors[5]);
			}
			this._animateIn(this._wCont, this._meshTemprature);
		} else {
			this._animateOut(this._meshTemprature);
		}
		this._view_state.weather.temprature = menu_state.weather.temprature;
	}
}

PowerView.prototype._genDayLine = function(datset, idx, date)
{
	//console.log(datset);

	// time scale
	var _scaleTime = d3.time.scale()
		.domain([new Date(datset[0].date), new Date(datset[datset.length-1].date)])
		.rangeRound([-this._dayWidth / 2, this._dayWidth / 2]);
	// current scale
	var _scaleCurrent = d3.scale.linear()
		.domain([this.minChargingCurrent, this.maxChargingCurrent])
		.range([0, this._dayHeight]);
	// voltage scale
	var _scaleVoltage = d3.scale.linear()
		.domain([this.minRunningVoltage, this.maxRunningVoltage])
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

	// Day position
	var posday = -this._dayLength * idx;

	// -------------------------
	//  Draw Axis
	// -------------------------
	this._drawDayBox(posday);
	this._drawAxisDateLine(posday, date);
	if(idx == 0) {
		this._drawAxisTime();
	}

	// -------------------------
	//  Draw Graph
	// -------------------------
	var _tmppnts1 = new Array();
	var _tmppnts2 = new Array();
	for(var i = 0; i < datset.length-1; i++) {

		var obj1 = datset[i];
		var obj2 = datset[i+1];

		// time
		var postime1 = _scaleTime(new Date(obj1.date));
		var postime2 = _scaleTime(new Date(obj2.date));

		if(obj1.battery_voltage != "null" && obj2.battery_voltage != "null") {

			// -------------------------
			//  For running line
			// -------------------------
			// voltage
			var posv1 = _scaleVoltage(obj1.battery_voltage);
			var posv2 = _scaleVoltage(obj2.battery_voltage);

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
			line.visible = false;
			this._crCont.add(line);
			this._running_lines.push(line);

			// -------------------------
			//  For running box
			// -------------------------
			var lt = new THREE.Vector2(postime1, (-posday) + this._dayLength / 2);
			var lb = new THREE.Vector2(postime1, (-posday) - this._dayLength / 2);

			if(_tmppnts1.length == 0) {
				_tmppnts1.push(lt);
				_tmppnts1.push(lb);
			} else {
				if(i == (datset.length - 2)) {
					_tmppnts1.push(lb);
					_tmppnts1.push(lt);
					this._ptsRunning.push({
						pos: _tmppnts1,
						value: obj1.battery_voltage
					});
				}
			}

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
				line1.visible = false;
				this._crCont.add(line1);
				this._charging_lines.push(line1);

				// -------------------------
				//  For charging box
				// -------------------------
				var lt = new THREE.Vector2(postime1, (-posday) + this._dayLength / 2);
				var lb = new THREE.Vector2(postime1, (-posday) - this._dayLength / 2);

				if(_tmppnts2.length == 0) {
					_tmppnts2.push(lt);
					_tmppnts2.push(lb);
				} else {
					if(i == (datset.length - 2)) {
						_tmppnts2.push(lb);
						_tmppnts2.push(lt);
						this._ptsCharging.push({
							pos: _tmppnts2,
							value: obj1.charge_current
						});
					}
				}
			} else {
				// -------------------------
				//  For charging box
				// -------------------------
				if(_tmppnts2.length > 0) {
					var lt = new THREE.Vector2(postime1, -posday + this._dayLength / 2);
					var lb = new THREE.Vector2(postime1, -posday - this._dayLength / 2);
					_tmppnts2.push(lb);
					_tmppnts2.push(lt);

					this._ptsCharging.push({
						pos: _tmppnts2,
						value: obj1.charge_current
					});
					_tmppnts2 = new Array();
				}
			}

		} else {

			// -------------------------
			//  For running box
			// -------------------------
			if(_tmppnts1.length > 0) {
				var lt = new THREE.Vector2(postime1, -posday + this._dayLength / 2);
				var lb = new THREE.Vector2(postime1, -posday - this._dayLength / 2);
				_tmppnts1.push(lb);
				_tmppnts1.push(lt);

				this._ptsRunning.push({
					pos: _tmppnts1,
					value: obj1.battery_voltage
				});
				_tmppnts1 = new Array();
			}


		}
	}
}

PowerView.prototype._genChargingRunningBox = function(type, color)
{
	var parr = new Array();
	var _pts = null;
	var scaleColor = null;
	var scaleHeight = null;
	var scaleOpacity = null;

	if(type == POWER_MENU_CHARGING) {
		_pts = this._ptsCharging;

	} else if(type == POWER_MENU_RUNNING) {
		_pts = this._ptsRunning;

	}

	for(var k = 0; k < _pts.length; k++) {

		var obj = _pts[k];
		var wid = obj.pos[3].x - obj.pos[0].x;
		var clr;
		if(scaleColor == null) {
			clr = color;
		} else {
			clr = scaleColor(obj.value);
		}
		var hei;
		if(scaleHeight == null) {
			hei = 0.1;
		} else {
			hei = scaleHeight(obj.value);
		}
		var opacity;
		if(scaleOpacity == null) {
			opacity = 0.3;
		} else {
			opacity = scaleOpacity(obj.value);
		}

		var p = new THREE.Mesh(
			new THREE.BoxGeometry(wid, this._dayLength, hei),
			new THREE.MeshBasicMaterial({
				color: clr,
				transparent: true,
				opacity: opacity,
				//depthTest: false,
				//depthWrite: false,
				side: THREE.FrontSide
			})
		);
		p.position.x = obj.pos[0].x + wid / 2;
		p.position.y = hei / 2;
		p.position.z = -obj.pos[0].y + this._dayLength / 2;
		p.rotation.x = -Math.PI / 2;

		parr.push(p);
	}

	return parr;
}

PowerView.prototype._drawChargingRunningGraph = function(type)
{
	if(type == POWER_MENU_CHARGING) {
		for(var i = 0; i < this._charging_lines.length; i++) {
			var line = this._charging_lines[i];
			line.visible = true;
		}
		for(var i = 0; i < this._running_lines.length; i++) {
			var line = this._running_lines[i];
			line.visible = false;
		}

		// show running box in background
		if(this._meshRunning == null) {
			this._meshRunning = this._genChargingRunningBox(POWER_MENU_RUNNING, 0xff0000);
		}
		this._animateIn(this._wCont, this._meshRunning);

		if(this._meshCharging != null) {
			this._animateOut(this._meshCharging);
		}

	} else {
		for(var i = 0; i < this._charging_lines.length; i++) {
			var line = this._charging_lines[i];
			line.visible = false;
		}
		for(var i = 0; i < this._running_lines.length; i++) {
			var line = this._running_lines[i];
			line.visible = true;
		}

		// show charging box in background
		if(this._meshCharging == null) {
			this._meshCharging = this._genChargingRunningBox(POWER_MENU_CHARGING, 0x00ff00);
		}
		this._animateIn(this._wCont, this._meshCharging);

		if(this._meshRunning != null) {
			this._animateOut(this._meshRunning);
		}
	}
}

// --------------------------------------------------
//  Draw Day box, 暂时没用
// --------------------------------------------------
PowerView.prototype._drawDayBox = function(posday)
{
	var daybox = new THREE.Mesh(
		new THREE.BoxGeometry(this._dayWidth, this._dayHeight, this._dayLength),
		new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0})
	);
	daybox.position.x = 0;
	daybox.position.y = this._dayHeight / 2;
	daybox.position.z = posday;
	this._crCont.add(daybox);
}

// --------------------------------------------------
//  Draw Axis Date Line
// --------------------------------------------------
PowerView.prototype._drawAxisDateLine = function(posday, date)
{
	// draw line
	var material = new THREE.LineBasicMaterial({
		linewidth: 1,
		color: 0xffffff,
		transparent: true,
		opacity: 0.2,
		depthTest: false,
		depthWrite: false,
		side: THREE.FrontSide
	});

	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		new THREE.Vector3(-this._dayWidth / 2, 0, posday),
		new THREE.Vector3(this._dayWidth / 2, 0, posday)
	);

	var line = new THREE.Line(geometry, material, THREE.LineStrip);
	this._axisCont.add(line);

	// draw date text
	var dstr = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate();
	var mesh = this._genTextMesh(dstr);
	mesh.position.x = this._dayWidth / 2 + 80;
	mesh.position.y = 18;
	mesh.position.z = posday - 20;
	this._axisCont.add(mesh);
	this._axisDateLines.push(mesh);
}

// --------------------------------------------------
//  Draw Axis Time - start, sunrise, sunset
// --------------------------------------------------
PowerView.prototype._drawAxisTime = function()
{
	var mesh1 = this._genTextMesh("12 AM");
	mesh1.position.x = -this._dayWidth / 2;
	mesh1.position.y = 18;
	mesh1.position.z = 70;
	this._axisCont.add(mesh1);
	this._axisTimeLines.push(mesh1);
}

PowerView.prototype._drawAxisSunriseSunsetTime = function(prise, pset)
{
	var meshr = this._genTextMesh("sunrise");
	meshr.position.x = prise;
	meshr.position.y = 18;
	meshr.position.z = 70;
	this._axisCont.add(meshr);
	this._axisTimeLines.push(meshr);

	var meshs = this._genTextMesh("sunset");
	meshs.position.x = pset;
	meshs.position.y = 18;
	meshs.position.z = 70;
	this._axisCont.add(meshs);
	this._axisTimeLines.push(meshs);
}

// --------------------------------------------------
//  Set Axis Marker View
// --------------------------------------------------
PowerView.prototype._setAxisMarkerView = function()
{
	if(this._view_state.view == "2D") {
		for(var i = 0; i < this._axisDateLines.length; i++) {
			var mesh = this._axisDateLines[i];
			mesh.rotation.x = -1.3;
			mesh.rotation.y = 0;
		}
		for(var j = 0; j < this._axisTimeLines.length; j++) {
			var mesh = this._axisTimeLines[j];
			mesh.rotation.x = -1.3;
			mesh.rotation.y = 0;
		}
		//console.log("view 2d " + this._axisTimeLines.length);

	} else {
		for(var i = 0; i < this._axisDateLines.length; i++) {
			var mesh = this._axisDateLines[i];
			mesh.rotation.x = 0;
			mesh.rotation.y = 0.5;
		}
		for(var j = 0; j < this._axisTimeLines.length; j++) {
			var mesh = this._axisTimeLines[j];
			mesh.rotation.x = 0;
			mesh.rotation.y = 0.5;
		}
		//console.log("view 3d " + this._axisTimeLines.length);

	}
}

// --------------------------------------------------
//  Draw Text
// --------------------------------------------------
PowerView.prototype._genTextMesh = function(str)
{
	var txtDate = document.createElement( "canvas" );
	txtDate.width = 150;
	txtDate.height = 60;
	var context = txtDate.getContext( "2d" );
	context.fillStyle = "white";
	context.font = "18pt arial";
	context.fillText( str, 25, 60 );

	var xm = new THREE.MeshBasicMaterial({
		map: new THREE.Texture(txtDate),
		transparent: true,
		side:THREE.DoubleSide
	});
	xm.map.needsUpdate = true;
	var txtMesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(150, 60), xm
	);

	return txtMesh;
}

//PowerView.prototype._drawSunriseSunset = function(year, month, day, posday, timescale)
//{
//	var boxcolor = 0x000000;
//	var boxopacity = 1;
//
//	var sundat = this._getSunTime(year, month, day);
//
//	var postime1 = timescale(sundat.sunrise);
//	var postime2 = timescale(sundat.sunset);
//
//	// sunrise box
//	var sunrisewid = postime1 - (-this._dayWidth / 2);
//	var sunrisebox = new THREE.Mesh(
//		new THREE.BoxGeometry(sunrisewid, this._dayHeight, this._dayLength, 10, 10, 10),
//		new THREE.MeshBasicMaterial({color: boxcolor, transparent: false, opacity: boxopacity})
//	);
//	sunrisebox.position.x = -this._dayWidth / 2 + sunrisewid / 2;
//	sunrisebox.position.y = this._dayHeight / 2;
//	sunrisebox.position.z = posday;
//	this._container.add(sunrisebox);
//
//	// sunset box
//	var sunsetwid = (this._dayWidth / 2) - postime2;
//	var sunsetbox = new THREE.Mesh(
//		new THREE.BoxGeometry(sunsetwid, this._dayHeight, this._dayLength, 10, 10, 10),
//		new THREE.MeshBasicMaterial({color: boxcolor, transparent: false, opacity: boxopacity})
//	);
//	sunsetbox.position.x = postime2 + sunsetwid / 2;
//	sunsetbox.position.y = this._dayHeight / 2;
//	sunsetbox.position.z = posday;
//	this._container.add(sunsetbox);
//}

PowerView.prototype._genSunriseSunsetByMonth = function()
{
	// draw sunrise and sunset graph
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

		// 为了延长两端的长度，达到一致的视觉效果
		if(i == 0) {
			sunrise_pts[ii] = new THREE.Vector2(sunrise_pos1, daypos - this._dayLength / 2);
			sunrise_pts[i] = new THREE.Vector2(sunrise_pos2, daypos - this._dayLength / 2);
		} else if(i == (this._sunDataArr.length - 1)) {
			sunrise_pts[ii] = new THREE.Vector2(sunrise_pos1, daypos + this._dayLength / 2);
			sunrise_pts[i] = new THREE.Vector2(sunrise_pos2, daypos + this._dayLength / 2);
		} else {
			sunrise_pts[ii] = new THREE.Vector2(sunrise_pos1, daypos);
			sunrise_pts[i] = new THREE.Vector2(sunrise_pos2, daypos);
		}

		// sunset
		var sunset = new Date(this._sunDataArr[i].sunset);
		var sunset_pos1 = _scaleTime(sunset);
		var sunset_pos2 = this._dayWidth / 2;

		if(i == 0) {
			sunset_pts[ii] = new THREE.Vector2(sunset_pos1, daypos - this._dayLength / 2);
			sunset_pts[i] = new THREE.Vector2(sunset_pos2, daypos - this._dayLength / 2);
		} else if(i == (this._sunDataArr.length - 1)) {
			sunset_pts[ii] = new THREE.Vector2(sunset_pos1, daypos + this._dayLength / 2);
			sunset_pts[i] = new THREE.Vector2(sunset_pos2, daypos + this._dayLength / 2);
		} else {
			sunset_pts[ii] = new THREE.Vector2(sunset_pos1, daypos);
			sunset_pts[i] = new THREE.Vector2(sunset_pos2, daypos);
		}

		// draw "sunrise" and "sunset" text, when first run
		if(i == 0) {
			this._drawAxisSunriseSunsetTime(sunrise_pos2, sunset_pos1);
		}

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
	mesh.name = "sunrisesunset";
	mesh.rotation.x = -Math.PI / 2;

	return mesh;
}

PowerView.prototype._genWeatherByName = function(wname, color)
{
	var _pts = new Array();

	for(var i = 0; i < this._dayList.length-1; i++) {

		// day position
		var daypos = this._dayLength * i;

		// time scale
		var date1 = this._dayList[i];
		var date2 = this._dayList[i+1];
		var _scaleTime = d3.time.scale()
			.domain([date1, date2])
			.rangeRound([-this._dayWidth / 2, this._dayWidth / 2]);

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

			if(wdate1 > date1 && wdate1 < date2) {

				if(wdate2 < date2) {
					// ------------------------------------------------------------------
					//  如果下一个时间在当天，一切正常
					// ------------------------------------------------------------------
					var pos1 = _scaleTime(wdate1);
					var pos2 = _scaleTime(wdate2);

					var lt = new THREE.Vector2(pos1, daypos + this._dayLength /2);
					var lb = new THREE.Vector2(pos1, daypos - this._dayLength / 2);
					var rt = new THREE.Vector2(pos2, daypos + this._dayLength / 2);
					var rb = new THREE.Vector2(pos2, daypos - this._dayLength / 2);

					if(wname == "temprature") {
						// for temperture
						_pts.push({
							pos: [lt, lb, rb, rt],
							value: this._weatherDataArr[j].temp
						});
					} else if(wname == "visibility") {
						// for vis
						_pts.push({
							pos: [lt, lb, rb, rt],
							value: this._weatherDataArr[j].vis
						});
					} else {
						// for conds
						var _tmpconds = this._rollupConds(this._weatherDataArr[j].conds);
						if(_tmpconds == wname) {

							_pts.push({
								pos: [lt, lb, rb, rt],
								value: this._weatherDataArr[j].precip
							});
						}
					}

				} else {

					// ------------------------------------------------------------------
					//  如果下一个时间超出了当天，图形上就要把加入当天剩下的，和第二天多的一点
					//  Fixme: 现在暂时没有处理
					// ------------------------------------------------------------------
				}
			}
		}
	}

	var parr = new Array();
	var scaleColor = null;
	var scaleHeight = null;
	var scaleOpacity = null;

	if(wname == "temprature") {

		var c1 = "hsl(0, 100%, 100%)";
		var c2 = "hsl(0, 100%, 50%)";
		scaleColor = d3.scale.sqrt()
			//.linear()
			.domain([-50, 30])
			.range([c1, c2])
			.interpolate(d3.interpolateHsl);

	} else if(wname == "visibility") {

		var c3 = "hsl(0, 0%, 50%)";
		var c4 = "hsl(0, 0%, 100%)";
		scaleColor = d3.scale.sqrt()
			//.linear()
			.domain([0, 17])
			.range([c3, c4])
			.interpolate(d3.interpolateHsl);
		scaleOpacity = d3.scale.linear()
			.domain([0, 17])
			.range([0.7, 0]);

	} else {

		scaleHeight = d3.scale.linear()
			.domain([0, 5])
			.range([0, this._dayHeight]);

	}

	for(var k = 0; k < _pts.length; k++) {

		var obj = _pts[k];
		var wid = obj.pos[3].x - obj.pos[0].x;
		var clr;
		if(scaleColor == null) {
			clr = color;
		} else {
			clr = scaleColor(obj.value);
		}
		var hei;
		if(scaleHeight == null) {
			hei = 0.1;
		} else {
			if(obj.value == -9999) {
				hei = 0.1;
			} else {
				hei = scaleHeight(obj.value);
			}
		}
		var opacity;
		if(scaleOpacity == null) {
			opacity = 0.6;
		} else {
			opacity = scaleOpacity(obj.value);
		}

		var p = new THREE.Mesh(
			new THREE.BoxGeometry(wid, this._dayLength, hei),
			new THREE.MeshBasicMaterial({
				color: clr,
				transparent: true,
				opacity: opacity,
				//depthTest: false,
				//depthWrite: false,
				side: THREE.FrontSide
			})
		);
		p.position.x = obj.pos[0].x + wid / 2;
		p.position.y = hei / 2 + 10;
		p.position.z = -obj.pos[0].y + this._dayLength / 2;
		p.rotation.x = -Math.PI / 2;

		parr.push(p);
	}

	return parr;
}

//PowerView.prototype._genWeatherByMonth = function()
//{
//	// shape
//	this._ptsClear = new Array();
//	this._ptsCloud = new Array();
//	this._ptsRain = new Array();
//	this._ptsSnow = new Array();
//	this._ptsTemp = new Array();
//	this._ptsVis = new Array();
//
//	for(var i = 0; i < this._dayList.length-1; i++) {
//
//		// day position
//		var daypos = this._dayLength * i;
//
//		// time scale
//		var date1 = this._dayList[i];
//		var date2 = this._dayList[i+1];
//		var _scaleTime = d3.time.scale()
//			.domain([date1, date2])
//			.rangeRound([-this._dayWidth / 2, this._dayWidth / 2]);
//
//		var _tmpconds = "";
//		var _tmppnts = new Array();
//		for(var j = 0; j < this._weatherDataArr.length-1; j++) {
//
//			var wdate1 = new Date(
//				this._weatherDataArr[j].year,
//				this._weatherDataArr[j].month-1,
//				this._weatherDataArr[j].day,
//				this._weatherDataArr[j].hour,
//				this._weatherDataArr[j].minute,
//				this._weatherDataArr[j].second
//			);
//			// 用于判断是否为当天最后一个值
//			var wdate2 = new Date(
//				this._weatherDataArr[j+1].year,
//				this._weatherDataArr[j+1].month-1,
//				this._weatherDataArr[j+1].day,
//				this._weatherDataArr[j+1].hour,
//				this._weatherDataArr[j+1].minute,
//				this._weatherDataArr[j+1].second
//			);
//
//			if(wdate1 > date1 && wdate1 < date2) {
//
//				if(wdate2 < date2) {
//					// ------------------------------------------------------------------
//					//  如果下一个时间在当天，一切正常
//					// ------------------------------------------------------------------
//					var pos1 = _scaleTime(wdate1);
//					var pos2 = _scaleTime(wdate2);
//
//					var lt = new THREE.Vector2(pos1, daypos + this._dayLength /2);
//					var lb = new THREE.Vector2(pos1, daypos - this._dayLength / 2);
//					var rt = new THREE.Vector2(pos2, daypos + this._dayLength / 2);
//					var rb = new THREE.Vector2(pos2, daypos - this._dayLength / 2);
//
//					// for temperture
//					this._ptsTemp.push({
//						pos: [lt, lb, rb, rt],
//						value: this._weatherDataArr[j].temp
//					});
//
//					// for vis
//					this._ptsVis.push({
//						pos: [lt, lb, rb, rt],
//						value: this._weatherDataArr[j].vis
//					});
//
//					// for conds
//					this._ptsClear.push({
//						pos: [lt, lb, rb, rt],
//						value: this._weatherDataArr[j].precip
//					});
//					this._ptsCloud.push({
//						pos: [lt, lb, rb, rt],
//						value: this._weatherDataArr[j].precip
//					});
//					this._ptsRain.push({
//						pos: [lt, lb, rb, rt],
//						value: this._weatherDataArr[j].precip
//					});
//					this._ptsSnow.push({
//						pos: [lt, lb, rb, rt],
//						value: this._weatherDataArr[j].precip
//					});
//
//
//					//if(this._rollupConds(this._weatherDataArr[j].conds) != _tmpconds ||
//					//	j == (this._weatherDataArr.length - 2)) {
//					//
//					//	if(_tmppnts.length == 0) {
//					//		_tmppnts.push(lt);
//					//		_tmppnts.push(lb);
//					//
//					//		_tmpconds = this._rollupConds(this._weatherDataArr[j].conds);
//					//	} else {
//					//		_tmppnts.push(lb);
//					//		_tmppnts.push(lt);
//					//
//					//		if(_tmpconds.indexOf("CLEAR") != -1) {
//					//			this._ptsClear.push(_tmppnts);
//					//		} else if(_tmpconds.indexOf("CLOUDY") != -1) {
//					//			this._ptsCloud.push(_tmppnts);
//					//		} else if(_tmpconds.indexOf("RAIN") != -1) {
//					//			this._ptsRain.push(_tmppnts);
//					//		} else if(_tmpconds.indexOf("SNOW") != -1) {
//					//			this._ptsSnow.push(_tmppnts);
//					//		} else {
//					//			console.log(_tmpconds);
//					//			break;
//					//		}
//					//
//					//		_tmppnts = new Array();
//					//		_tmppnts.push(lt);
//					//		_tmppnts.push(lb);
//					//
//					//		_tmpconds = this._rollupConds(this._weatherDataArr[j].conds);
//					//	}
//					//
//					//} else {
//					//	if(_tmppnts.length == 0) {
//					//		_tmppnts.push(lt);
//					//		_tmppnts.push(lb);
//					//	} else {
//					//		_tmppnts.push(lb);
//					//	}
//					//}
//
//				} else {
//
//					// ------------------------------------------------------------------
//					//  如果下一个时间超出了当天，图形上就要把加入当天剩下的，和第二天多的一点
//					//  Fixme: 现在暂时没有处理
//					// ------------------------------------------------------------------
//				}
//			}
//		}
//	}
//
//	var parr = new Array();
//	var c3 = "hsl(50, 100%, 100%)";
//	var c4 = "hsl(50, 100%, 50%)";
//	var scaleColor = d3.scale.sqrt()
//		//.linear()
//		.domain([-50, 30])
//		.range([c3, c4])
//		.interpolate(d3.interpolateHsl);
//	for(var k = 0; k < pts.length; k++) {
//		var obj = pts[k];
//		var wid = obj.pos[3].x - obj.pos[0].x;
//		var color = scaleColor(obj.value);
//		var p = new THREE.Mesh(
//			new THREE.PlaneBufferGeometry(wid, this._dayLength),
//			new THREE.MeshBasicMaterial({
//				color: color
//			})
//		);
//		p.position.x = obj.pos[0].x + wid / 2;
//		p.position.z = -obj.pos[0].y + this._dayLength / 2;
//		p.rotation.x = -Math.PI / 2;
//
//		parr.push(p);
//	}
//	return parr;
//}

//PowerView.prototype._clearWeather = function()
//{
//	this._animateOut(this._meshClear);
//	this._animateOut(this._meshCloud);
//	this._animateOut(this._meshRain);
//	this._animateOut(this._meshSnow);
//	this._animateOut(this._meshSunrise);
//}
//
//PowerView.prototype._drawWeatherBox = function(pts, color)
//{
//	var extrudeSettings = {
//		amount: 500,
//		steps: 20,
//		bevelEnabled: false
//	};
//
//	var shapes = new Array();
//	for(var k = 0; k < pts.length; k++) {
//		shapes.push(new THREE.Shape(pts[k]));
//	}
//	var geometry = new THREE.ExtrudeGeometry( shapes, extrudeSettings );
//	var material = new THREE.MeshBasicMaterial( {
//		color: color,
//		transparent: true,
//		opacity: 0.5,
//		depthTest: false,
//		depthWrite: false,
//		side: THREE.FrontSide } );
//	var mesh = new THREE.Mesh( geometry, material );
//	mesh.rotation.x = -Math.PI / 2;
//	this._animateIn(mesh);
//
//	return mesh;
//}

PowerView.prototype._genWeatherPlane = function(pts)
{
	var parr = new Array();
	var c3 = "hsl(50, 100%, 100%)";
	var c4 = "hsl(50, 100%, 50%)";
	var scaleColor = d3.scale.sqrt()
		//.linear()
		.domain([-50, 30])
		.range([c3, c4])
		.interpolate(d3.interpolateHsl);
	for(var k = 0; k < pts.length; k++) {
		var obj = pts[k];
		var wid = obj.pos[3].x - obj.pos[0].x;
		var color = scaleColor(obj.value);
		var p = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(wid, this._dayLength),
			new THREE.MeshBasicMaterial({
				color: color
			})
		);
		p.position.x = obj.pos[0].x + wid / 2;
		p.position.z = -obj.pos[0].y + this._dayLength / 2;
		p.rotation.x = -Math.PI / 2;

		parr.push(p);
	}
	return parr;
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
//  Animation
// --------------------------------------------------------------
PowerView.prototype._animateIn = function(cont, obj3d, time)
{
	time = typeof time !== 'undefined' ? time : 1.2;

	if(Object.prototype.toString.call( obj3d ) === '[object Array]') {

		for(var i = 0; i < obj3d.length; i++) {
			var obj = obj3d[i];
			obj.scale.z = 0.001;
			cont.add(obj);
			TweenMax.to(obj.scale, time, {z:1, ease:Expo.easeOut});
		}

	} else {
		if(obj3d.name == "sunrisesunset") {
			obj3d.material.opacity = 0.3;
			obj3d.scale.z = 0.001;
			cont.add(obj3d);
			TweenMax.to(obj3d.material, time, {opacity:0.5, ease:Expo.easeOut});

		} else {
			obj3d.scale.z = 0.001;
			cont.add(obj3d);
			TweenMax.to(obj3d.scale, time, {z:1, ease:Expo.easeOut});
			TweenMax.to(obj3d.material, time, {opacity:0.5, ease:Expo.easeOut});
		}
	}
}

PowerView.prototype._animateOut = function(obj3d, time)
{
	time = typeof time !== 'undefined' ? time : 1.2;

	if(Object.prototype.toString.call( obj3d ) === '[object Array]') {

		for(var i = 0; i < obj3d.length; i++) {
			var obj = obj3d[i];
			var parent = obj.parent;
			parent.remove(obj);
		}

	} else {
		var self = this;
		if(obj3d) {
			if(obj3d.name == "sunrisesunset") {
				TweenMax.to(obj3d.material, time, {opacity:0, ease:Expo.easeOut});
			} else {
				TweenMax.to(obj3d.material, time, {opacity:0, ease:Expo.easeOut});
				TweenMax.to(obj3d.scale, time, {z:0.001, ease:Expo.easeOut, onComplete:function() {
					var parent = obj3d.parent;
					parent.remove(obj3d);
				}});
			}
		}
	}
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
	} else {
		//console.log(conds);
		newconds = "UNKNOWN";
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