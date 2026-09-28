---
---
{% include greasemonkey/_sample-script/meta.js %}

console.log('---=== Sample Script ===---');

////////////////////////////////
// init
////////////////////////////////

async function init() {
	await waitForElement('body');
}

init();

////////////////////////////////
// tools
////////////////////////////////

{% include greasemonkey/_shared/waitForElement.js %}
