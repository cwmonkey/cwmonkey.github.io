(function(undefined) {

var $;
var debug = false;

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

	this.marked_body = marked(this.body);

	this.$el = $(this.note_tpl(this).trim());
	this.$el.data('__make-note-object', this);
};

Note.prototype.update = function(name, value) {
	debug && console.log('Note.update');
	if ( this[name] !== value ) {
		this[name] = value;
		this.updated = Date.now().toString(36);
		if ( this.save_fn ) this.save_fn(this.id, this.export());
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

	this.$el
		.removeClass('__make-note--editing')
		.find('.__make-note--form')
			.remove().end()
		.find('.__make-note--mover').html(this.title).end()
		.find('.__make-note--match').html(this.match).end()
		.find('.__make-note--body').html(marked(this.body)).end()
		.css({
			width: this.width,
			height: this.height,
			top: this.y,
			left: this.x,
			zIndex: this.zindex
		})
		;

	var matches = this.matches(url);

	if ( this.out && matches ) {
		this.toWindow();
	} else if ( matches ) {
		this.toList();
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
var autosize_to;
var autosize = function(el) {
	clearTimeout(autosize_to);

	autosize_to = setTimeout(function(){
		var $el = $(el);
		var w = el.style.width;
		el.style.cssText = 'height:auto;' + (w?'width:'+w:'');
		var height = $el.outerHeight(true);
		el.style.cssText = 'padding-top:0; padding-bottom:0; border-top:0; border-bottom:0;' + (w?'width:'+w:'');
		var extra = height - $el.outerHeight(true);
		el.style.cssText = 'height:' + (el.scrollHeight + extra) + 'px;' + (w?'width:'+w:'');
		$el.trigger('autosize');
	},0);
};

var cwmMakeNote = window.cwmMakeNote = {
	// Get node from dom element
	get_node: function(el) {
		return $(el).closest('.__make-note--note').data('__make-note-object');
	},
	wnotes: {},
	notes: {},
	fauxMatch: function(pattern, str) {
		pattern = pattern
			.replace(/([\.\\\+\?\[\^\]\$\(\)\{\}\=\!\>\|\:\-])/g, '\\$1')
			.replace(/\*/g, '.*')
			.replace(/\/\.\*$/, '(\\/.*)?')
			+ '(#.*)?'
			;

		var reg = new RegExp(pattern);

		return str.match(reg);
	}
};

window.cwmMakeNote.Note = Note;

var cwmMakeNoteApp = window.cwmMakeNoteApp = function(jQuery, d) {
	if ( d ) {
		debug = true;
	}

	$ = jQuery;

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
	var template = Handlebars.compile(source);
	return template;
};

cwmMakeNoteApp.prototype.attach = function() {
	$(document)
		.delegate('[data-type="min"]', 'click', function() {
			cwmMakeNote.get_node(this).minimize();
		})
		.delegate('[data-type="restore"]', 'click', function() {
			cwmMakeNote.get_node(this).restore();
		})
		.delegate('.__make-note--note textarea', 'input drop paste cut delete click', function() {
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