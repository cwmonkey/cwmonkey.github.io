/* jQuery.load

jQuery.fn.load wrapper which returns a promise */

(function(window, $, undefined) {

$.load =  function($el, path) {
	var deferred = new $.Deferred();

	$el.load(path, function() {
		deferred.resolve();
	});

	return deferred;
};

})(window, jQuery);