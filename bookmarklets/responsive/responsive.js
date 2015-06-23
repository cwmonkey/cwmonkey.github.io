window.cwmResponsive = window.cwmResponsive || {};

window.cwmResponsive.load = function (window, $, undefined) {
	'use strict';

	var css = '<link rel="stylesheet" id="cwm-responsive-css"/>';
	var $css = $('#cwm-responsive-css');

	// Main
	var main = function() {
		if ( !$css.length ) {
			$css = $(css).appendTo('head');
		}

		$css.attr({href: window.cwmBookmarkletUrl + '/responsive.css?' + new Date().getTime()});
	};

	window.cwmResponsive = {
		main: main
	};
};