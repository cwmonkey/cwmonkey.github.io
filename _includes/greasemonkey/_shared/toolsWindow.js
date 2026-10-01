{% unless included_toolsWindow %}{% assign included_toolsWindow = true %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/createShadowElementFromHTML.js %}

let toolsWindow;
const toolsWindowAEL = Element.prototype.addEventListener;
let id = `__cwmToolsWindow-${Date.now() + Math.random()}`.replace('.', '_');
let toolsWindowHost = createElementFromHTML(/* html */`<div id="${id}" class="__cwmToolsWindow"></div>`);
let toolsWindowExistingHost;

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmToolsWindow-shown') {
    if (!toolsWindow) {
      toolsWindow = toolsWindowExistingHost.shadowRoot;
    }
  }
});

async function toolsWindowInit() {
  await waitForElement('body');

  toolsWindowExistingHost = document.body.querySelector('.__cwmToolsWindow');
  if (toolsWindowExistingHost) return;

  document.body.append(toolsWindowHost);

  window.postMessage({type: '__cwmToolsWindow-id', id: id})

  let rmousedown = false;
  let showedToolsWindow = false;

  toolsWindowAEL.apply(document.body, ['mousedown', (event) => {
    if (event.button === 2) rmousedown = true;
  }, true]);

  toolsWindowAEL.apply(document.body, ['click', (event) => {
    if (rmousedown) {
      toggleToolsWindow();
      showedToolsWindow = true;
    }
  }, true]);

  toolsWindowAEL.apply(document.body, ['contextmenu', (event) => {
    if (showedToolsWindow) {
      event.preventDefault();
    }

    rmousedown = false;
    showedToolsWindow = false;
  }, true]);
}

toolsWindowInit();

function toggleToolsWindow() {
  if (!toolsWindow) {
    createToolsWindow();
  }

  if (toolsWindow.host.style.display) {
    toolsWindow.host.style.display = '';
    window.postMessage({type: '__cwmToolsWindow-shown', id: toolsWindow.host.id}, '*');
  } else {
    toolsWindow.host.style.display = 'none';
  }
}

function createToolsWindow() {
  toolsWindow = createShadowElementFromHTML(/* html */`
    <aside data-position-h="${localStorage.getItem('__cwmToolsWindow-positionH')}" data-position-v="${localStorage.getItem('__cwmToolsWindow-positionV')}">
      <header>
        <h2>Monkey's Tools</h2>
        <button class="close">x</button>
      </header>
      <div id="sections"></div>
      <p><small>(Hold right click and press left click to show this menu)</small> <button id="toggle_settings">⚙</button></p>
      <menu id="settings" style="display: none">
        <h3>Window Settings</h3>
        <section id="position">
          <h4>Position (on ${window.location.host})</h4>
          <div clas="content">
            <button id="anchor-top_left" data-position-h="left" data-position-v="top">⇱</button>
            <button id="anchor-top_right" data-position-h="right" data-position-v="top">⇱</button>
            <button id="anchor-bottom_left" data-position-h="left" data-position-v="bottom">⇲</button>
            <button id="anchor-bottom_right" data-position-h="right" data-position-v="bottom">⇲</button>
          </div>
        </section>
      </menu>
    </aside>
  `, toolsWindowHost);

  toolsWindow.host.id = '__cwmToolsWindow';
  toolsWindow.host.style.display = 'none';

  addStyle(/* css */`
    {% include greasemonkey/_shared/shadowDomReset.css %}
    {% include greasemonkey/_shared/cwmBase.css %}

    :host-context(body.__cwmInvertColors) aside {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    * {
      font-family: inherit;
      font-size: inherit;
    }

    aside {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 100000;
      background: #2C2F3F;
      color: #ddd;
      font-size: 12px;
      font-family: arial;
      border-bottom-left-radius: 8px;
      border: 1px solid #6E738F;
      border-right-width: 0;
      border-top-width: 0;
      max-width: 400px;
      overflow: hidden;

      &[data-position-v="top"] {
        &[data-position-h="left"] {
          border-radius: 0;
          border-bottom-left-radius: 8px;
        }

        &[data-position-h="right"] {
        }
      }

      &[data-position-v="bottom"] {
        top: auto;
        bottom: 0;
        border-top-width: 1px;
        border-bottom-width: 0;

        &[data-position-h="left"] {
          border-radius: 0;
          border-top-right-radius: 8px;
        }

        &[data-position-h="right"] {
          border-radius: 0;
          border-top-left-radius: 8px;
        }
      }

      &[data-position-h="left"] {
        right: auto;
        left: 0;
        border-right-width: 1px;
        border-left-width: 0
      }

      &[data-position-h="right"] {
      }
    }

    header {
      background: #f6ecda;
      display: flex;
      flex-direction: row;
    }

    h2 {
      color: #000;
      margin: 0;
      padding: 5px;
    }

    #sections {
      padding: 5px 5px 0 5px;
    }

    section {
      background: #3C3F4F;
      border-radius: 4px;
      color: #ddd;
      margin-bottom: 5px;
      border: 1px solid #6E738F;

      h3,
      h4 {
        margin: 0 0 5px 0;
        color: #fff;
        background: #6E738F;
        padding: 5px;
        font-weight: normal;
      }

      .content {
        padding: 5px;
      }

      ul {
        margin: 0 0 5px 0;
        padding-left: 2em;
      }

      button {
        color: #fff;
        border: 1px solid #6E738F;
        background: #2C2F3F;
        border-radius: 4px;

        &:hover {
          background: #3C3F4F;
        }
      }
    }

    li {
      margin-bottom: 3px;
    }

    p {
      background: #3C3F4F;
      margin: 5px;
      display: flex;
      flex-direction: row;

      small {
        padding: 5px;
      }

      #toggle_settings {
        margin-left: auto;
      }
    }

    .close {
      margin: 0 0 0 auto;
      border-right: 0;
      border-top: 0;
      border-bottom: 0;
      border-radius: 0;
    }

    #settings {
      margin: 5px;
      padding: 0;

      #anchor-top_right,
      #anchor-bottom_left {
        transform: scaleX(-1);
      }
    }
  `, toolsWindow);

  toolsWindow.host.id = id;

  toolsWindow.addEventListener('click', (event) => {
    if (event.target.closest('.close')) {
      toolsWindow.host.style.display = 'none';
    } else if (event.target.closest('#toggle_settings')) {
      const style = toolsWindow.querySelector('#settings').style;
      style.display ? style.display = '' : style.display = 'none';
    } else if (event.target.closest('#position button')) {
      const button = event.target.closest('#position button');
      const aside = toolsWindow.querySelector('aside');
      aside.dataset.positionH = button.dataset.positionH;
      aside.dataset.positionV = button.dataset.positionV;
      localStorage.setItem('__cwmToolsWindow-positionH', button.dataset.positionH);
      localStorage.setItem('__cwmToolsWindow-positionV', button.dataset.positionV);
    }
  });
}

{% include greasemonkey/_shared/addStyle.js %}

{% endunless %}
