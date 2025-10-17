// ==UserScript==
// @name         Remove C-SPAM stylesheet
// @namespace    http://tampermonkey.net/
// @version      2025-10-17
// @description  try to take over the world!
// @author       WrasslorMonkey
// @match        https://forums.somethingawful.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=somethingawful.com
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  document.querySelector('link[href^="https://i.somethingawful.com/css/269.css"]').remove();
})();