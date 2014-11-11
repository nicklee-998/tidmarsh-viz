// JavaScript Document
var bar, bar_line, slider, info, subday;
var sliderClick;
var sliderYear, sliderMonth, sliderDay;
var sliderStart, sliderEnd, sliderCurrent;	// Date
var sliderScale;
var _monthsTable = ["January", "February", "March", "April",
		    "May", "June", "July", "August", 
		    "September", "October", "November", "December"];

function initSliderBar()
{
	bar = document.getElementById('bar');
	bar_line = document.getElementById('bar_line');
	slider = document.getElementById('slider');
	info = document.getElementById('info');
	subday = document.getElementById('subday');
	
	var d = new Date();
	sliderYear = d.getFullYear();
	sliderMonth = d.getMonth();
	sliderDay = d.getDate();
	info.value = d.toDateString();
	
	sliderStart = new Date(sliderYear, sliderMonth, sliderDay, 0, 0, 0);
	sliderEnd = new Date(sliderYear, sliderMonth, sliderDay, 23, 59, 59);
	sliderScale = d3.scale.linear().domain([0, 1]).range([sliderStart.getTime(), sliderEnd.getTime()]);

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
		
		console.log(strYear + ", " + strMonth + ", " + strDate);
		
		// UPDATE DATE RANGE
		sliderYear = parseInt(strYear);
		sliderMonth = parseInt(strMonth)-1;
		sliderDay = parseInt(strDate);

		console.log(sliderYear + ", " + sliderMonth + ", " + sliderDay);
	
		sliderStart = new Date(sliderYear, sliderMonth, sliderDay, 0, 0, 0);
		sliderEnd = new Date(sliderYear, sliderMonth, sliderDay, 23, 59, 59);
		sliderScale = d3.scale.linear().domain([0, 1]).range([sliderStart.getTime(), sliderEnd.getTime()]);
		info.value = sliderStart.toDateString();
		
		getDevicesDataBySensorMenu();

		updateSliderInfo(bar.offsetLeft + bar_line.offsetLeft, 0);
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
	subday.innerHTML = sliderCurrent.toLocaleTimeString();
	subday.style.left = (mousex - bar.offsetLeft - 65) + 'px';
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

function percToDay(perc)
{
	var dayScale = d3.scale.linear().domain([0, 1]).range([1, 31]);
	var day = dayScale(perc).toFixed(0);
	var str = sliderYear + "." + sliderMonth + "." + day
	
	return str;
}