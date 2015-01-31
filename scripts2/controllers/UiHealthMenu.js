/**
 * Created by marian_mcpartland on 15/1/30.
 */
function UiHealthMenu()
{
	$("#health_tip").css("left", window.innerWidth / 2 - $("#health_tip").width() / 2);

	$(window).resize(function() {
		$("#health_tip").css("left", window.innerWidth / 2 - $("#health_tip").width() / 2);
	});

}

UiHealthMenu.prototype.showMe = function()
{
	$("#health_tip").css("visibility", "visible");
}

UiHealthMenu.prototype.hideMe = function()
{
	$("#health_tip").css("visibility", "hidden");
}