{% unless included_observeForElement %}{% assign included_observeForElement = true %}

{% include greasemonkey/_shared/observe.js %}

////////////////////////////////
// observeForElement
////////////////////////////////

function observeForElement(selector, callback, once) {
	let checkTO;

	function checkDelay(delay) {
		delay = !delay ? 0 : 100;

		clearTimeout(checkTO);
		checkTO = setTimeout(check, delay);
	}

	function check() {
		const el = document.querySelector(selector);

		if (el) {
			callback(el);

			if (once) observer.disconnect();
		}
	}

	const observer = observe(document.body, { attributes: false, childList: true, subtree: true }, checkDelay);

	check(0);
}

{% endunless %}