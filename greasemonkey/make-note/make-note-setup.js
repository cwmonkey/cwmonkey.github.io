(function(undefined) {

var converter = new showdown.Converter({
	tasklists: false,
	tables: true,
	strikethrough: true,
	simplifiedAutoLink: true,
	extensions: ['checkbox']
});
window.md = function(text) {
	var html = converter.makeHtml(text);
	return html;
};

})();