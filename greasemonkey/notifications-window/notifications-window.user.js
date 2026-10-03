---
---
{% include greasemonkey/notifications-window/meta.js %}

console.log('---=== Notifications Window ===---');

let shown = localStorage.getItem('__cwmNotificationsWindowShown');
let notificationWindow;

////////////////////////////////
//// toolsWindow
////////////////////////////////

let notificationsSection;

{% include greasemonkey/_shared/toolsWindow.js %}

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmToolsWindow-shown') {
    if (!notificationsSection) {
      createNotificationsSection();
    }
  }
});

////////////////////////////////
//// createNotificationsSection
////////////////////////////////

function createNotificationsSection() {
  addStyle(/* css */`
    #notificationsSection {
      li {
        color: var(--disabled-color);

        .hide {
          display: none;
        }

        &.shown {
          color: var(--enabled-color);

          .hide {
            display: inline-block;
          }

          .show {
            display: none;
          }
        }
      }
    }
  `, toolsWindow);

  notificationsSection = createElementFromHTML(/* html */`
    <section id="notificationsSection">
      <h3>Notifications Settings:</h3>
      <div class="content">
        <ul>
          <li class="${shown?'shown':''}">
            <span>Show on this site</span>
            <button type="button" class="hide">Hide</button>
            <button type="button" class="show">Show</button>
          </li>
        </ul>
      </div>
    </section>
  `);

  const sections = toolsWindow.querySelector('#sections');
  sections.append(notificationsSection);

  notificationsSection.addEventListener('click', (event) => {
    if (event.target.closest('.hide')) {
      const li = event.target.closest('li');
      li.classList.remove('shown');
      localStorage.removeItem('__cwmNotificationsWindowShown');
      window.postMessage({type: '__cwmNotificationsWindowShown', value: 0});
    } else if (event.target.closest('.show')) {
      const li = event.target.closest('li');
      li.classList.add('shown');
      localStorage.setItem('__cwmNotificationsWindowShown', 1);
      window.postMessage({type: '__cwmNotificationsWindowShown', value: 1});
    }
  }, true);
}

////////////////////////////////
//// init
////////////////////////////////

// Show/hide events

function show() {
  shown = true;
  runNotificationWindow();
}

function hide() {
  shown = false;
  // TODO: Send a message so other things can unload
  notificationWindow.remove();
}

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmNotificationsWindowShown') {
    if (event.data.value) {
      show();
    } else {
      hide();
    }
  }
});

window.addEventListener('storage', (event) => {
  if (event.storageArea === localStorage) {
    if (event.key === '__cwmNotificationsWindowShown') {
      if (event.newValue) {
        show();
      } else {
        hide();
      }
    }
  }
});

async function init() {
  if (!shown) return;

  await waitForElement('body');

  runNotificationWindow();
}

init();

////////////////////////////////
//// runNotificationWindow
////////////////////////////////

async function runNotificationWindow() {
  if (notificationWindow) return;

  notificationWindow = createShadowElementFromHTML(`
    <aside id="notificationWindow">
      <h2>Notifications</h2>
    </aside>
  `, createElementFromHTML(`<div id="__cwmNotificationWindow"></div>`));

  addStyle(/* css */`
    {% include greasemonkey/_shared/shadowDomReset.css %}
    {% include greasemonkey/_shared/cwmBase.css %}

    #notificationWindow {
      position: fixed;
      right: 10px;
      top: 50px;
      background: var(--window-background-color);
      border: 1px solid var(--accent-color);
      border-radius: 4px;
      line-height: 1.2;
      overflow: hidden;
      color: var(--color);
      font-family: var(--font-family);
      font-size: var(--font-size);

      h2 {
        margin: 0;
        padding: 4px;
        color: var(--bar-color);
        background: var(--bar-background-color);
        font-weight: normal;
        border-bottom: 1px solid var(--accent-color);
        font-size: inherit;
      }

      ul {
        padding: 0;
        margin: var(--panel-padding);
        display: flex;
        flex-direction: column;
        border: 1px solid var(--accent-color);
        border-bottom: 0;
        border-radius: 4px;
        overflow: hidden;
      }

      li {
        display: flex;
        flex-direction: row;
        background: var(--panel-background-color);
        overflow: hidden;
        line-height: 1.5;
        border-bottom: 1px solid var(--accent-color);

        &.--hidden {
          opacity: .5;
          order: 2;
        }

        .__title {
          font-weight: bold;
          padding: 0 6px;
          display: inline-block;
          color: var(--header-color);
        }

        .__remaining,
        a {
          margin: 0 4px 0 auto;
          padding-left: 4px;
        }

        button {
          box-shadow: none;

          &:not(:first-of-type) {
            border: 0;
          }

          &:first-of-type {
            border-top: 0;
            border-right: 0;
            border-bottom: 0;
            margin-left: var(--panel-padding);
          }
        }
      }
    }
  `, notificationWindow);

  document.body.append(notificationWindow.host);
}

////////////////////////////////
// tools
////////////////////////////////

{% include greasemonkey/_shared/addStyle.js %}

{% include greasemonkey/_shared/createShadowElementFromHTML.js %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/waitForElement.js %}
