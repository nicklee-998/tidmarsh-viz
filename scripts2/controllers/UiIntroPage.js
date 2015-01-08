/**
 * Created by marian_mcpartland on 15/1/7.
 */
function UiIntroPage()
{
	$("#intro").append("<img id='intro_page' class='intro_page' src='./images/begin_intro.png'/>");
	$("#intro_page").onload = function() {
		console.log("feeweewe");
	};

	this.rearrange();
}

UiIntroPage.prototype.rearrange = function()
{
	//console.log($("#intro_page").width());
	var wid = $("#intro_page").width();
	var hei = wid * 577 / 1386;
	var whei = window.innerHeight - 115 - 20;
	$("#intro_page").css("top", whei / 2 - hei / 2 + 115);
	$("#intro_page").css("left", window.innerWidth / 2 - wid / 2);
}

UiIntroPage.prototype.showIntroPage = function()
{
	this.rearrange();
	var top = $("#intro_page").css("top");
	$("#intro_page").css("visibility", "visible");
	$("#intro_page").css("top", -300);
	$("#intro_page").animate({
		top: top
	}, 300);
}

UiIntroPage.prototype.hideIntroPage = function()
{
	if($("#intro_page").css("visibility") == "hidden")
		return;

	$("#intro_page").animate({
		top: -1000
	},700, function() {
		$(this).css("visibility", "hidden");
	});
}