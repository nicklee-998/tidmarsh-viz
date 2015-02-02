/**
 * Created by marian_mcpartland on 15/1/29.
 */
function UiDataMenu()
{
	this.visible = false;

	this.dpLeft = 50;
	this.dpTop = 280;

	this._isMessageFlash = false;
	this._messageTop = parseInt($('#realtime_message').css("top"));

	$("#datepicker").css("left", this.dpLeft);
	$("#datepicker").css("top", this.dpTop);
	$("#datepicker_tip").css("left", 0);
	$("#datepicker_tip").css("top", -125);
	$("#datepicker_cover").css('width', '100%');
	$("#datepicker_cover").css('height', '100%');

	$("#realtime_message").text("");

	$("#history_date").click(function() {

		// Click date, show calendar to select the date
		self._showDate(false);
		self._showCal(true);
	});

	$("#datepicker_cover").click(function() {
		self._showCal(false);
		if(sliderYear != null) {
			self._showDate(true);
		}
	});

	var self = this;
}

UiDataMenu.prototype.showMe = function(mode, params)
{
	if(mode == DATA_REALTIME_OPEN) {

		this._showRealtimeTip(true);
		this._showRealtimeFaultTip(false);
		this._showDate(false);
		this._showCal(false);

		$('#realtime_message').text("");

		if(params) {
			$('#realtime_message').text(params.message);
			$('#realtime_message').css("opacity", 0);
			$('#realtime_message').css("top", this._messageTop + 10);
			$('#realtime_message').animate({
				top: this._messageTop,
				opacity: 1
			}, 700, 'easeOutQuint');
		}

	} else if(mode == DATA_REALTIME_FAULT) {
		this._showRealtimeFaultTip(true);
		this._showRealtimeTip(false);
		this._showDate(false);
		this._showCal(false);
	} else if(mode == DATA_HISTORY_SELECT_DATE) {
		this._showCal(true);
		this._showDate(false);
		this._showRealtimeTip(false);
		this._showRealtimeFaultTip(false);
	} else if(mode == DATA_HISTORY_EXPLORE) {
		this._showCal(false);
		this._showDate(true);
		this._showRealtimeTip(false);
		this._showRealtimeFaultTip(false);
	}
}

UiDataMenu.prototype.hideMe = function()
{
	this._showDate(false);
	this._showCal(false);
	this._showRealtimeTip(false);
	this._showRealtimeFaultTip(false);
}

UiDataMenu.prototype.flashWaitMessageLabel = function(flg)
{
	if(flg) {

		if(!this._isMessageFlash) {
			console.log("open flash");
			//make it flash
			function loop() {
				$('#realtime_tip').css({opacity:0.3});
				$('#realtime_tip').animate ({
					opacity: 1
				}, 600, 'easeOutQuint', function() {
					$(this).animate({
						opacity: 0.3
					}, 800, 'easeInQuint', function() {
						loop();
					});
				});
			}
			loop();
			this._isMessageFlash = true;
		}

	} else {

		if(this._isMessageFlash) {
			console.log("stop flash");
			// remove flash
			$('#realtime_tip').stop(true);
			$('#realtime_tip').css({opacity:1});
			this._isMessageFlash = false;
		}
	}
}

// ---------------------------------------------------
//  Ui animation
// ---------------------------------------------------
UiDataMenu.prototype._showDate = function(flg)
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

UiDataMenu.prototype._showCal = function(flg)
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

UiDataMenu.prototype._showRealtimeTip = function(flg)
{
	if(flg) {
		if($('#realtime_tip').css('visibility') != 'visible') {
			$('#realtime_tip').css('visibility', 'visible');
			$('#realtime_tip').css('opacity', 0);
			$('#realtime_tip').animate({
				opacity: 1
			}, 500, 'easeOutQuint');

			$('#realtime_message').css('visibility', 'visible');
			$('#realtime_message').css('opacity', 0);
			$('#realtime_message').animate({
				opacity: 1
			}, 500, 'easeOutQuint');
		}
	} else {
		if($('#realtime_tip').css('visibility') != 'hidden') {
			$('#realtime_tip').animate({
				opacity: 0
			}, 500, 'easeOutQuint', function() {
				$('#realtime_tip').css('visibility', 'hidden');
			});

			$('#realtime_message').animate({
				opacity: 0
			}, 500, 'easeOutQuint', function() {
				$('#realtime_message').css('visibility', 'hidden');
			});
		}
	}
}

UiDataMenu.prototype._showRealtimeFaultTip = function(flg)
{
	if(flg) {
		if($('#realtime_message_fault').css('visibility') != 'visible') {
			$('#realtime_message_fault').css('visibility', 'visible');
			$('#realtime_message_fault').css('opacity', 0);
			$('#realtime_message_fault').animate({
				opacity: 1
			}, 500, 'easeOutQuint');
		}
	} else {
		if($('#realtime_message_fault').css('visibility') != 'hidden') {
			$('#realtime_message_fault').animate({
				opacity: 0
			}, 500, 'easeOutQuint', function() {
				$('#realtime_message_fault').css('visibility', 'hidden');
			});
		}
	}
}