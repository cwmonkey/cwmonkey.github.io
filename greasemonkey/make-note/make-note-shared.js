(function(undefined) {

var $;
var md;
var debug = false;
var ignore_next_update = null;

var Note = function(params, note_tpl, note_form_tpl, save_fn, frame) {
	debug && console.log('Note');
	this.frame = frame;
	this.save_fn = save_fn;
	this.note_form_tpl = note_form_tpl;
	this.note_tpl = note_tpl;

	this.init(params);
};

Note.prototype.init = function(params) {
	debug && console.log('Note.init');
	var self = this;

	this.editing = false;

	this.attrs = [
		{p: 'title', s: 't'},
		{p: 'body', s: 'b'},
		{p: 'match', s: 'm'},
		{p: 'collapsed', s: 'c'},
		{p: 'absolute', s: 'a'},
		{p: 'zindex', s: 'z'},
		{p: 'x', s: 'x'},
		{p: 'y', s: 'y'},
		{p: 'width', s: 'w'},
		{p: 'height', s: 'h'},
		{p: 'out', s: 'o'},
		{p: 'deleted', s: 'd'},
		{p: 'updated', s: 'u'}
	];

	this.attrs.forEach(function(val) {
		self[val.p] = params[val.p] || params[val.s] || undefined;
	});

	this.id = params.id;

	if ( !this.id ) {
		this.id = Date.now().toString(36);
		if ( this.save_fn ) this.save_fn(this.id, this.export());
	}

	this.md_body = md(this.body);

	/* Shadow DOM
	// div.innerHTML = html;
	var css = '<link rel="stylesheet" href="//{{ site.domain }}/css/make-note.css" id="__make-note-css"/>';
	var div = document.createElement('DIV');
	var shadow = div.createShadowRoot();
	var html = this.note_tpl(this).trim() + css;
	//var clone = document.importNode(html, true);
	shadow.innerHTML = html;
	this.$el = $(div);
	*/

	this.$el = $(this.note_tpl(this).trim());
	this.$el.data('__make-note-object', this);
};

Note.prototype.update = function(name, value, ignore) {
	debug && console.log('Note.update');
	if ( this[name] !== value ) {
		this[name] = value;
		this.updated = Date.now().toString(36);
		if ( this.save_fn ) this.save_fn(this.id, this.export(), ignore);
	}
};

Note.prototype.matches = function(url) {
	debug && console.log('Note.matches');
	return cwmMakeNote.fauxMatch(this.match, url);
};

Note.prototype.minimize = function() {
	debug && console.log('Note.minimize');
	this.$el.addClass('__make-note--minimized');
	this.update('collapsed', 1);
};

Note.prototype.restore = function() {
	debug && console.log('Note.restore');
	this.$el.removeClass('__make-note--minimized');
	this.update('collapsed', undefined);
};

Note.prototype.edit = function() {
	debug && console.log('Note.edit');
	this.editing = true;
	this.$el
		.addClass('__make-note--editing')
		.append(this.note_form_tpl(this))
		;
};

Note.prototype.save = function(params, url, skip_save_fn) {
	debug && console.log('Note.save');
	this.editing = false;
	var self = this;
	var modified = false;

	params.forEach(function(val) {
		var value = val.value || undefined;

		if ( value !== self[val.name] ) {
			self[val.name] = value;
			modified = true;
		}
	});

	if ( modified && !skip_save_fn ) {
		this.updated = Date.now().toString(36);
		this.save_fn(this.id, this.export());
	}

	if ( ignore_next_update === this.id ) {
		ignore_next_update = null;
	} else {
		this.$el
			.removeClass('__make-note--editing')
			.find('.__make-note--form')
				.remove().end()
			.find('.__make-note--mover').html(this.title).end()
			.find('.__make-note--match').html(this.match).end()
			.find('.__make-note--body').html(md(this.body)).end()
			.css({
				width: this.width,
				height: this.height,
				top: this.y,
				left: this.x,
				zIndex: this.zindex
			})
			;
	}

	// TODO: Keep track of current URL
	if ( url ) {
		var matches = this.matches(url);

		if ( params.out ) {
			if ( this.out && matches ) {
				this.toWindow();
			} else if ( matches ) {
				this.toList();
			}
		}
	}

	if ( this.deleted ) {
		this.del();
	}

	if ( this.collapsed ) {
		this.minimize();
	} else {
		this.restore();
	}

	if ( this.absolute ) {
		this.$el.addClass('__make-note--absoluted');
	} else {
		this.$el.removeClass('__make-note--absoluted');
	}
};

Note.prototype.cancel = function() {
	debug && console.log('Note.cancel');
	this.editing = false;

	this.$el
		.css({
			width: this.width,
			height: this.height,
			top: this.y,
			left: this.x,
			zIndex: this.zindex
		})
		.removeClass('__make-note--editing')
		.find('.__make-note--form')
			.remove()
		;
};

// TODO delete flag
Note.prototype.del = function() {
	debug && console.log('Note.del');
	if ( confirm('Wanna delete?') ) {
		var del_params = [];
		this.attrs.forEach(function(val) {
			del_params.push({name: val.p, value: undefined});
		});

		this.save(del_params, null, true);

		this.update('deleted', 1);

		this.frame.postMessage({
			type: 'delete',
			id: this.id
		}, '*');

		return true;
	}

	return false;
};

Note.prototype.toWindow = function() {
	debug && console.log('Note.toWindow');
	this.update('out', 1);

	this.frame.postMessage({
		type: 'toWindow',
		id: this.id,
		note: this.export()
	}, '*');

	this.$el.addClass('to-window');
};

Note.prototype.toList = function() {
	debug && console.log('Note.toList');
	this.update('out', undefined);

	this.frame.postMessage({
		type: 'toList',
		id: this.id
	}, '*');

	this.$el.removeClass('to-window');
};

Note.prototype.export = function() {
	debug && console.log('Note.export');
	var ret = {};
	var self = this;

	this.attrs.forEach(function(val) {
		if ( self[val.p] !== undefined ) {
			ret[val.s] = self[val.p];
		}
	});

	return ret;
};

// Textarea resizer
var $autosize_holder;
var autosize = function(el) {
	if ( !$autosize_holder ) {
		$autosize_holder = $('<span style="width:0;display:inline-block"></span>');
	}

	var $el = $(el);
	var height = $el.outerHeight(true);

	$autosize_holder
		.css({height: height})
		.insertAfter($el);

	var w = el.style.width;
	el.style.cssText = 'height:auto;' + (w?'width:'+w:'');
	height = $el.outerHeight(true);
	el.style.cssText = 'padding-top:0; padding-bottom:0; border-top:0; border-bottom:0;' + (w?'width:'+w:'');
	var extra = height - $el.outerHeight(true);
	el.style.cssText = 'height:' + (el.scrollHeight + extra) + 'px;' + (w?'width:'+w:'');
	$autosize_holder.detach();
	$el.trigger('autosize');
};

  /////////////////////////////
 // Shared functionality
/////////////////////////////

var if_reg = /\{\{ *#if +([a-z_][a-z_0-9A-Z]*) *\}\}/g;
var else_reg = /\{\{ *else *\}\}/g;
var endif_reg = /\{\{ *\/if *\}\}/g;
var each_reg = /\{\{ *#each +([a-z_][a-z_0-9A-Z]*) *\}\}/g;
var endeach_reg = /\{\{ *\/each *\}\}/g;
var trim_reg = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
var n_reg = /\n/g;
var this_reg = /\{\{ *this *\}\}/g;
var var_raw_reg = /\{\{\{ *([a-z_][a-z_0-9A-Z]*) *\}\}\}/g;
var var_reg = /\{\{ *([a-z_][a-z_0-9A-Z]*) *\}\}/g;

// Get node from dom element
var cwmMakeNote = window.cwmMakeNote = {};

cwmMakeNote.get_node = function(el) {
	return $(el).closest('.__make-note--note').data('__make-note-object');
};

cwmMakeNote.wnotes = {};

cwmMakeNote.notes = {};

cwmMakeNote.fauxMatch = function(pattern, str) {
	pattern = pattern
		.replace(/([\.\\\+\?\[\^\]\$\(\)\{\}\=\!\>\|\:\-])/g, '\\$1')
		.replace(/\*/g, '.*')
		.replace(/\/\.\*$/, '(\\/.*)?')
		.replace(/\/$/, '\\/?')
		+ '(#.*)?'
		;

	var reg = new RegExp(pattern);

	return str.match(reg);
};

cwmMakeNote.compile = function(html) {
	var fn = "function(d,undefined){var html='";
	fn += html
		.replace(trim_reg, '')
		.replace(n_reg, '\\\n')
		.replace(if_reg, "';if (d.$1) {html+='")
		.replace(else_reg, "';}else{html+='")
		.replace(endif_reg, "';}html+='")
		.replace(each_reg, "';for(var i=0,l=d.$1.length,v;i<l;i++){v=d.$1[i];html+='")
		.replace(endeach_reg, "';};html+='")
		.replace(this_reg, "';html+=v;html+='")
		.replace(var_raw_reg, "';if(d.$1!==undefined){html+=d.$1};html+='")
		.replace(var_reg, "';if(d.$1!==undefined){html+=d.$1};html+='")
		;
	fn += "';return html}";
	eval('var func = ' + fn);
	return func;
};

window.cwmMakeNote.Note = Note;

var cwmMakeNoteApp = window.cwmMakeNoteApp = function(jQuery, window_md, d) {
	if ( d ) {
		debug = true;
	}

	$ = jQuery;
	md = window_md;

	// Get form as {name: value...}
	$.fn.serializeObject = function() {
		var obj = {};

		this.serializeArray().forEach(function(val) {
			obj[val.name] = val.value;
		});

		return obj;
	};
};

// Template
cwmMakeNoteApp.prototype.tpl = function(source) {
	var template = cwmMakeNote.compile(source);
	return template;
};

cwmMakeNoteApp.prototype.attach = function() {
	$(document)
		.delegate('.__make-note--body input[type="checkbox"]', 'change', function() {
			var checkbox = this;
			var $this = $(this);
			var checked = $this.prop('checked');
			var $mnbody = $this.closest('.__make-note--body');
			var $checkboxes = $mnbody.find('input[type="checkbox"]');
			var index = 0;

			for ( var i = 0, l = $checkboxes.length; i < l; i++ ) {
				if ( $checkboxes.get(i) === checkbox ) {
					index = i;
					break;
				}
			}

			var note = cwmMakeNote.get_node(this);
			var s = note.body;

			var findi = -1;
			s = s.replace(/\[[ x]\]/g, function(match) {
				findi++;
				if ( findi === index ) {
					return ( checked ? '[x]' : '[ ]' );
				}

				return match;
			});

			ignore_next_update = note.id;
			note.update('body', s);
		})
		.delegate('[data-type="min"]', 'click', function() {
			cwmMakeNote.get_node(this).minimize();
		})
		.delegate('[data-type="restore"]', 'click', function() {
			cwmMakeNote.get_node(this).restore();
		})
		.delegate('.__make-note--form textarea', 'input drop paste cut delete click', function() {
			autosize(this);
		})
		.delegate('[data-type="edit"]', 'click', function() {
			var node = cwmMakeNote.get_node(this);
			node.edit();
			autosize(node.$el.find('textarea')[0]);
		})
		.delegate('[data-type="save"]', 'click', function(e) {
			e.preventDefault();
			cwmMakeNote.get_node(this).save($(this).closest('form').serializeArray());
		})
		.delegate('[data-type="cancel"]', 'click', function(e) {
			e.preventDefault();
			cwmMakeNote.get_node(this).cancel();
		})
		.delegate('[data-type="delete"]', 'click', function(e) {
			e.preventDefault();
			var note = cwmMakeNote.get_node(this);

			if ( note.del() ) {
				note.$el.remove();
				delete cwmMakeNote.notes[note.id];
			}
		})
		;
};

})();