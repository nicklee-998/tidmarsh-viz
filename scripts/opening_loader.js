/**
 * Created by marian_mcpartland on 14/11/10.
 */
(function() {
	var Counter;

	Counter = (function() {
		var sequence;

		sequence = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].join('\n');

		function Counter(el) {
			this.el = el;
			this.el.addClass('counter');
			this.el.html(this.template);
			this.tensPlaceSequence = this.el.find('.sequence').eq(0);
			this.onesPlaceSequence = this.el.find('.sequence').eq(1);
		}

		Counter.prototype.template = "<div class='digit'>\n  <div class='sequence'>" + sequence + "</div>\n</div>\n<div class='digit'>\n  <div class='sequence'>" + sequence + "</div>\n</div>";

		Counter.prototype.countUpTo = function(number) {
			var onesPlace, tensPlace;
			tensPlace = Math.floor(number / 10);
			onesPlace = number % 10;
			if (tensPlace !== 0) {
				this.tensPlaceSequence.removeClass('is-hidden');
				setTimeout((function(_this) {
					return function() {
						return _this.tensPlaceSequence.css({
							'-webkit-transform': "translate3d(0, " + (-(9 - tensPlace) * 10) + "%, 0)"
						});
					};
				})(this), 0);
			} else {
				this.tensPlaceSequence.addClass('is-hidden');
			}
			return this.onesPlaceSequence.css({
				'-webkit-transform': "translate3d(0, " + (-(9 - onesPlace) * 10) + "%, 0)"
			});
		};

		return Counter;

	})();

	$(function() {
		_counter = new Counter($('#a'));
		_counter.countUpTo(0);

		//return setInterval((function(_this) {
		//	return function() {
		//		var value;
		//		value = Math.round(Math.random() * 100);
		//		return _counter.countUpTo(value);
		//	};
		//})(this), 2000);
	});

	$(window).resize(function() {
		var twid = $("#mainloading_title").width();
		$("#mainloading_title").css("left", (window.innerWidth / 2 - twid / 2));
		var owid = $("#opening_loader").width();
		$("#opening_loader").css("left", window.innerWidth / 2 - owid / 2 - 5);
	});

}).call(this);
//@ sourceURL=pen.js