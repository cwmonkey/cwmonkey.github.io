{% unless included_toolsWindow %}{% assign included_toolsWindow = true %}

let toolsWindow;

function createToolsWindow() {
  toolsWindow = createShadowElementFromHTML(/* html */`
    <aside>
      <header>
        <h2>CWM Tools</h2>
        <button class="close">x</button>
      </header>
      <div id="sections"></div>
      <p><small>(Hold right click and press left click to show this menu)</small></p>
    </aside>
  `);

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
      padding: 5px;
    }

    section {
      padding: 5px;
      background: #3C3F4F;
      border-radius: 4px;
      color: #ddd;

      h3 {
        margin-top: 0;
        color: #fff;
      }
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
  `, toolsWindow);

  toolsWindow.addEventListener('click', (event) => {
    if (event.target.closest('.close')) {
      toolsWindow.host.remove();
    }
  });
}

function showToolsWindow() {
  if (!toolsWindow) {
    createToolsWindow();
  }
}

{% include greasemonkey/_shared/createShadowElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}

{% endunless %}
