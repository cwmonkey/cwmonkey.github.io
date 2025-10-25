---
---
{% include greasemonkey/sa-remove-subforum-stylesheets/meta.js %}

(function() {
  'use strict';

  const subforumRegex = /[0-9]+\.css.*$/;

  function removeStylesheets() {
    document.querySelectorAll('link[href^="https://i.somethingawful.com/css/"]').forEach(el => {
      if (el.href.match(subforumRegex)) el.remove();
    });

    document.querySelectorAll(`link[href^="https://i.somethingawful.com/css/platicons.css"] + link[type="text/css"],
    link[href^="https://i.somethingawful.com/css/platicons.css"] + style,
    link[href^="https://i.somethingawful.com/css/platicons.css"] + style + link[type="text/css"]`).forEach(el => el.remove());
  }

  function tryRemoveStylesheets() {
    if (document.body) {
      removeStylesheets();
    } else {
      setTimeout(tryRemoveStylesheets, 0);
    }
  }

  tryRemoveStylesheets();
})();