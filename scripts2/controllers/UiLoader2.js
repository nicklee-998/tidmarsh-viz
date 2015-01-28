$(document).ready(function() {

	$("#ajax-load").css("left", window.innerWidth / 2 - 140 / 2);
	$("#ajax-load").css("top", window.innerHeight / 2 - 40 / 2);
	$("#ajax-load").css("visibility", "hidden");

	$('#ajax-load .loading-bar').each(function(i) {
		var that = this;
		$(that).css("left", i * 10);
	});
});

function loader2start()
{
	$(".ajax-load-cover").css("width", window.innerWidth);
	$(".ajax-load-cover").css("height", window.innerHeight);
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