/**
 * Created by marian_mcpartland on 14/12/16.
 */

function caculateHealthFromCSV(obj)
{
	var arr = new Array();
	var prop;

	// find rate of the day
	var rate = -999;
	for(prop in obj) {
		if(prop.indexOf("rate") != -1) {
			rate = parseInt(obj[prop]);
			break;
		}
	}

	// 如果没有当天的速率，直接health为0
	if(rate == -999) {
		return 0;
	}

	for(prop in obj) {
		if(prop.indexOf("sht_temperature") != -1 ||
			prop.indexOf("bmp_temperature") != -1 ||
			prop.indexOf("illuminance") != -1 ||
			prop.indexOf("bmp_pressure") != -1 ||
			prop.indexOf("sht_humidity") != -1 ||
			prop.indexOf("battery_voltage") != -1) {

			// 计算
			var val = parseInt(obj[prop]);
			if(val == -999) {
				continue;
			} else {
				var total_package = (24 * 60 * 60) / rate;
				var f = val / total_package;
				arr.push(f);
			}
			//console.log(prop + ", " + obj[prop]);
		}
	}

	// calculate total health
	var total = 0, index;
	for(index in arr) {
		total += arr[index];
	}
	var health = total / arr.length;

	return health;
}

function getRandomArbitrary(min, max)
{
	return Math.random() * (max - min) + min;
}

function getRandomInt(min, max)
{
	return Math.floor(Math.random() * (max - min)) + min;
}

function degToRad( deg )
{
	return (deg * ( Math.PI / 180));
}

function lineDistance( point1, point2 )
{
	var xs = 0;
	var ys = 0;

	xs = point2.x - point1.x;
	xs = xs * xs;

	ys = point2.y - point1.y;
	ys = ys * ys;

	return Math.sqrt( xs + ys );
}