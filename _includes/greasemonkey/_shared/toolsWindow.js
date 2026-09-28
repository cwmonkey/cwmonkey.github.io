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
    <aside>
      <header>
        <h2>Monkey's Tools</h2>
        <button class="close">x</button>
      </header>
      <div id="sections"></div>
      <p><small>(Hold right click and press left click to show this menu)</small></p>
    </aside>
  `, toolsWindowHost);

  toolsWindow.host.id = '__cwmToolsWindow';
  toolsWindow.host.style.display = 'none';

  addStyle(/* css */`
    :host { all: initial }

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
      border: 1px solid #3C3F4F;
      border-right: 0;
      border-top: 0;
      max-width: 400px;
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
      padding: 5px;
      background: #3C3F4F;
      border-radius: 4px;
      color: #ddd;
      margin-bottom: 5px;
      border: 1px solid #6E738F;

      h3 {
        margin-top: 0;
        color: #fff;
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
      padding: 5px;
      background: #3C3F4F;
      padding: 5px;
      margin: 5px;
    }

    .close {
      margin: 0 0 0 auto;
      border-right: 0;
      border-top: 0;
      border-bottom: 0;
      border-radius: 0;
    }
  `, toolsWindow);

  toolsWindow.host.id = id;

  toolsWindow.addEventListener('click', (event) => {
    if (event.target.closest('.close')) {
      toolsWindow.host.style.display = 'none';
    }
  });
}

{% include greasemonkey/_shared/addStyle.js %}

{% endunless %}
