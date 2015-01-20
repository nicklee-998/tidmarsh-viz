/**
 * Created by marian_mcpartland on 14/12/15.
 */


/***********************************
 * 3D SCENE EVENT
 ***********************************/
var DEVICE_MODEL_LOADED = "device_model_loaded";

/***********************************
 * GOOGLE MAP Event
 ***********************************/
var GMAP_INIT = "gmap_init_done";

/***********************************
 * Network Event
 ***********************************/
var NETWORK_HEALTH_NODE = "network_health_node_click";

/***********************************
 * Chain API Event
 ***********************************/
var SERVER_SUMMARY_COMPLETE = "server_summary_loaded";          // 获得了server的summary
var SERVER_DEVICE_INFO_COMPLETE = "server_device_complete";	// 某个device信息完毕
var SERVER_INIT_COMPLETE = "server_init";			// 初始所有device完毕

var SERVER_LASTEST_DATA = "server_lastest_data";		// 获取最新的sensor数据

var SERVER_DEVICE_LIST_START = "server_device_list_start";	// device队列开始
var SERVER_DEVICE_LIST_COMPLETE = "server_device_list_complete";// device所有设备载入完成

var SERVER_DEVICE_DATA_START = "server_device_data_start";	// 开始获取某个deivce的sensor数据
var SERVER_DEVICE_DATA_LOADED = "server_device_data_loaded";	// 一个sensor block数据获取完毕(暂时无用)
var SERVER_DEVICE_DATA_COMPLETE = "server_device_data_complete";// 某个device的sensor数据获取完毕
var SERVER_DEVICE_DATA_ERROR = "server_device_data_error";	// 获取server上某个device数据错误，原因不明...

/***********************************
 * MAIN MENU EVENT
 ***********************************/
var MAINMENU_BEGIN = "main_menu_begin";
var MAINMENU_NETWORK = "main_menu_network";
var MAINMENU_DATA = "main_menu_data";
var MAINMENU_DEVICE = "main_menu_device";

var MAINMENU_DATA_TEMPRATURE = "main_menu_data_temprature";
var MAINMENU_DATA_ILLUMINANCE = "main_menu_data_illminance";
var MAINMENU_DATA_PRESSURE = "main_menu_data_pressure";
var MAINMENU_DATA_HUMIDITY = "main_menu_data_humidity";
var MAINMENU_DATA_VOLTAGE = "main_menu_data_voltage";

var MAINMENU_REALTIME = "main_menu_realtime";
var MAINMENU_HISTORY = "main_menu_history";