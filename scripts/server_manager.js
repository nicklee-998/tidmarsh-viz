// JavaScript Document
function ServerManager(url)
{
	// --------------------------
	// PUBLIC VARIABLES
	// --------------------------
	this.websiteUrl = url;
	this.devices;
	
	// --------------------------
	// PRIVATE VARIABLES
	// --------------------------
	this._loadIdx = 0;		// 队列载入序号
	this._loadEnd = 0;		// 队列载入结束位置(可选)
	this._loadIdx2 = 0;		// 用于嵌套载入队列(备用)
	this._loadEnd2 = 0;	
	this._loadIdx3 = 0;
	this._loadEnd3 = 0;	

	this._devicelist;
	this._sensorlist;
	this._start;
	this._end;
	this._expired = false;		// 队列是否已经超过制定日期
	this._multiDeviceMode = false;
	
	this._device;			// 需要载入sensor数据的device(载入时使用)
	this._sensor;			// 需要载入的sensor(载入时使用)
	
	this._dFactory = new DataFactory();	// 用于保存数据，对外不可见，用接口访问
}

//----------------------------------------------
// PUBLIC METHOD: 
// 	Get all new sensor data
//----------------------------------------------
ServerManager.prototype.getLastestData = function(did)
{
	var self = this;
	var url = "http://chain-api.media.mit.edu/sites/7/summary";
	
	$.getJSON(url, function(dat) {
		var devs = dat.devices;
		var sens = null;
		for(var i = 0; i < devs.length; i++) {
			if(devs[i].name == did) {
				sens = devs[i].sensors;
				
				// ------------------------
				// Send device init event
				// ------------------------	
				jQuery.publish(SERVER_LASTEST_DATA, {arr:sens});
				
				break;
			}
		}
	});
}

//----------------------------------------------
// PUBLIC METHOD: 
// 	Get all devices info
//----------------------------------------------
ServerManager.prototype.init = function()
{
	var self = this;
	
	$.getJSON(this.websiteUrl, function(dat) {
		self.devices = dat._links.items;

		// load all device info
		self._loadIdx = 0;
		self._getAllDeviceInfo();

		//console.log(self.devices);
	});
}

ServerManager.prototype._getAllDeviceInfo = function()
{
	if(this._loadIdx == this.devices.length) {
		// init complete
		jQuery.publish(SERVER_INIT);
		
		return;
	}
	
	var self = this;
	var device = this.devices[this._loadIdx];
	$.getJSON(device.href, function(dat) {
		device.building = dat.building;
		device.room = dat.room;
		device.floor = dat.floor;
		device.description = dat.description;
		if(dat.geoLocation) {
			device.lat = dat.geoLocation.latitude;
			device.lng = dat.geoLocation.longitude;
		} else {
			device.lat = 0;
			device.lng = 0;
		}
						
		$.getJSON(dat["_links"]["ch:sensors"]["href"], function(dat2) {
				
			var arr = [];
			for(var i = 0; i < dat2["_links"]["items"].length; i++)
			{
				var t = dat2["_links"]["items"][i].title;
				var h = dat2["_links"]["items"][i].href;
				
				// sensor object...
				arr.push({title:t, href:h, dataHistory:"", dataType:"", metric:"", unit:"", dataPrev:"", dataNext:"", loadFlag:false});
			}
			device.sensors = arr;
			
			// ------------------------
			// Send device init event
			// ------------------------	
			jQuery.publish(SERVER_DEVICE_INIT, device);
			
			// go on next device...
			self._loadIdx++;
			self._getAllDeviceInfo();
		});			
	});
}

//----------------------------------------------
// PUBLIC METHOD: 
// 	Get data from data factory
//	did -> device id (title)
//	sid -> sensor id (title)
//	date -> timestamp
//----------------------------------------------
ServerManager.prototype.fetchData = function(did, sid, date)
{
	var dat = this._dFactory.findData(did, sid, date);
	return dat;
}

ServerManager.prototype.fetchDataById = function(did, sid)
{
	var dats = this._dFactory.getDatas(did, sid);
	return dats;
}

//----------------------------------------------
// PUBLIC METHOD: 
// 	Get data from data factory by block
//	did -> device id (title)
//	sid -> sensor id (title)
//	perc -> percent of block array
//----------------------------------------------
/*ServerManager.prototype.fetchDataByBlock = function(did, sid, perc)
{
	var dat = this._dFactory.findData(did, sid, perc, "BLOCK");
	return dat;
}*/

//---------------------------------------------------------------------
// PUBLIC METHOD: 
// 	Get Multi Devices Sensor Data by Period
//	devices is array -> a list of device name which need get data
// 	sensors is array -> a list of sensor name which need get data
// 	start&end is object -> {year, month, day}
//---------------------------------------------------------------------
ServerManager.prototype.fetchMultiDevicesByDate = function(dlist, slist, start, end)
{
	// --------------------------------
	// Send device list start event
	// --------------------------------
	jQuery.publish(SERVER_DEVICE_LIST_START);
	
	this._devicelist = dlist;
	this._sensorlist = slist;
	this._start = new Date(start.year, start.month, start.day, start.hour, start.minu, start.sec);		// change to timestamp
	this._end = new Date(end.year, end.month, end.day, end.hour, end.minu, end.sec);			// change to timestamp
	this._multiDeviceMode = true;

	// restore data factory
	this._dFactory.restore();
	
	this._loadIdx3 = 0;
	this._startDeviceList();
}

ServerManager.prototype._startDeviceList = function()
{
	//if(this._loadIdx3 == this._devicelist.length)
	if(this._loadIdx3 == this._devicelist.length)
	{
		// -----------------------------------
		// Send device list complete event
		// -----------------------------------
		jQuery.publish(SERVER_DEVICE_LIST_COMPLETE);
			
		return;
	}
	
	var did = this._devicelist[this._loadIdx3];
	this.fetchDeviceDataByDate(did, this._sensorlist, this._start, this._end);
}

ServerManager.prototype._onDeviceComplete = function()
{
	console.log("device" + this._device.title + " is done");
	
	this._loadIdx3++;
	this._startDeviceList();
}


//---------------------------------------------------------------------
// PUBLIC METHOD: 
// 	Get Device Sensors Data by Period
// 	sensors is array -> a list of sensor name which need get data
// 	start&end is object -> {year, month, day}
//---------------------------------------------------------------------
ServerManager.prototype.fetchDeviceDataByDate = function(deviceid, sensors, start, end)
{
	this._device = this.getDeviceByName(deviceid);
	if(this._device != null) {
		// ------------------------
		// Send init event
		// ------------------------
		jQuery.publish(SERVER_DEVICE_DATA_START);
		
		// for sensor list
		this._loadIdx2 = 0;
		// set load flag of sensor
		for(var i = 0; i < this._device.sensors.length; i++) {
			var sobj = this._device.sensors[i];
			for(var j = 0; j < sensors.length; j++) {
				if(sensors[j] == sobj.title) {
					sobj.loadFlag = true;
					break;
				}
			}
		}
		
		this._startSensorsList();
	} else {
		// ------------------------
		// Send error event
		// ------------------------
		jQuery.publish(SERVER_DEVICE_DATA_ERROR);
	}
}

ServerManager.prototype._startSensorsList = function()
{
	if(this._loadIdx2 >= this._device.sensors.length) {
		// -------------------------------------
		// all sensors data complete
		// -------------------------------------
		jQuery.publish(SERVER_DEVICE_DATA_COMPLETE, this._device);
		
		// clear flag of sensors
		for(var i = 0; i < this._device.sensors.length; i++) {
			var sobj = this._device.sensors[i];
			sobj.loadFlag = false;
		}
		
		// 如果是直接用multi device接口，还要调用这个队列接口
		if(this._multiDeviceMode)
			this._onDeviceComplete();
			
		return;
	}
	
	//console.log("3. startMultiSensorDataChain: " + sensor_load_idx + ", " + sensor_sarr.length);
	var self = this;
	
	// find specific sensor
	this._sensor = this._device.sensors[this._loadIdx2];
	if(this._sensor.loadFlag) {
		$.getJSON(this._sensor.href, function(dat) {
			self._sensor.dataHistory = dat["_links"]["ch:dataHistory"]["href"];
			self._sensor.dataPrev = dat["_links"]["ch:dataHistory"]["href"];	// as start point
			self._sensor.dataType = self._rollupUnit(dat["unit"]);
			self._loadIdx = 0;	// just used for index only...
			self._expired = false;
	
			self._startSensorDataChain();
		});
	} else {
		// go on next sensor...
		this._loadIdx2++;
		this._startSensorsList();
	}
}

ServerManager.prototype._startSensorDataChain = function() 
{
	if(this._expired) {
		// go on next sensor...
		this._loadIdx2++;
		this._startSensorsList();
		
		return;
	}
	
	//console.log("4. startSensorDataChain2: " + this._loadIdx);
	var self = this;
	
	// a hacker way, not offical method to get date...
	var ststr = (this._start.getTime() - this._start.getTimezoneOffset() * 60000).toString();
	var edstr = (this._end.getTime() - this._end.getTimezoneOffset() * 60000).toString();
	ststr = ststr.substr(0, 10);
	edstr = edstr.substr(0, 10);
	var url = this._sensor.dataHistory + '&timestamp__gte=' + ststr + '&timestamp__lt=' + edstr;
	
	$.getJSON(url, function(dat) {
		for(var i = dat["data"].length-1; i >= 0; i--) {
			self._dFactory.addData(self._device.title, self._sensor.title, dat["data"][i]);
		}
	
		self._sensor.dataPrev = dat["_links"]["previous"]["href"];
		self._loadIdx++;
		self._expired = true;
		self._startSensorDataChain();
	});
}

/*****************************************
 * Rollup Data
 *****************************************/
ServerManager.prototype._rollupData = function(rawdata, type)
{
	//console.log(rawdata);
	// 目前默认平均值

	// 计算每个block的平均值
	var avg = 0;
	var sum = 0;
	for(var i = 0; i < rawdata.length; i++)
	{
   		sum += rawdata[i].value;
	}
	if(rawdata.length > 0)
		avg = sum / rawdata.length;
		
	return avg;
}

ServerManager.prototype._rollupUnit = function(u)
{
	var nu = u;
	if(u == "percent")
		nu = "%";
	if(u == "celsius")
		nu = "°C";
		
	return nu;
}

/*****************************************
 * search device
 *****************************************/
ServerManager.prototype.getDeviceByName = function(dname)
{
	var device = null;
	for(d in this.devices)
	{
		//console.log(deviceList[d].title + ", " + dname);
		if(this.devices[d].title == dname)
		{
			device = this.devices[d];
			break;
		}
	}
	return device;
}

ServerManager.prototype.getDeviceBySensor = function(sensor_url)
{
	var device = null;
	for(var i = 0; i < this.devices.length; i++) {
		var arr = this.devices[i].sensors;
		if(arr != null) {
			device = this.devices[i];
			for(var j = 0; j < arr.length; j++) {
				if(arr[j].href == sensor_url) {
					var sobj = getConfigBySensor(arr[j].title);
					return {did:device.title, sid:arr[j].title, unit:sobj.unit};
				}
			}
		}
	}
	return null;
}