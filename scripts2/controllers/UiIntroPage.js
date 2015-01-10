/**
 * Created by marian_mcpartland on 15/1/7.
 */
function UiIntroPage()
{
	$("#intro").append("<img id='intro_page' class='intro_page' src='./images/begin_intro.png'/>");
	$("#intro").css("visibility", "hidden");
	this.rearrange();
}

UiIntroPage.prototype.rearrange = function()
{
	//console.log($("#intro_page").width());
	var wid = $("#intro_page").width();
	var hei = wid * 577 / 1386;
	var whei = window.innerHeight - 115 - 20;
	$("#intro_page").css("top", whei / 2 - hei / 2 + 70);
	$("#intro_page").css("left", window.innerWidth / 2 - wid / 2);
}

UiIntroPage.prototype.showIntroPage = function(delay)
{
	delay = typeof delay !== 'undefined' ? delay : 0;

	this.rearrange();
	$("#intro").css("visibility", "visible");

	var top = $("#intro_page").css("top");
	$("#intro_page").css("top", -500);
	$("#intro_page").delay(delay).animate({
		top: top
	}, 500, "easeOutExpo");
}

UiIntroPage.prototype.hideIntroPage = function()
{
	if($("#intro").css("visibility") == "hidden")
		return;

	$("#intro_page").animate({
		top: -1000
	}, 700, function() {
		$("#intro").css("visibility", "hidden");
	});
}