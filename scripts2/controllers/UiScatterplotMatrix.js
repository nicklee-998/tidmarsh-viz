/**
 * Created by marian_mcpartland on 15/4/1.
 */
function UiScatterplotMatrix(cname)
{
	this._start;    // start date
	this._end;      // end date
	this._selectedDate;     // 0:start, 1:end

	$("#" + cname).append("<div id='scatterplotmenu_container'></div>");

	//$("#scatterplotmenu_container").append("<img id='scatterplotmenu_left' class='scattermenu_btn' src='./images/btn_left.png'/>");
	//$("#scatterplotmenu_container").append("<img id='scatterplotmenu_right' class='scattermenu_btn' src='./images/btn_right.png'/>");
	//$("#scatterplotmenu_container").append("<div id='scatterplotmenu_year'>2014</div>");

	$("#scatterplotmenu_container").append("<img id='scatterplotmenu_prev' class='scattermenu_btn' src='./images/btn_left.png'/>");
	$("#scatterplotmenu_container").append("<img id='scatterplotmenu_next' class='scattermenu_btn' src='./images/btn_right.png'/>");
	$("#scatterplotmenu_container").append("<img id='scatterplotmenu_prev2' class='scattermenu_btn' src='./images/btn_left.png'/>");
	$("#scatterplotmenu_container").append("<img id='scatterplotmenu_next2' class='scattermenu_btn' src='./images/btn_right.png'/>");
	$("#scatterplotmenu_container").append("<div id='scatterplotmenu_start' class='scattermenu_date'>2014.11.15</div>");
	$("#scatterplotmenu_container").append("<div id='scatterplotmenu_end' class='scattermenu_date'>2014.12.15</div>");
	$("#scatterplotmenu_container").append("<div id='scatterplotmenu_middel' class='scattermenu_date'> - </div>");

	// Select Date
	$("#scatterplotmenu_prev").click(function() {
		jQuery.publish(SCATTER_PLOT_PREV);
	});
	$("#scatterplotmenu_next").click(function() {
		jQuery.publish(SCATTER_PLOT_NEXT);
	});
	$("#scatterplotmenu_prev2").click(function() {
		jQuery.publish(SCATTER_PLOT_PREV_FAST);
	});
	$("#scatterplotmenu_next2").click(function() {
		jQuery.publish(SCATTER_PLOT_NEXT_FAST);
	});

	// -----------------------
	//  DATE PICKER
	// -----------------------
	$("#" + cname).append("<div id='datepicker_scatterplot'></div>");
	$("#datepicker_scatterplot").datepicker({
		inline: true,
		showOtherMonths: true,
		dayNamesMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		onSelect: function(date) {
			$("#datepicker_scatterplot").css("visibility", "hidden");

			var exDateTime = date.toString();

			//parse date
			var strYear = exDateTime.substring(6, 10);
			var strMonth = exDateTime.substring(0, 2);
			var strDate = exDateTime.substring(3, 5);

			var year = parseInt(strYear);
			var month = parseInt(strMonth)-1;
			var day = parseInt(strDate);

			if(self._selectedDate == 0) {
				self._start = new Date(year, month, day);
			} else {
				self._end = new Date(year, month, day);
			}

			self.resetDate(self._start, self._end);

			jQuery.publish(SCATTER_PLOT_DATE_SELECTED, {start:self._start, end:self._end});
		}
	});
	$("#datepicker_scatterplot").css("visibility", "hidden");

	$("#scatterplotmenu_start").click(function() {
		if($("#datepicker_scatterplot").css("visibility") == "visible" && self._selectedDate == 0) {
			$("#datepicker_scatterplot").css("visibility", "hidden");
		} else {
			$("#datepicker_scatterplot").css("visibility", "visible");
			$("#datepicker_scatterplot").datepicker(
				"setDate",
				(self._start.getMonth()+1) + "/" + self._start.getDate() + "/" + self._start.getFullYear()
			);

			var top = $("#scatterplotmenu_start").css("top");
			top = top.substring(0, top.indexOf("px"));
			var left = $("#scatterplotmenu_start").css("left");
			left = left.substring(0, left.indexOf("px"));
			$("#datepicker_scatterplot").css("top", parseInt(top) + 50);
			$("#datepicker_scatterplot").css("left", parseInt(left) - 20);
			self._selectedDate = 0;
		}
	});
	$("#scatterplotmenu_end").click(function() {
		if($("#datepicker_scatterplot").css("visibility") == "visible" && self._selectedDate == 1) {
			$("#datepicker_scatterplot").css("visibility", "hidden");
		} else {
			$("#datepicker_scatterplot").css("visibility", "visible");
			$("#datepicker_scatterplot").datepicker(
				"setDate",
				(self._end.getMonth()+1) + "/" + self._end.getDate() + "/" + self._end.getFullYear()
			);

			var top = $("#scatterplotmenu_end").css("top");
			top = top.substring(0, top.indexOf("px"));
			var left = $("#scatterplotmenu_end").css("left");
			left = left.substring(0, left.indexOf("px"));
			$("#datepicker_scatterplot").css("top", parseInt(top) + 50);
			$("#datepicker_scatterplot").css("left", parseInt(left) - 20);
			self._selectedDate = 1;
		}
	});

	var self = this;

	// hide
	$("#scatterplotmenu_container").css("visibility", "hidden");
}

UiScatterplotMatrix.prototype.resetDate = function(_start, _end)
{
	this._start = new Date(_start.getFullYear(), _start.getMonth(), _start.getDate());
	this._end = new Date(_end.getFullYear(), _end.getMonth(), _end.getDate());

	$("#scatterplotmenu_start").text(_start.getFullYear() + "." + (_start.getMonth()+1) + "." + _start.getDate());
	$("#scatterplotmenu_end").text(_end.getFullYear() + "." + (_end.getMonth()+1) + "." + _end.getDate());
}

UiScatterplotMatrix.prototype.show = function()
{
	$("#datepicker_scatterplot").css("visibility", "hidden");
	$("#scatterplotmenu_container").css("visibility", "visible");
}

UiScatterplotMatrix.prototype.hide = function()
{
	$("#scatterplotmenu_container").css("visibility", "hidden");
}