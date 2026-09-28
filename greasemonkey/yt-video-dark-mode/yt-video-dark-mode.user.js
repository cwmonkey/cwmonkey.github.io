---
---
{% include greasemonkey/yt-video-dark-mode/meta.js %}

console.log('---=== YouTube - Video Dark Mode ===---');

////////////////////////////////
// Styles
////////////////////////////////

GM_addStyle(/* css */`
	.__darkMode_button {
		position: absolute;
		top: 20px;
		right: 20px;
		font-size: 50px;
		opacity: 0;
		background: transparent;
		transition: all .2s ease-in-out;
		border: 0;
		z-index: 10000;

		ytd-app[is-watch-page] .html5-video-player:hover & {
			opacity: .8;

			&:hover {
				opacity: 1;
			}
		}

		.__darkMode_on & {
			filter: grayscale(1);
		}
	}

	ytd-app[is-watch-page] .html5-video-player {
		transition: opacity .2s ease-in-out;

		.__darkMode_on & {
			opacity: .5;
		}
	}
`);

////////////////////////////////
// init
////////////////////////////////

async function init() {
	await waitForElement('body');

	let darkModeLight;

	observeForElement('ytd-app[is-watch-page] #ytd-player .html5-video-player:not(:has(.__darkMode_button))', (containerEl) => {
		if (!darkModeLight) {
			darkModeLight = createElementFromHTML(/* html */`
				<button type="button" class="__darkMode_button">💡</button>
			`);
		}

		containerEl.append(darkModeLight);
	});

	document.body.addEventListener('click', (ev) => {
		if (!ev.target.matches('.__darkMode_button')) return;

		if (document.body.matches('.__darkMode_on')) {
			document.body.classList.remove('__darkMode_on');
		} else {
			document.body.classList.add('__darkMode_on');
		}
	}, true);
}

init();

////////////////////////////////
// tools
////////////////////////////////

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/observeForElement.js %}
