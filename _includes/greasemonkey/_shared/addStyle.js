{% unless included_addStyle %}{% assign included_addStyle = true %}

////////////////////////////////
// addStyle
////////////////////////////////

function addStyle(styleString, host) {
  host = host || document.body;

  const style = document.createElement('STYLE');
  style.textContent = styleString;

  host.append(style);

  return style;
}

{% endunless %}