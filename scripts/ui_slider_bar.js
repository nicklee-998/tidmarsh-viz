// JavaScript Document
var bar, bar_line, slider, slider_curr_date, slider_left_frame, slider_right_frame, slider_left_date, slider_right_date;
var sliderClick;
var sliderYear, sliderMonth, sliderDay;
var sliderStart, sliderEnd, sliderCurrent;	// Date
var sliderScale;

function initSliderBar()
{
	bar = document.getElementById('bar');
	bar_line = document.getElementById('bar_line');
	slider = document.getElementById('slider');
	slider_curr_date = document.getElementById('slider_date');
	slider_right_date = document.getElementById('slider_right_date');
	slider_left_frame = document.getElementById('slider_left_frame');
	slider_right_frame = document.getElementById('slider_right_frame');

	var d = new Date();
	sliderYear = d.getFullYear();
	sliderMonth = d.getMonth();
	sliderDay = d.getDate();
	slider_curr_date.value = d.toDateString();
	
	sliderStart = new Date(sliderYear, sliderMonth, sliderDay, 0, 0, 0);
	sliderEnd = new Date(sliderYear, sliderMonth, sliderDay, 23, 59, 59);
	sliderScale = d3.scale.linear().domain([0, 1]).range([sliderStart.getTime(), sliderEnd.getTime()]);

	// draw UI
	var barHeight = 30;
	var barLineWidth = 800;
	var endsWidth = 70;
	var barWidth = endsWidth + 10 + barLineWidth + 10 + endsWidth + 10;

	var strLeft = sliderYear + "/" + (sliderMonth + 1) + "/" + sliderDay + "\n" + "12 AM";
	$("#slider_left_frame").text(strLeft);
	$("#slider_left_frame").css('width', endsWidth);
	$("#slider_left_frame").css('height', barHeight);
	$("#slider_left_frame").css('top', 0);
	$("#slider_left_frame").css('left', 0);

	$("#bar_line").css('width', barLineWidth);
	$("#bar_line").css('height', barHeight);
	$("#bar_line").css('top', -1);
	$("#bar_line").css('left', endsWidth + 10);

	var nextday = new Date();
	nextday.setHours(nextday.getHours() + 24);
	var strRight = nextday.getFullYear() + "/" + (nextday.getMonth() + 1) + "/" + nextday.getDate() + "\n" + "12 AM";
	$("#slider_right_frame").text(strRight);
	$("#slider_right_frame").css('width', endsWidth);
	$("#slider_right_frame").css('height', barHeight);
	$("#slider_right_frame").css('top', 0);
	$("#slider_right_frame").css('left', endsWidth + 10 + barLineWidth + 10);

	$("#bar").css('width', barWidth);

	updateSliderInfo(bar.offsetLeft + bar_line.offsetLeft, 0);
		
	slider.addEventListener('mousedown', startSlide, false);
}

function onSelectDate(date)
{
	console.log(date.toString());
	var exDateTime = date.toString();
	if (exDateTime != "")//Parse Date String
	{
		var strMonth;
		var strDate;
		var strYear;

		//parse date
		strYear = exDateTime.substring(6, 10);
		strMonth = exDateTime.substring(0, 2);
		strDate = exDateTime.substring(3, 5);
		
		//console.log(strYear + ", " + strMonth + ", " + strDate);
		
		// UPDATE DATE RANGE
		sliderYear = parseInt(strYear);
		sliderMonth = parseInt(strMonth)-1;
		sliderDay = parseInt(strDate);

		//console.log(sliderYear + ", " + sliderMonth + ", " + sliderDay);
	
		sliderStart = new Date(sliderYear, sliderMonth, sliderDay, 0, 0, 0);
		sliderEnd = new Date(sliderYear, sliderMonth, sliderDay, 23, 59, 59);
		sliderScale = d3.scale.linear().domain([0, 1]).range([sliderStart.getTime(), sliderEnd.getTime()]);

		var strLeft = sliderYear + "/" + (sliderMonth + 1) + "/" + sliderDay + "\n" + "12 AM";
		$("#slider_left_frame").text(strLeft);
		var nextday = new Date(sliderYear, sliderMonth, sliderDay, 0, 0, 0);
		nextday.setHours(nextday.getHours() + 24);
		var strRight = nextday.getFullYear() + "/" + (nextday.getMonth() + 1) + "/" + nextday.getDate() + "\n" + "12 AM";
		$("#slider_right_frame").text(strRight);
		
		getDevicesDataBySensorMenu();

		//updateSliderInfo(bar.offsetLeft + bar_line.offsetLeft, 0);
	}
}

function startSlide(event)
{
	sliderClick = true;
	
	var set_perc = ((((event.clientX - bar.offsetLeft - bar_line.offsetLeft) / bar_line.offsetWidth)));	
	
	if(set_perc >= 0 && set_perc <= 1) {
		document.body.addEventListener('mousemove', moveSlide, false);
		document.body.addEventListener('mouseup', stopSlide, false);
		
		updateSliderInfo(event.clientX, set_perc);
	}	
}
 
function moveSlide(event)
{
	if(!sliderClick)
		return;
		
	var set_perc = ((((event.clientX - bar.offsetLeft - bar_line.offsetLeft) / bar_line.offsetWidth)));

	if(set_perc >= 0 && set_perc <= 1) {
		updateSliderInfo(event.clientX, set_perc);
		updateVGraphBySlider();
	} else if(set_perc < 0) {
		updateSliderInfo(bar.offsetLeft + bar_line.offsetLeft, 0);
	} else {
		updateSliderInfo(bar.offsetLeft + bar_line.offsetLeft + bar_line.offsetWidth, 1);
	}
}
 
function stopSlide(event)
{
	if(!sliderClick)
		return;
	sliderClick = false;

	var set_perc = ((((event.clientX - bar.offsetLeft - bar_line.offsetLeft) / bar_line.offsetWidth)));
	document.body.removeEventListener('mousemove', moveSlide, false);
	document.body.removeEventListener('mouseup', stopSlide, false);
	if(set_perc >= 0 && set_perc <= 1) {
		updateSliderInfo(event.clientX, set_perc);
	}
}

function updateSliderInfo(mousex, perc)
{
	sliderCurrent = new Date(sliderScale(perc));
	slider.style.left = (mousex - bar.offsetLeft - 9) + 'px';
	var cstr = sliderCurrent.getHours() + ":" + sliderCurrent.getMinutes() + ":" + sliderCurrent.getSeconds();
	slider_curr_date.value = cstr;
	slider_curr_date.style.left = (mousex - bar.offsetLeft - 65) + 'px';
}

function updateVGraphBySlider()
{
	var arr = new Array();
	for(var i = 0; i < sManager.devices.length; i++)
	{
		var dat = sManager.fetchData(sManager.devices[i].title, selectSensor, sliderCurrent);
		if(dat != null) {
			var obj = {did:dat.did, sid:dat.sid, property:"color", value:dat.value};
			arr.push(obj);
		}
	}
	gMap.updateVGraph(arr);
}