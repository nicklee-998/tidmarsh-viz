/**
 * Created by marian_mcpartland on 15/1/30.
 */
function UiHealthMenu()
{
	this._healthTipTop = $("#health_tip").css("top");

	$("#health_tip").css("left", window.innerWidth / 2 - $("#health_tip").width() / 2);

	$(window).resize(function() {
		$("#health_tip").css("left", window.innerWidth / 2 - $("#health_tip").width() / 2);
	});

}

UiHealthMenu.prototype.showMe = function()
{
	$("#health_tip").css('visibility', 'visible');
	$("#health_tip").css('top', '-80px');
	$("#health_tip").animate({top:this._healthTipTop}, 500, 'easeOutQuint');
}

UiHealthMenu.prototype.hideMe = function()
{
	$("#health_tip").animate({top:'-80px'}, 500, 'easeOutQuint', function() {
		$("#health_tip").css('visibility', 'hidden');
	});

	//$("#health_tip").css("visibility", "hidden");
	$("#health_sensor").css("visibility", "hidden");
}