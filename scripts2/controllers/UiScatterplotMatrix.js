/**
 * Created by marian_mcpartland on 15/4/1.
 */
function UiScatterplotMatrix(cname)
{
	$("#" + cname).append("<div id='scatterplotmenu_container'></div>");

	$("#scatterplotmenu_container").append("<img id='scatterplotmenu_left' class='powermenu_left' src='./images/btn_left.png'/>");
	$("#scatterplotmenu_container").append("<img id='scatterplotmenu_right' class='powermenu_right' src='./images/btn_right.png'/>");
	$("#scatterplotmenu_container").append("<div id='scatterplotmenu_year'>2014</div>");
}