---
---
{% include greasemonkey/sa-mobile-friendly/meta.js %}

(function() {
  'use strict';

  // Add mobile stylesheet
  const style = document.createElement("STYLE");
  style.textContent = `{% include greasemonkey/sa-mobile-friendly/sa-mobile-friendly.css %}`;

  document.documentElement.append(style);

  // Add mobile meta tag
  function addMeta() {
    const head = document.querySelector('head');
    const meta = document.createElement('meta');

    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=device-width , initial-scale=1.0');

    head.appendChild(meta);
  }

  function tryAddMeta() {
    if (document.head) {
      addMeta();
    } else {
      setTimeout(tryAddMeta, 0);
    }
  }

  tryAddMeta();

  // Add mobile menu button
  let $container = null;
  const bodyOpenClass = 'sa-mobile-friendly-menu-button-clicked';

  function addMobileButton() {
    const $button = document.createElement('BUTTON');
    $button.className = 'sa-mobile-friendly-menu-button';
    $button.textContent = 'Show Navigation';

    $button.addEventListener('click', () => {
      if (document.body.classList.contains(bodyOpenClass)) {
        document.body.classList.remove(bodyOpenClass);
      } else {
        document.body.classList.add(bodyOpenClass);
      }
    });

    document.body.append($button);
  }

  function tryAddMobileButton() {
    if (document.body) {
      addMobileButton();
    } else {
      setTimeout(tryAddMeta, 100);
    }
  }

  tryAddMobileButton();
})();