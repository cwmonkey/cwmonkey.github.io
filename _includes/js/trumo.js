(function() {
	const ts = ['t', 'r', 'u', 'm', 'p', ''];
	let t = 'Trump';
	let r = false;
	let re = '';
	const debug = document.getElementById('trumodebug');

	const rand = function() {
		return Math.random() < .3333;
	};

	const out = function(s) {
		debug ? debug.innerHTML = s + "\n" + debug.innerHTML : console.log(s);
	};

	const c = Math.random();

	if (c < .25) {
		out('Random case');
		t = t.toLowerCase().split('').map(function(c){
			return Math.random() < .5 ? c : c.toUpperCase();
		}).join('');
		r = true;
	} else if (c < .5) {
		out('Upper case');
		t = t.toUpperCase();
	} else if (c < .75) {
		out('Lower case');
		t = t.toLowerCase();
	}

	out(t);

	if (rand()) {
		out('Reverse');
		t = t.split('').reverse().join('');
		out(t);
	}

	for (let i = 0; i < t.length; i++) {
		if (rand()) {
			re = ts[Math.floor(Math.random() * ts.length)];
			out('Swap:' + re);
			if (r) {
				re = Math.random() < .5 ? re : re.toUpperCase()
			}
			t = t.substring(0, i) + re + t.substring(i + 1, t.length);
			out(t);
		}
	}

	if (rand()) {
		for (let i = 0, len = Math.floor(Math.random() * 6) + 1, p; i < len; i++) {
			p = Math.floor(Math.random * t.length);
			re = ts[Math.floor(Math.random() * ts.length)];
			if (r) {
				re = Math.random() < .5 ? re : re.toUpperCase()
			}
			out('Add: ' + re);
			t = t.substring(0, p) + re + t.substring(p + 1, t.length);
			out(t);
		}
	}

	if (rand()) {
		out('p -> o')
		t = t.replace(/p/, 'o').replace(/P/, 'O');
		out(t);
	}


	if (rand()) {
		out('m -> n')
		t = t.replace(/m/, 'n').replace(/M/, 'N');
		out(t);
	}

	navigator.clipboard.writeText(t);
}());