---
---
{% include greasemonkey/fix-ugly-links/meta.js %}

console.log('---=== Fix Ugly Scripts ===---');

////////////////////////////////
// init
////////////////////////////////

async function init() {
  const body = await waitForElement('body');

  body.addEventListener('contextmenu', (ev) => {
    const a = ev.target.closest('a');

    if (a) {
      if (a.href.match(/^http(s)?:\/\/(www\.)?x\.com\//)) {
        a.href = a.href.replace('/x.com/', '/twitter.com/').replace(/\?.*$/, '');
      } else if (a.href.match(/^http(s)?:\/\/(www\.)?bsky\.app\//)) {
        a.href = a.href.replace(/\?.*$/, '');
      }
    }
  });
}

init();

////////////////////////////////
// tools
////////////////////////////////

{% include greasemonkey/_shared/waitForElement.js %}
