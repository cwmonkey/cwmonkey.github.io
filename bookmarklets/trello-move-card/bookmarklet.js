$('.js-move-card').click();

$('.js-select-board')[0].selectedIndex = $('.js-select-board option').length - 2;

$('.js-select-board').change();

var checkmove = function() {
	if ( $('.js-submit').is('[disabled]') ) {
		setTimeout(checkmove, 100);
	} else {
		var name = $('.js-open-move-from-header').text();
		var i = 0;
		$('.js-select-list option').each(function() {
			if ( name == $(this).text() ) {
				$('.js-select-list')[0].selectedIndex = i;
				$('.js-select-list').change();
				return false;
			}
			i++;
		});

		$('.js-submit').click();
	}
}

checkmove();