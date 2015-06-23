window.cwmResponsive = window.cwmResponsive || {};

window.cwmResponsive.load = function (window, $, undefined) {
	'use strict';

	var css = '<link rel="stylesheet" id="cwm-responsive-css"/>';
	var $css = $('#cwm-responsive-css');
	var viewport_meta = '<meta name="viewport" content="width=device-width">';
	var $viewport_meta = $('meta[name="viewport"]');

	// Main
	var main = function() {
		if ( !$css.length ) {
			$css = $(css).appendTo('head');
		}

		$css.attr({href: window.cwmBookmarkletUrl + '/responsive.css?' + new Date().getTime()});

		$viewport_meta.remove();
		$viewport_meta = $(viewport_meta).appendTo('head');

		$('div:not(:has(div))').addClass('cwm-ender');
	};

	window.cwmResponsive = {
		main: main
	};
};