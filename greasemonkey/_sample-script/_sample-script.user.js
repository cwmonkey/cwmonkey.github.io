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
//// Tools
////////////////////////////////

{% include greasemonkey/_shared/waitForElement.js %}
