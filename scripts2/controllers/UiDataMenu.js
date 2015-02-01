/**
 * Created by marian_mcpartland on 15/1/29.
 */
function UiDataHistoryMenu()
{
	this.visible = false;

	this.dpLeft = 50;
	this.dpTop = 280;

	$("#datepicker").css("left", this.dpLeft);
	$("#datepicker").css("top", this.dpTop);
	$("#datepicker_tip").css("left", 0);
	$("#datepicker_tip").css("top", -125);
	$("#datepicker_cover").css('width', '100%');
	$("#datepicker_cover").css('height', '100%');

	$("#history_date").click(function() {

		// Click date, show calendar to select the date
		self._showDate(false);
		self._showCal(true);
	});

	$("#datepicker_cover").click(function() {
		self._showCal(false);
	});

	var self = this;
}

UiDataHistoryMenu.prototype.showMe = function(mode)
{
	if(mode == "date_picker") {
		this._showCal(true);
		this._showDate(false);
	} else if(mode == "operate_tools") {
		this._showCal(false);
		this._showDate(true);
	}
}

UiDataHistoryMenu.prototype.hideMe = function()
{
	this._showDate(false);
	this._showCal(false);
}

// ---------------------------------------------------
//  Ui animation
// ---------------------------------------------------
UiDataHistoryMenu.prototype._showDate = function(flg)
{
	if(flg) {
		$('#history_date_panel').css('visibility', 'visible');
		$('#history_date_panel').css('left', -300);
		$('#history_date_panel').animate({
			left: '50px'
		}, 500, 'easeOutQuint');
	} else {
		if($('#history_date_panel').css('visibility') != 'hidden') {
			$('#history_date_panel').animate({
				left: '-300px'
			}, 500, 'easeOutQuint', function() {
				$('#history_date_panel').css('visibility', 'hidden');
			});
		}
	}
}

UiDataHistoryMenu.prototype._showCal = function(flg)
{
	if(flg) {
		// cover
		$("#datepicker_cover").css('visibility', 'visible');
		$("#datepicker_cover").css('opacity', 0);
		$('#datepicker_cover').animate({
			opacity: 1
		}, 500, 'easeOutQuint');

		$('#datepicker').css('visibility', 'visible');
		$('#datepicker').css('top', -120);
		$('#datepicker').animate({
			top: this.dpTop + 'px'
		}, 800, 'easeOutQuint');
	} else {
		// cover
		$('#datepicker_cover').animate({
			opacity: 0
		}, 500, 'easeOutQuint', function() {
			$("#datepicker_cover").css('visibility', 'hidden');
		});

		if($('#datepicker').css('visibility') != 'hidden') {
			$('#datepicker').animate({
				top: '-120px'
			}, 800, 'easeOutQuint', function() {
				$('#datepicker').css('visibility', 'hidden');
			});
		}
	}
}