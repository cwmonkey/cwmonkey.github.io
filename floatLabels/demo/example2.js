(function($) {

var $body = $('body')
	// Make floaty labels
	.floatLabels({
		wrapper: '.input'
	})
	;

	// Enable transitions
	setTimeout(function() {
		$body.removeClass('preload');
	}, 10);

// Example for ajaxed forms:
$('#show-form').bind('click', function(e) {
	e.preventDefault();
	var $this = $(this);
	var $parent = $this.parent();
	var $formtpl = $('#form-template');
	var $form = $($formtpl.html());

	// If your code is properly coded with labels and has the "filled" class already you wont
	// need to call floatLabels again.
	// $body.addClass('preload');
	// $form.floatLabels();
	// You could also do $body.floatLabels(); again as the plugin checks for duplicate event delegation.

	$this.remove();
	$parent.append($form);

	// $body.floatLabels();
	// Like that. But here'd you'd have to mess with more setTimeouts if you wanted to suppress
	// the transitions because browsers are funny about class adding/removing timing.

	// setTimeout(function() {
	// 	$body.removeClass('preload');
	// }, 10);
})
;

})(window.jQuery || window.Zepto || window.$);