(function (window) {
'use strict';

var places = [
	{
		name: 'Place Cosby',
		site: 'placecosby.com',
		template: 'http://placecosby.com/{width}/{height}'
	},
	{
		name: 'Place Kitten',
		site: 'placekitten.com',
		template: 'http://placekitten.com/{type}/{width}/{height}',
		type: {text: 'grayscale', value: 'g'}
	},
	{
		name: 'Place Cage',
		site: 'placecage.com',
		template: 'http://placecage.com/{type}/{width}/{height}',
		type: [{text: 'grayscale', value: 'g'}, {text: 'CRAZY', value: 'c'}]
	},
	{
		name: 'Place Hold It',
		site: 'placehold.it',
		template: 'http://placehold.it/{width}x{height}'
	},
	{
		name: 'Lorem Pixel',
		site: 'lorempixel.com',
		template: 'http://lorempixel.com/{type}/{width}/{height}/{category}/{text}',
		type: {text: 'grayscale', value: 'g'},
		category: ['abstract', 'animals', 'business', 'cats', 'city', 'food', 'nightlife', 'fashion', 'people', 'nature', 'sports', 'technics', 'transport']
	},
	{
		name: 'Fill Murray',
		site: 'fillmurray.com',
		template: 'http://fillmurray.com/{width}/{height}'
	},
	{
		name: 'Nice Nice jpg',
		site: 'nicenicejpg.com',
		template: 'http://nicenicejpg.com/{width}/{height}'
	},
	{
		name: 'Place Bear',
		site: 'placebear.com',
		template: 'http://placebear.com/{type}/{width}/{height}',
		type: {text: 'grayscale', value: 'g'}
	},
	{
		name: 'Dummy Image',
		site: 'dummyimage.com',
		template: 'http://placebear.com/{width}x{height}/{background}/{foreground}'
	},
	{
		name: 'FPO IMG',
		site: 'fpoimg.com',
		template: 'http://fpoimg.com/{width}x{height}?text={text}'
	},
	{
		name: 'Bacon Mockup',
		site: 'baconmockup.com',
		template: 'http://baconmockup.com/{width}/{height}'
	},
	{
		name: 'Lorem Pizza',
		site: 'lorempizza.com',
		template: 'http://lorempizza.com/{width}/{height}'
	},
	{
		name: 'Place Sheen',
		site: 'placesheen.com',
		template: 'http://placesheen.com/{width}/{height}'
	}
];

var defaults = {
	width: null,
	height: null,
	text: null,
	background: null,
	foreground: null,
	type: null,
	category: null
};

var tpl =
'<menu id="place-image-menu">\
	<form>\
		<label id="place-image-config-head" for="">Configuration</label>\
		<label id="place-image-config">\
\
		</label>\
		<label for="place-image-width" class="input">Width: <input type="number" value="100" id="place-image-width"></label>\
		<label for="place-image-height" class="input">Height: <input type="number" value="100" id="place-image-height"></label>\
		<label id="place-image-result-label" for="place-image-result">Image: <input type="text" id="place-image-result"></label>\
		<label><button id="place-image-update">&lt;- Update</button></label>\
	</form>\
</menu>';

var css = '<link rel="stylesheet" id="place-image-css"/>';

var $menu;
var $css;
var $image;
var $width;
var $height;
var $update;
var $config;
var $body;
var $last_input;
var $;

var setup = function() {
	$body = $('body');

	$last_input = $('input[type="text"]:focus');

	$menu = $(tpl)
		.attr({tabIndex: '-1'})
		.hide()
		.appendTo('body')
		.focus();

	setTimeout(function() {
		$menu.show();
	}, 0);

	$image = $menu.find('#place-image-result');
	$width = $menu.find('#place-image-width');
	$height = $menu.find('#place-image-height');
	$update = $menu.find('#place-image-update');
	$config = $menu.find('#place-image-config');

	if ( !$last_input.length ) $update.hide();

	var width = $.jStorage.get('place-image-width');
	var height = $.jStorage.get('place-image-height');

	if ( width ) $width.val(width);
	if ( height ) $height.val(height);

	$css = $(css).appendTo('head');

	$css.attr({href: window.cwmBookmarkletUrl + '/place-image.css?' + new Date().getTime()});

	for ( var i = 0; i < places.length; i++ ) {
		var place = places[i];
		var $label = $('<label/>').html(' ' + place.name + ' ');
		var $input = $('<input type="checkbox"/>')
			.addClass('site')
			.attr({value: i})
			.data({
				site: place.site,
				i: i
			});
		var $a = $('<a href="#"/>')
			.attr({href: 'http://' + place.site, target: '_blank'})
			.html('^')
			.appendTo($label);
		var val = $.jStorage.get('place-image-' + place.site);
		if ( val === null || val === true ) $input.prop({checked: true});

		$config.prepend($label.prepend($input));
	}

	var update_image = function() {
		var cplaces = [];
		var $checks = $config.find('.site:checked');

		for ( var i = 0; i < $checks.length; i++ ) {
			var $check = $checks.eq(i);
			cplaces.push(places[$check.data('i')]);
		}

		var place = cplaces[Math.floor(Math.random() * cplaces.length)];
		var template = place.template;
		var url = template;
		var vars = $.extend({}, defaults, {
			width: parseInt($width.val()),
			height: parseInt($height.val())
		});
		var reg;

		for ( var attr in vars ) {
			var val = vars[attr];
			if ( val !== null ) {
				reg = new RegExp('\\{' + attr + '\\}');
				url = url.replace(reg, val);
			} else {
				reg = new RegExp('(\\/|(\\?[a-z]+=)|x)\\{' + attr + '\\}');
				url = url.replace(reg, '');
			}
		}

		$image.val(url);
	};

	$menu
		.delegate('.input input', 'keypress change', function(e) {
			update_image();
		})
		.delegate('#place-image-width', 'keypress change', function(e) {
			$.jStorage.set('place-image-width', $width.val());
		})
		.delegate('#place-image-height', 'keypress change', function(e) {
			$.jStorage.set('place-image-height', $height.val());
		})
		.delegate('#place-image-update', 'click', function(e) {
			e.preventDefault();
			$last_input.val($image.val()).focus();
			$menu.hide();
			update_image();
		})
		.delegate('#place-image-config-head', 'click', function() {
			if ( $menu.is('.place-image-config-open') ) {
				$menu.removeClass('place-image-config-open');
			} else {
				$menu.addClass('place-image-config-open');
			}
		})
		.delegate('#place-image-config .site', 'change', function(e) {
			var $this = $(this);
			$.jStorage.set('place-image-' + $this.data('site'), $this.prop('checked'));
		})
		;

	$body
		.delegate('input:not(#place-image-menu input)', 'focus', function(e) {
			$last_input = $(this);
			$update.show();
		})
		;

	update_image();
};

// Main
var main = function(jQuery) {
	$ = jQuery;
	$menu = $('#place-image-menu');
	if ( !$menu.length ) {
		setup();
	} else {
		$menu.show();
	}
};

window.cwmPlaceImage = {
	main: main
};

}(window));