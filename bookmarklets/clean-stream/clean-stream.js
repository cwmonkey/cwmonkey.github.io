(function (window) {
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
var main = function($) {
	$('iframe,embed,object').each(function() {
		var $this = $(this);
		if ( $this.width() < 300 || $this.height() < 300 ) {
			$this.remove();
		}
	});

	//$('iframe').appendTo('body');
	//$('*:not(iframe):not(:has(iframe))').remove();

	// WWE Network
	if ( document.location.hostname == 'www.youtube.com' ) {
		$('*:not(embed,object,param,#cleanStreamCss):not(:has(embed,object,param))').remove();
	} else {
		$('*:not(iframe,embed,object,param,#cleanStreamCss):not(:has(iframe,embed,object,param))').remove();
	}
	/* $('body').append('<div><style>*{max-width:auto !important;max-height:auto !important;padding:0 !important;margin:0 !important;' + x + 'width:100% !important;' + x + 'height:100% !important;' + x + 'overflow:hidden !important;xdisplay:block !important}</style></div>');
	$('body').append('<div><style>*{max-width:auto !important;max-height:auto !important;padding:0 !important;margin:0 !important;' + x + 'width:100% !important;' + x + 'height:100% !important;' + x + 'overflow:hidden !important;xdisplay:block !important}</style></div>'); */

	var $cleanStreamCss = $('#cleanStreamCss');
	if ( !$cleanStreamCss.length ) {
		//$cleanStreamCss = $('<link id="cleanStreamCss" rel="stylesheet"/>').prependTo('body');
		//$cleanStreamCss.attr({href: window.cwmBookmarkletUrl + '/clean-stream.css?' + new Date().getTime()});
		$('body').append('<style id="cleanStreamCss">*{max-width:auto !important;max-height:auto !important;padding:0 !important;margin:0 !important;width:100% !important;height:100% !important;overflow:hidden !important;xdisplay:block !important}</style>');
	}

	// WWE Network
	if ( document.location.hostname == 'network.wwe.com' ) {
		var wwe_network_resize_TO;
		var resize = function() {
			clearTimeout(wwe_network_resize_TO);
			wwe_network_resize_TO = setTimeout(wwe_network_resize, 1000);
		};

		setTimeout(wwe_network_resize, 0);

		$(window).bind('resize', resize);
	}
};

window.cwmCleanStream = {
	main: main
};

}(window));