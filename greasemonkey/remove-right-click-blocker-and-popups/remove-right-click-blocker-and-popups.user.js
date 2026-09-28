---
---

{% include greasemonkey/remove-right-click-blocker-and-popups/meta.js %}

console.log('---=== Remove Right Click Blocker and Popups ===---');

{% include greasemonkey/_shared/toolsWindow.js %}

let allowEvents = true;
let showPopup = true;
let blockedPopup;
let keys = [];
let rightMouseDown = false;
let trusted = 'trusted:' + Date.now() + Math.random(100000);

let blockOncontextmenuEvents = localStorage.getItem('__cwmBlockOncontextmenuEvents');
let blockClickEvents = localStorage.getItem('__cwmClickEvents');
let blockPopups = localStorage.getItem('__cwmBlockPopups');

let blockers = [
  {event: 'contextmenu'},
  {event: 'click'},
  {windowFn: 'open'}
];

const oldAEL = Element.prototype.addEventListener;
const oldWindowAEL = window.addEventListener;
let hijackedAddEventListener = false;

function hijackAddEventListener() {
  hijackedAddEventListener = true;

  document.addEventListener = window.addEventListener = Element.prototype.addEventListener = function (type, listener, options, trustedkey) {
    const blocked = localStorage.getItem(`__cwmBlock${type.toLowerCase()}Event`);

    if (blocked && trustedkey !== trusted) {
      console.log('Blocked: Attempt to call addEventListener:', [...arguments]);
      return true;
    }

    try {
      return oldAEL.apply(this, arguments);
    } catch(e) {
      return oldWindowAEL.apply(this, arguments);
    }
  }
}

blockers.forEach((blocker) => {
  if (blocker.event) {
    const blocked = localStorage.getItem(`__cwmBlock${blocker.event}Event`);

    if (blocked) {
      hijackAddEventListener();

      document.querySelectorAll('*').forEach(el => {
        el.removeAttribute(`on${blocker.event}`);
      });
    }
  } else if (blocker.windowFn) {
    const blocked = localStorage.getItem(`__cwmBlock${blocker.windowFn}WindowFn`);

    if (blocked) {
      blocker.oldFn = window[blocker.windowFn];

      window[blocker.windowFn] = () => {
        console.log('Blocked: Attempt to call window fn:', blocker.windowFn, [...arguments]);
      }
    }
  }
});

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmToolsWindow-shown') {
    showBlockerSection();
  }
});

let blockerSection;
function showBlockerSection() {
  if (!blockerSection) {
    createBlockerSection();
  }
}

function createBlockerSection() {
  blockerSection = createElementFromHTML(/* html */`
    <section id="blockerSection">
      <h3>Site settings:</h3>
      <ul></ul>
      <button class="refresh">Refresh</button>
    </section>
  `);

  addStyle(/* css */`
    #blockerSection {
      &:not(.display_refresh) .refresh {
        display: none;
      }

      li {
        color: #cfc;

        .allow {
          display: none;
        }

        &.disallowed {
          color: #fcc;

          .allow {
            display: inline-block;
          }

          .disallow {
            display: none;
          }
        }
      }
    }
  `, toolsWindow);

  const sections = toolsWindow.querySelector('#sections');

  const ul = blockerSection.querySelector('ul');

  blockers.forEach((blocker) => {
    const li = createElementFromHTML(/* html */`<li>
      <button type="button" class="allow">Allow</button>
      <button type="button" class="disallow">Disallow</button>
    </li>`);

    let blocked = false;
    let spanText;
    let key;

    if (blocker.event) {
      key = `__cwmBlock${blocker.event}Event`;
      blocked = localStorage.getItem(key);
      spanText = `${blocker.event} Events`;
    } else if (blocker.windowFn) {
      key = `__cwmBlock${blocker.windowFn}WindowFn`;
      blocked = localStorage.getItem(key);
      spanText = `${blocker.windowFn} window function`;
    }

    const span = createElementFromHTML(`<span>${spanText}</span>`);
    li.append(span);
    li.dataset.key = key;

    if (blocked) {
      li.classList.add('disallowed');
    }

    ul.prepend(li);
  });

  sections.append(blockerSection);

  oldAEL.apply(toolsWindow, ['click', (event) => {
    if (event.target.closest('.allow')) {
      const li = event.target.closest('li');
      li.classList.remove('disallowed');
      localStorage.removeItem(li.dataset.key);
      blockerSection.classList.add('display_refresh');
    } else if (event.target.closest('.disallow')) {
      const li = event.target.closest('li');
      li.classList.add('disallowed');
      localStorage.setItem(li.dataset.key, 1);

      if (!hijackedAddEventListener) {
        blockerSection.classList.add('display_refresh');
      }
    } else if (event.target.closest('.refresh')) {
      window.location.reload(-1);
    }
  }, true]);
}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}

{% include greasemonkey/_shared/waitForElement.js %}
