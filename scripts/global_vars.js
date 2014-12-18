// JavaScript Document

/***********************************
 * Custon Event
 ***********************************/
var GMAP_INIT = "gmap_init_done";
var GMAP_INIT_SHOW = "gmap_init_show";
var GMAP_VORONOI_INIT = 'gmap_voronoi_init';
var GMAP_CLICK = "gmap_mouse_click";
var GMAP_CIRCLE_CLICK = "gmap_circle_click";
var GMAP_ANIMATION_DONE = "gmap_animation_done";

var SERVER_SUMMARY = "server_summary"                           // 获得了server的summary
var SERVER_DEVICE_INIT = "server_device_init";			// 某个device初始化完毕
var SERVER_INIT = "server_init";				// 初始所有device完毕

var SERVER_LASTEST_DATA = "server_lastest_data";		// 获取最新的sensor数据

var SERVER_DEVICE_LIST_START = "server_device_list_start";	// device队列开始
var SERVER_DEVICE_LIST_COMPLETE = "server_device_list_complete";// device所有设备载入完成

var SERVER_DEVICE_DATA_START = "server_device_data_start";	// 开始获取某个deivce的sensor数据
var SERVER_DEVICE_DATA_LOADED = "server_device_data_loaded";	// 一个sensor block数据获取完毕(暂时无用)
var SERVER_DEVICE_DATA_COMPLETE = "server_device_data_complete";// 某个device的sensor数据获取完毕
var SERVER_DEVICE_DATA_ERROR = "server_device_data_error";	// 获取server上某个device数据错误，原因不明...

var GHOST_ANIM_COMPLETE = "ghost_anim_complete";

var RIVER_DRAW_COMPLETE = "river_draw_complete";
 
//var DEVICE_LIST_DONE = "device_list_loaded";
//var DEVICE_INFO_DONE = "device_info_loaded";
//var SENSOR_DATA_DONE = "sensor_data_done";			// 某个device的一个sensor的一个block的数据获取完毕
//var SENSOR_DATA_LIST_DONE = "sensor_data_list_done";		// 某个device的一个sensor指定数量的blocks数据获取完毕，形成列表
//var SENSOR_LIST_DONE = "sensor_list_done";			// 某个device指定所有sensor的blocks数据获取完毕

//var SHOW_DEVICE_ANIM_DONE = "show_device_anim_done";
//var HIDE_DEVICE_ANIM_DONE = "hide_device_anim_done";


/***********************************
 * Ghost state
 ***********************************/
var GHOST_STATE_SLEEP = 'SLEEP';
var GHOST_STATE_ACTIVE = 'ACTIVE';
var GHOST_STATE_WANDER = 'WANDER';
var GHOST_STATE_DISABLE = 'DISABLE';



var global_data_window = 300;


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
			config.min = -30;
			config.max = 50;
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
			config.min = 0;
			config.max = 30000;
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
			config.min = 800;
			config.max = 1200;
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
			config.min = 3;
			config.max = 8;
			config.avg = 5;
			config.step = 2;
			config.hueL = 145;
			config.hueR = 145;
			config.saturationL = 30;
			config.saturationR = 70;
			config.lightnessL = 85;
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