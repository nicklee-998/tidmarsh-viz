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

function chooseSliderDate()
{
	NewCal('info','mmddyyyy');
}

function onSelectDate()
{
	var exDateTime = document.getElementById('info').value;
	if (exDateTime != "")//Parse Date String
	{
		var Sp1;//Index of Date Separator 1
		var Sp2;//Index of Date Separator 2 
		var tSp1;//Index of Time Separator 1
		var tSp1;//Index of Time Separator 2
		var strMonth;
		var strDate;
		var strYear;
		var intMonth;
		var YearPattern;
		var strHour;
		var strMinute;
		var strSecond;
		//parse month
		Sp1=exDateTime.indexOf(DateSeparator,0)
		Sp2=exDateTime.indexOf(DateSeparator,(parseInt(Sp1)+1));
		
		strMonth=exDateTime.substring(0,Sp1);
		strDate=exDateTime.substring(Sp1+1,Sp2);
		if (isNaN(strMonth))
			intMonth=Cal.GetMonthIndex(strMonth);
		else
			intMonth=parseInt(strMonth,10)-1;	
		if ((parseInt(intMonth,10)>=0) && (parseInt(intMonth,10)<12))
			Cal.Month=intMonth;
		//end parse month
		//parse Date
		if ((parseInt(strDate,10)<=Cal.GetMonDays()) && (parseInt(strDate,10)>=1))
			Cal.Date=strDate;
		//end parse Date
		//parse year
		strYear=exDateTime.substring(Sp2+1,Sp2+5);
		YearPattern=/^\d{4}$/;
		if (YearPattern.test(strYear))
			Cal.Year=parseInt(strYear,10);
		//end parse year
		//parse time
		
		//console.log(strYear + ", " + strMonth + ", " + strDate);
		
		// UPDATE DATE RANGE
		sliderYear = parseInt(strYear);
		sliderMonth = parseInt(strMonth)-1;
		sliderDay = parseInt(strDate);
	
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