---
---
{% include greasemonkey/sa-mobile-friendly/meta.js %}

(function() {
  'use strict';

  const style = document.createElement("STYLE");
  style.textContent = `{% include greasemonkey/sa-mobile-friendly/sa-mobile-friendly.css %}`;

  document.documentElement.append(style);

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
})();