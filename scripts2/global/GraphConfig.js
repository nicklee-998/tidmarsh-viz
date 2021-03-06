// JavaScript Document

/***********************************
 * Rollup unit
 ***********************************/
function rollupUnit(u)
{
	var nu = u;
	if(u == "percent")
		nu = "%";
	if(u == "celsius")
		nu = "°C";
	if(u == "volts")
		nu = "V";
		
	return nu;
}

/***********************************
 * Sensor Graph Config
 ***********************************/
function getConfigBySensor(sname)
{
	var tmin = 1;
	var tmax = 120;	// 120 = one month; 28 = one week 
	var config = {};
	switch(sname)
	{
		case "sht_temperature":
			config.sensor = "sht_temperature";
			config.title = "temperature";
			config.min = -40;
			config.max = 60;
			config.avg = 20;
			config.step = 10;
			config.hueL = 60;
			config.hueR = 10;
			config.saturationL = 80;
			config.saturationR = 100;
			config.lightnessL = 70;
			config.lightnessR = 30;
			config.unit = "°C";
			break;
		case "illuminance":
			config.sensor = "illuminance";
			config.title = "illuminance";
			config.min = 0;
			config.max = 60000;
			config.avg = 5000;
			config.step = 5000;
			config.hueL = 0;
			config.hueR = 0;
			config.saturationL = 50;
			config.saturationR = 82;
			config.lightnessL = 90;
			config.lightnessR = 33;
			config.unit = "lux";
			break;
		case "bmp_pressure":	// 气压
			config.sensor = "bmp_pressure";
			config.title = "pressure";
			config.min = 800;
			config.max = 1500;
			config.avg = 1000;
			config.step = 150;
			config.hueL = 312;
			config.hueR = 312;
			config.saturationL = 30;
			config.saturationR = 70;
			config.lightnessL = 30;
			config.lightnessR = 60;
			config.unit = "hPa";
			break;
		case "sht_humidity":	// 湿度
			config.sensor = "sht_humidity";
			config.title = "humidity";
			config.min = 0;
			config.max = 120;
			config.avg = 80;
			config.step = 20;
			config.hueL = 215;
			config.hueR = 233;
			config.saturationL = 43;
			config.saturationR = 92;
			config.lightnessL = 72;
			config.lightnessR = 40;
			config.unit = "%";
			break;
		case "battery_voltage":
			config.sensor = "battery_voltage";
			config.title = "voltage";
			config.min = 3;
			config.max = 8;
			config.avg = 5;
			config.step = 2;
			config.hueL = 120;
			config.hueR = 120;
			config.saturationL = 60;
			config.saturationR = 70;
			config.lightnessL = 60;
			config.lightnessR = 38;
			config.unit = "V";
			break;
		/*case "bmp_temperature":
			config.vobj = {v_min:0, v_max:120, step:30};
			config.sobj = {t_min:tmin, t_max:tmax, step:1}; 
			config.cobj = ["hsl(0, 0%, 97%)", "hsl(220, 70%, 30%)"];
			config.clr = ["hsl(220, 70%, 90%)", "hsl(220, 70%, 30%)"];
			config.unit = "°C";
			break;*/
		default:
			config = "undefined";
			break;
	}
	return config;
}