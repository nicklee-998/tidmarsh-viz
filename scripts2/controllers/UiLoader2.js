$(document).ready(function() {

	var l2Wid = 140;
	var l2Hei = 40;
	$("#ajax-load").css("left", window.innerWidth / 2 - l2Wid / 2);
	$("#ajax-load").css("top", window.innerHeight / 2 - l2Hei / 2);
	$("#ajax-load").css("visibility", "hidden");
	$(".ajax-load-cover").css("width", '100%');
	$(".ajax-load-cover").css("height", '100%');
	$(".ajax-load-cover").css("visibility", "hidden");

	$('#ajax-load .loading-bar').each(function(i) {
		var that = this;
		$(that).css("left", i * 10);
	});

	$(window).resize(function() {
		$("#ajax-load").css("left", window.innerWidth / 2 - l2Wid / 2);
		$("#ajax-load").css("top", window.innerHeight / 2 - l2Hei / 2);
	});
});

function loader2start()
{
	$(".ajax-load-cover").css("visibility", "visible");
	$(".ajax-load-cover").css("opacity", 0);
	$(".ajax-load-cover").animate({opacity: 1}, 300, 'swing');
	$("#ajax-load").css("visibility", "visible");
	$("#ajax-load").css("opacity", 0);
	$("#ajax-load").animate({opacity: 1}, 300, 'swing');

	var delay = 0;
	$('#ajax-load .loading-bar').each(function(i) {
		var that = this;
		$(that).css("height", 0);
		$(that).delay(delay).animate({ height: 31, opacity: .8 }, 200, 'swing', function() {
			$(that).animate({ height: 1, opacity: .2 }, 750, 'swing', function(){ openLoad(that); });
		});

		delay = delay + 150;
	});
}

function loader2progress(idx, total)
{
	var wid = (idx / total) * $(".loading-frame").width();
	$(".loading-text").css("width", wid);
	//$(".loading-text").animate({ width: wid }, 200);
}

function loader2end()
{
	$(".ajax-load-cover").animate({opacity: 0}, 300, 'swing', function() {
		$(".ajax-load-cover").css("visibility", "hidden");
	});
	$("#ajax-load").animate({opacity: 0}, 300, 'swing', function() {
		$("#ajax-load").css("visibility", "hidden");
	});

	$('#ajax-load .loading-bar').each(function(i) {
		var that = this;
		$(that).clearQueue();
		$(that).stop();
	});
}

function openLoad(obj) {
	$(obj).animate({ height: 31, opacity: .8 }, 200, 'swing', function(){ closeLoad(obj) });
}
function closeLoad(obj) {
	$(obj).animate({ height: 1, opacity: .2 }, 750, 'swing', function() { openLoad(obj); });
}