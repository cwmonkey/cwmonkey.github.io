(function($) {

// Make floaty labels
$('body').floatLabels();

// Example for ajaxed forms:
$('#show-form').bind('click', function(e) {
	e.preventDefault();
	var $this = $(this);
	var $parent = $this.parent();
	var $formtpl = $('#form-template');
	var $form = $($formtpl.html());

	$form.floatLabels();
	// You could also do $('body').floatLabels(); again as the plugin checks for duplicate event delegation

	$this.remove();
	$parent.append($form);
})
;

})(jQuery);