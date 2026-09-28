---
---
{% include greasemonkey/outline-links/meta.js %}

console.log('---=== Outline Links ===---');

{% include greasemonkey/_shared/toolsWindow.js %}

const settings = [
  {text: 'Outline links', key: '__cwmOutline', css: /* css */`
    a:link {
      outline: 3px dashed blue !important;
    }
    a:visited {
      outline: 3px dashed purple !important;
    }
    a:active {
      outline: 3px dashed red !important;
    }
  `},
  {text: 'Outline internal elements of links', key: '__cwmOutlineInternal', css: /* css */`
    a:link * {
      outline: 3px dashed blue !important;
    }
    a:visited * {
      outline: 3px dashed purple !important;
    }
    a:active * {
      outline: 3px dashed red !important;
    }
  `}
];

const styles = {};

async function init() {
  await waitForElement('body');

  settings.forEach((item) => {
    const enabled = localStorage.getItem(item.key);
    styles[item.key] = addStyle(item.css, false);

    if (enabled) {
      document.body.append(styles[item.key]);
    }
  });
}

init();

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmToolsWindow-shown') {
    if (!outlineStylesSection) {
      createOutlineStylesSection();
    }
  }
});

let outlineStylesSection;

function createOutlineStylesSection() {
  outlineStylesSection = createElementFromHTML(/* html */`
    <section id="outlineStylesSection">
      <h3>Outline links:</h3>
      <ul></ul>
    </section>
  `);

  addStyle(/* css */`
    #outlineStylesSection {
      li {
        color: #fcc;

        .disable {
          display: none;
        }

        &.enabled {
          color: #cfc;

          .disable {
            display: inline-block;
          }

          .enable {
            display: none;
          }
        }
      }
    }
  `, toolsWindow);

  const sections = toolsWindow.querySelector('#sections');

  const ul = outlineStylesSection.querySelector('ul');

  settings.forEach((setting) => {
    const li = createElementFromHTML(/* html */`<li>
      <button type="button" class="disable">Disable</button>
      <button type="button" class="enable">Enable</button>
    </li>`);

    const enabled = localStorage.getItem(setting.key);
    const span = createElementFromHTML(`<span>${setting.text}</span>`);
    li.append(span);
    li.dataset.key = setting.key;

    if (enabled) {
      li.classList.add('enabled');
    }

    ul.prepend(li);
  });

  sections.append(outlineStylesSection);

  toolsWindow.addEventListener('click', (event) => {
    if (event.target.closest('.disable')) {
      const li = event.target.closest('li');
      li.classList.remove('enabled');
      localStorage.removeItem(li.dataset.key);
      styles[li.dataset.key].remove();
    } else if (event.target.closest('.enable')) {
      const li = event.target.closest('li');
      li.classList.add('enabled');
      localStorage.setItem(li.dataset.key, 1);
      document.body.append(styles[li.dataset.key]);
    }
  }, true);
}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}

{% include greasemonkey/_shared/waitForElement.js %}
