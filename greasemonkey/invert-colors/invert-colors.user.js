---
---
{% include greasemonkey/invert-colors/meta.js %}

console.log('---=== Invert Colors ===---');

{% include greasemonkey/_shared/toolsWindow.js %}

const settings = [
  {text: 'Invert Colors', key: '__cwmInvertColors', css: /* css */`
    body {
      filter: invert(1) hue-rotate(180deg) !important;
      -webkit-filter: invert(1) hue-rotate(180deg) !important;
    }

    img,
    video {
      filter: invert(1) hue-rotate(180deg) !important;
    }
  `}
];

const styles = {};

async function init() {
  await waitForElement('head');

  settings.forEach(async (item) => {
    const enabled = localStorage.getItem(item.key);
    styles[item.key] = addStyle(item.css, false);

    if (enabled) {
      document.head.append(styles[item.key]);

      await waitForElement('body');
      document.body.classList.add(item.key);
    }
  });
}

init();

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmToolsWindow-shown') {
    if (!invertColorsSection) {
      createInvertColorsSection();
    }
  }
});

let invertColorsSection;

function createInvertColorsSection() {
  invertColorsSection = createElementFromHTML(/* html */`
    <section id="invertColorsSection">
      <h3>Invert Color:</h3>
      <div class="content">
        <ul></ul>
      </div>
    </section>
  `);

  addStyle(/* css */`
    #invertColorsSection {
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

  const ul = invertColorsSection.querySelector('ul');

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

  sections.append(invertColorsSection);

  invertColorsSection.addEventListener('click', (event) => {
    if (event.target.closest('.disable')) {
      const li = event.target.closest('li');
      li.classList.remove('enabled');
      localStorage.removeItem(li.dataset.key);
      styles[li.dataset.key].remove();
      document.body.classList.remove(li.dataset.key);
    } else if (event.target.closest('.enable')) {
      const li = event.target.closest('li');
      li.classList.add('enabled');
      localStorage.setItem(li.dataset.key, 1);
      document.body.append(styles[li.dataset.key]);
      document.body.classList.add(li.dataset.key);
    }
  }, true);
}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}

{% include greasemonkey/_shared/waitForElement.js %}
