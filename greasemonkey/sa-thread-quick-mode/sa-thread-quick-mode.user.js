---
---
{% include greasemonkey/sa-thread-quick-mode/meta.js %}

console.log('---=== SA - Thread Quick Mode ===---');

////////////////////////////////
// init
////////////////////////////////

let quickMode;
let loggedinusernameText;

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const threadid = urlParams.get('threadid');
  let el;

  addStyle(/* css */`
    body.__cwmQuickMode #thread .post:not(.__cwmQuickModeInteresting) {
      display: none;
    }
  `);

  [el, quickMode] = await Promise.all([
    waitForElement('.threadbar.bottom'),
    GM.getValue('quickMode--' + threadid)
  ]);

  const loggedinusername = document.querySelector('#loggedinusername');
  loggedinusernameText = loggedinusername.textContent;

  const threadbar_top = document.querySelector('.threadbar.top');

  const quickModeEl = createElementFromHTML(/* html */`
    <label><input type="checkbox" ${quickMode?'checked':''}> Quick Mode</label>
  `);

  threadbar_top.prepend(quickModeEl);

  quickModeEl.querySelector('input').addEventListener('change', (event) => {
    if (event.target.checked) {
      quickMode = true;
      GM.setValue('quickMode--' + threadid, 1);
    } else {
      quickMode = false;
      GM.deleteValue('quickMode--' + threadid);
    }

    checkQuick();
  });

  checkQuick();
}

init();

let checked = false;
function checkQuick() {
  if (quickMode) {
    document.body.classList.add('__cwmQuickMode');
  } else {
    document.body.classList.remove('__cwmQuickMode');
    return;
  }

  if (checked) return;

  // Has interesting content
  document.querySelectorAll('.postbody:has(> a), .postbody:has(> iframe), .postbody:has(> img:not(.sa-smilie)), .postbody:has(> div > iframe)').forEach((el) => {
    el.closest('.post').classList.add('__cwmQuickModeInteresting');
  });

  // Has logged-in name
  //document.querySelectorAll('.post:not(.__cwmQuickModeInteresting) .quote_link').forEach((el) => {
  document.querySelectorAll('.post:not(.__cwmQuickModeInteresting) .postbody').forEach((el) => {
    if (el.textContent.includes(loggedinusernameText)) {
      el.closest('.post').classList.add('__cwmQuickModeInteresting');
    }
  });
}

////////////////////////////////
//// Tools
////////////////////////////////

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/addStyle.js %}
