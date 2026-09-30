////////////////////////////////
// createShadowElementFromHTML
////////////////////////////////

{% include greasemonkey/_shared/contentPolicy.js %}

function createShadowElementFromHTML(htmlString, host, closed) {
  if (!host) {
    host = document.createElement('DIV');
    document.body.append(host);
  }

  const shadowRoot = host.attachShadow({ mode: closed ? 'closed' : 'open' });

  const disruptiveEvents = [
    'contextmenu', 'copy', 'cut', 'paste', 
    'keydown', 'keyup', 'keypress', 
    'mousedown', 'mouseup', 'selectstart'
  ];

  disruptiveEvents.forEach(eventType => {
    shadowRoot.addEventListener(eventType, (e) => {
      e.stopPropagation();
    });
  });

  shadowRoot.innerHTML = contentPolicy.createHTML(htmlString);

  shadowRoot.host = host;

  return shadowRoot;
}

