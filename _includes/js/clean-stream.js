window.cwmCleanStream = window.cwmCleanStream || {};

window.cwmCleanStream.load = function (window, $, undefined) {
	'use strict';

	// WWE Network Resize
	var wwe_network_resize = function() {
		// var $body = $('body');
		var $videoContainer = $('#videoContainer');
		var html = $videoContainer.html();
		var w = $videoContainer.width();
		var h = $videoContainer.height();
		var r = 16 / 9;
		var tr = w / h;

		if ( tr < r ) {
			h = Math.floor(9 / 16 * w);
		} else {
			w = Math.floor(16 / 9 * h);
		}

		html = html
			.replace(/width="[0-9]+"/, 'width="' + w + '"')
			.replace(/matchWidth=[0-9]+/, 'matchWidth=' + w)
			.replace(/height="[0-9]+"/, 'height="' + h + '"')
			.replace(/matchHeight=[0-9]+/, 'matchHeight=' + h)
			;
		$videoContainer.empty().html(html);
	};

	// Main
	var main = function() {
		$('body').append('<style>embed,object{display:block}</style>');

		$('iframe,embed,object').each(function() {
			var $this = $(this);
			//if ( $this.css('display') === 'inline' ) $this.css('display', 'block');

			var width = $this.width();
			var height = $this.height();

			if ( width < 300 || height < 300 ) {
				$this.remove();
			}
		});

		// TODO: fix this logic up, refactor
		// Youtube
		if ( document.location.hostname == 'www.youtube.com' ) {
			$('*:not(embed,object,param,#cleanStreamCss):not(:has(embed,object,param))').remove();
		} else if ( document.location.hostname != 'network.wwe.com' ) {
			$('*:not(iframe,embed,object,param,#cleanStreamCss):not(:has(iframe,embed,object,param))').remove();
		}

		// WWE Network
		if ( document.location.hostname == 'network.wwe.com' ) {
			var $videoContainer = $('#videoContainer');
			$videoContainer.appendTo('body');
			$('*:not(iframe,embed,object,param,#cleanStreamCss):not(:has(iframe,embed,object,param))').remove();

			var $cleanStreamCss = $('#cleanStreamCss');
			if ( !$cleanStreamCss.length ) {
				$('body').append('<style id="cleanStreamCss">html,body,#videoContainer{max-width:auto !important;max-height:auto !important;padding:0 !important;margin:0 !important;width:100% !important;height:100% !important;overflow:hidden !important;display:block !important}body{background:black}object{margin:auto;display:block}</style>');
			}

			var wwe_network_resize_TO;
			var resize = function() {
				clearTimeout(wwe_network_resize_TO);
				wwe_network_resize_TO = setTimeout(wwe_network_resize, 1000);
			};

			setTimeout(wwe_network_resize, 0);

			$(window).bind('resize', resize);
		} else {
			var $cleanStreamCss = $('#cleanStreamCss');
			if ( !$cleanStreamCss.length ) {
				$('body').append('<style id="cleanStreamCss">\
					* {\
						border: 0;\
						max-width:auto !important;\
						max-height:auto !important;\
						padding:0 !important;\
						margin:0 !important;\
						width:100% !important;\
						height:100% !important;\
						overflow:hidden !important;\
						Xdisplay:block !important\
						font-size: 0 !important;\
						line-height: 0 !important;\
						border-spacing: 0 !important;\
					}\
					param {\
						display:none !important\
					}\
				</style>');
			}
		}
	};

	window.cwmCleanStream = {
		main: main
	};
};