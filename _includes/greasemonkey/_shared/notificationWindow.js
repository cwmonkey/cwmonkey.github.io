{% unless included_notificationWindow %}{% assign included_notificationWindow = true %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/createShadowElementFromHTML.js %}

let shown = localStorage.getItem('__cwmNotificationsWindowShown');

////////////////////////////////
//// toolsWindow
////////////////////////////////

{% include greasemonkey/_shared/toolsWindow.js %}

////////////////////////////////
//// createNotificationsSection
////////////////////////////////

let notificationsSection;

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
  notificationWindow.host.style.display = '';
}

function hide() {
  shown = false;
  notificationWindow.host.style.display = 'none';
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

////////////////////////////////
//// notificationWindowInit
////////////////////////////////

let notificationWindow;
const notificationWindowAEL = Element.prototype.addEventListener;
let notificationWindowId = `__cwmNotificationWindow-${Date.now() + Math.random()}`.replace('.', '_');
let notificationWindowHost = createElementFromHTML(/* html */`<div id="${notificationWindowId}" class="__cwmNotificationWindow"></div>`);
let notificationWindowExistingHost;

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmNotificationWindow-shown') {
    if (!notificationWindow) {
      notificationWindow = notificationWindowExistingHost.shadowRoot;
    }
  }
});

async function notificationWindowInit() {
  await waitForElement('body');

  notificationWindowExistingHost = document.body.querySelector('.__cwmNotificationWindow');
  if (notificationWindowExistingHost) return;

  document.body.append(notificationWindowHost);

  window.postMessage({type: '__cwmNotificationWindow-id', id: notificationWindowId})

  // Create notification section when main window is shown
  window.addEventListener('message', (event) => {
    if (event.data.type === '__cwmToolsWindow-shown') {
      if (!notificationsSection) {
        createNotificationsSection();
      }
    }
  });

  let rmousedown = false;
  let showedNotificationWindow = false;

  notificationWindowAEL.apply(document.body, ['mousedown', (event) => {
    if (event.button === 2) rmousedown = true;
  }, true]);

  notificationWindowAEL.apply(document.body, ['click', (event) => {
    if (rmousedown) {
      toggleNotificationWindow();
      showedNotificationWindow = true;
    }
  }, true]);

  notificationWindowAEL.apply(document.body, ['contextmenu', (event) => {
    if (showedNotificationWindow) {
      event.preventDefault();
    }

    rmousedown = false;
    showedNotificationWindow = false;
  }, true]);

  if (localStorage.getItem('__cwmNotificationsWindowShown')) {
    toggleNotificationWindow();
  }
}

notificationWindowInit();

function toggleNotificationWindow() {
  if (!notificationWindow) {
    createNotificationWindow();
  }

  if (notificationWindow.host.style.display) {
    notificationWindow.host.style.display = '';
    window.postMessage({type: '__cwmNotificationWindow-shown', id: notificationWindow.host.id}, '*');
  } else {
    notificationWindow.host.style.display = 'none';
  }
}

function createNotificationWindow() {
  notificationWindow = createShadowElementFromHTML(/* html */`
    <aside id="notificationWindow">
      <h2>Notifications</h2>
    </aside>
  `, notificationWindowHost);

  // notificationWindow.host.id = '__cwmNotificationWindow';
  notificationWindow.host.style.display = 'none';

  addStyle(/* css */`
    {% include greasemonkey/_shared/shadowDomReset.css %}
    {% include greasemonkey/_shared/cwmBase.css %}

    #notificationWindow {
      :host-context(body.__cwmInvertColors) & {
        filter: invert(1) hue-rotate(180deg) !important;
      }

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

  // notificationWindow.host.id = notificationWindowId;

  /* notificationWindow.addEventListener('click', (event) => {
    if (event.target.closest('.close')) {
      notificationWindow.host.style.display = 'none';
    } else if (event.target.closest('#toggle_settings')) {
      const style = notificationWindow.querySelector('#settings').style;
      style.display ? style.display = '' : style.display = 'none';
    } else if (event.target.closest('#position button')) {
      const button = event.target.closest('#position button');
      const aside = notificationWindow.querySelector('aside');
      aside.dataset.positionH = button.dataset.positionH;
      aside.dataset.positionV = button.dataset.positionV;
      localStorage.setItem('__cwmNotificationWindow-positionH', button.dataset.positionH);
      localStorage.setItem('__cwmNotificationWindow-positionV', button.dataset.positionV);
    }
  });*/
}

{% include greasemonkey/_shared/addStyle.js %}

{% endunless %}
