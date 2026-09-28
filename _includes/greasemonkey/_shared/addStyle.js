{% unless included_addStyle %}{% assign included_addStyle = true %}

////////////////////////////////
// addStyle
////////////////////////////////

function addStyle(styleString, host) {
  host = typeof host !== 'undefined' ? host : document.body;

  const style = document.createElement('STYLE');
  style.textContent = styleString;

  if (host) host.append(style);

  return style;
}

{% endunless %}