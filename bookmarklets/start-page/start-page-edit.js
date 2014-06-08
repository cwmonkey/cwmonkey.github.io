(function(window, $, undefined){

'use strict';

$(function() {

var $body = $('body');

var tpl = '<li class="fieldset ui-state-default" id="fieldset{i}">\
<div>\
	<label for="thumb{i}">\
		<img class="thumb" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">\
		Thumb: <input name="thumb" id="thumb{i}" type="text">\
	</label>\
</div>\
<div>\
	<label for="icon{i}">\
		<img class="icon" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">\
		Icon: <input name="icon" id="icon{i}" type="text">\
	</label>\
</div>\
<div>\
	<label for="href{i}">\
		Href: <input name="href" id="href{i}" type="text">\
	</label>\
</div>\
<div>\
	<label for="title{i}">\
		Title: <input name="title" id="title{i}" type="text">\
	</label>\
</div>\
</li>';

var $form = $('#wrapper').find('.form');
var $import = $('#import');
var $export = $('#export');
var i;

var setup = function() {
	var sites = localStorage.getItem('sites');

	if ( typeof sites == 'string' ) {
		$export.val(sites);
		sites = JSON.parse(sites);
	} else {
		sites = [];
	}

	for ( i = 0; i < sites.length; i++ ) {
		var site = sites[i];
		var $site = $(tpl.replace(/{i}/g, i));
		$site.find('#thumb' + i).val(site.thumb);
		$site.find('.thumb').attr('src', site.thumb);
		$site.find('#icon' + i).val(site.icon);
		$site.find('.icon').attr('src', site.icon);
		$site.find('#href' + i).val(site.href);
		$site.find('#title' + i).val(site.title);

		$form.append($site);
	}
	
	make_new();

	$form.sortable({
		revert: true
	});
}

var make_new = function() {
	i++;
	var $new = $(tpl.replace(/{i}/g, i));

	$form.append($new);
};

var move = function(e) {
	$moving.css({
		top: e.clientY - yostart,
		left: e.clientX - xostart
	})
	;
};

var save = function() {
	var sites = [];
	var done = {};
	var i;
	var stringy = $import.val();
	$import.val('');

	if ( !stringy ) {
		$form.find('.fieldset').each(function() {
			var $this = $(this);
			var site = {};
			site.thumb = $this.find('[name="thumb"]').val();
			site.icon = $this.find('[name="icon"]').val();
			site.href = $this.find('[name="href"]').val();
			site.title = $this.find('[name="title"]').val();

			if ( site.href ) {
				if ( done[site.href] !== undefined ) {
					sites[done[site.href]] = site;
				} else {
					sites.push(site);
					done[site.href] = sites.length - 1;
				}
			}
		});

		stringy = JSON.stringify(sites);
		$export.val(stringy);
		localStorage.setItem('sites', stringy);
	} else {
		localStorage.setItem('sites', stringy);
		$form.sortable( "destroy" );
		$form.empty();
		setup();
	}

	localStorage.removeItem('sitesHTML');
};

$('#save').bind('click', function() {
	save();
});

setup();

});
})(window, jQuery);