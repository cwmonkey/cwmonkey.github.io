////////////////////////////////
// createShadowElementFromHTML
////////////////////////////////

function createShadowElementFromHTML(htmlString, host) {
  if (!host) {
    host = document.createElement('DIV');
    document.body.append(host);
  }

  const shadowRoot = host.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = contentPolicy.createHTML(htmlString);

  shadowRoot.host = host;

  return shadowRoot;
}

