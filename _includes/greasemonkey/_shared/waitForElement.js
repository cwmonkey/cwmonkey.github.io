{% unless included_waitForElement %}{% assign included_waitForElement = true %}

////////////////////////////////
// waitForElement
////////////////////////////////

async function waitForElement(selector) {
	while (true) {
	const element = document.querySelector(selector);
	if (element) return element;

	await new Promise(resolve => setTimeout(resolve, 30));
	}
}

{% endunless %}