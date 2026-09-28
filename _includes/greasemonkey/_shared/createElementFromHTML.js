{% unless included_createElementFromHTML %}{% assign included_createElementFromHTML = true %}

{% include greasemonkey/_shared/contentPolicy.js %}

////////////////////////////////
// createElementFromHTML
////////////////////////////////

function createElementFromHTML(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = contentPolicy.createHTML(htmlString.trim());
  return template.content.firstElementChild;
}

{% endunless %}