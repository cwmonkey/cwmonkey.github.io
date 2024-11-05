---
---
{% include greasemonkey/sa-fix-tweets/meta.js %}

(function() {
	'use strict';

	// Twitter params for iframe src. These will probably need to be changed when/if the api changes
	const twitterParams = 'features=eyJ0ZndfdGltZWxpbmVfbGlzdCI6eyJidWNrZXQiOltdLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2ZvbGxvd2VyX2NvdW50X3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9iYWNrZW5kIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19yZWZzcmNfc2Vzc2lvbiI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfZm9zbnJfc29mdF9pbnRlcnZlbnRpb25zX2VuYWJsZWQiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X21peGVkX21lZGlhXzE1ODk3Ijp7ImJ1Y2tldCI6InRyZWF0bWVudCIsInZlcnNpb24iOm51bGx9LCJ0ZndfZXhwZXJpbWVudHNfY29va2llX2V4cGlyYXRpb24iOnsiYnVja2V0IjoxMjA5NjAwLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X3Nob3dfYmlyZHdhdGNoX3Bpdm90c19lbmFibGVkIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19kdXBsaWNhdGVfc2NyaWJlc190b19zZXR0aW5ncyI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfdXNlX3Byb2ZpbGVfaW1hZ2Vfc2hhcGVfZW5hYmxlZCI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfdmlkZW9faGxzX2R5bmFtaWNfbWFuaWZlc3RzXzE1MDgyIjp7ImJ1Y2tldCI6InRydWVfYml0cmF0ZSIsInZlcnNpb24iOm51bGx9LCJ0ZndfbGVnYWN5X3RpbWVsaW5lX3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9mcm9udGVuZCI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9fQ%3D%3D&frame=false&hideCard=false&hideThread=false&lang=en&widgetsVersion=2615f7e52b7e0%3A1702314776716&width=550px';

	// Regex to determine twitter links
	// TODO: Add the other stupid domains people use to post tweets
	const twitterReg = /^https?:\/\/(twitter.com|x.com|fxtwitter.com|nitter.net|vxtwitter.com|www.twitter.com)\/[a-zA-Z0-9\-_]+\/status\/([0-9]+)/;

	// Hide doubled-up twitter embeds in case the user isn't blocking the following url pattern somehow:
	// https://api.twitter.com/1/statuses/oembed.json?*
	GM_addStyle(`
		.my-twitter-embed + a,
		.my-twitter-embed + .tweet {
			display: none !important;
		}
	`);

	let twitterId = 1; // iterator for naming purposes

	// Temporary holder for iframe code
	const div = document.createElement('div');

	// Listen for messages from twitter so we can resize our iframes to fit the content
	window.addEventListener('message', (event) => {
		// Null checking to be safe
		if (!event.data || !event.data['twttr.embed']) return;

		const data = event.data['twttr.embed'];

		if (data.id) {
			const iframe = document.getElementById('my-' + event.data['twttr.embed'].id);

			if (iframe && data.params && data.params[0]) {
				const params = data.params[0];

				if (params.width) iframe.style.width = params.width + 'px';
				if (params.height) iframe.style.height = params.height + 'px';
			}
		}
	});

	// Look for dark mode/theme
	let theme = 'light';
	const meta = document.querySelector('meta[name="twitter:widgets:theme"]');
	if (meta) {
		const content = meta.getAttribute('content');
		if (content) theme = content;
	}

	// Loop through post links and embed an iframe for each twitter-looking link
	const postLinkEls = document.querySelectorAll('.postbody a');
	postLinkEls.forEach((el) => {
		const matches = el.href.match(twitterReg);
		if (!matches) return;
		const src = 'https://platform.twitter.com/embed/Tweet.html?dnt=true&embedId=twitter-widget-' + twitterId + '&id=' + matches[2] + '&' + twitterParams + '&theme=' + theme;
		div.innerHTML = '<iframe src="about:blank" class="my-twitter-embed" id="my-twitter-widget-' + twitterId + '" style="position: static; visibility: visible; width: 550px; height: 528px; display: block; flex-grow: 1;" scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen="true" title="X Post" ></iframe>';
		const iframe = div.firstChild;
		el.parentNode.insertBefore(iframe, el);
		iframe.src = src;
		twitterId++;
	});
})();