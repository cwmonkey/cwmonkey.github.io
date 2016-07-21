(function($) {

var $table1 = $('#table1');

$table1.find('.__summary').remove();

var $ths = $table1.find('thead th, tfoot th');
var $trs = $table1.find('tbody tr');


var ths = [];
var counts = {};

$ths.each(function() {
	var text = $.trim($(this).text());
	ths.push(text);
});

$trs.each(function() {
	var $tds = $(this).find('th, td');

	var versions = [];
	$(ths).each(function(key, col) {
		var $td = $tds.eq(key);
		var text = $.trim($td.text());

		if ( col === 'Version' ) {
			versions = text.split(/-/);
		} else if ( col.indexOf('[CONFIDENCE RANGE]') !== -1 ) {
		} else {
			text = parseInt(text);

			$(versions).each(function(vkey, vval) {
				if ( !counts[vval] ) {
					counts[vval] = {};
				}

				if ( !counts[vval][col] ) {
					counts[vval][col] = 0;
				}

				counts[vval][col] += text;
			});
		}
	});
});

var $tr = $('<tr/>').addClass('__summary');

$(ths).each(function(key, col) {
	var $th = $('<th/>').html(col).css({
		color: '#fff',
		background: '#313131',
		padding: '5px 18px 5px 10px',
		textAlign: 'center'
	}).appendTo($tr);
});

$tr.appendTo($table1);

$.each(counts, function(verion, row) {
	var $tr = $('<tr/>').addClass('__summary');
	var $th = $('<th/>').html(verion).appendTo($tr);
	var visitors = null;
	var next = null;

	$(ths).each(function(key, col) {
		var $td = $('<td/>');

		if ( col === 'Version' ) {
			return;
		} else if ( col.indexOf('[CONFIDENCE RANGE]') !== -1 ) {
			var perc = row[next] / visitors;
			var html = (perc * 100).toPrecision(4) + '%'

			if ( verion !== 'control' ) {
				var control_perc = counts['control'][next] / counts['control']['Visitors'];
				var diff = (perc - control_perc) / control_perc;
				var perc_diff = (diff * 100).toPrecision(4) + '%';
				var $span;

				html += '<br><b>';

				if ( diff > 0 ) {
					html += '<span style="color:green">+' + perc_diff + '</span>';
				} else {
					html += '<span style="color:red">-' + perc_diff + '</span>';
				}

				html += '</b>';
			}

			next = null;
			$td.html(html);
		} else {
			if ( col === 'Visitors' ) {
				visitors = row[col];
			} else if ( visitors ) {
				next = col;
			}

			$td.html(row[col]).addClass('tRight');
		}

		$tr.append($td);
	});

	$table1.append($tr);
});


console.log(counts);

})(window.jQuery);