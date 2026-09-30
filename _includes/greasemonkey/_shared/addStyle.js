{% unless included_addStyle %}{% assign included_addStyle = true %}

////////////////////////////////
// addStyle
////////////////////////////////

function addStyle(styleString, host, id) {
  const style = document.createElement('STYLE');
  style.textContent = styleString;
  if (id) style.id = id;

  // host is falsey, just return element
  if (typeof host !== 'undefined' && !host) {
    return style;
  }

  // host undefined, safely attach to head
  if (typeof host === 'undefined') {
    if (document.head) {
      document.head.append(style);
    } else {
      const INTR = setInterval(() => {
        if (document.head) {
          document.head.append(style);
          clearInterval(INTR);
        }
      }, 30);
    }
  } else {
    host.append(style)
  }

  return style;
}

{% endunless %}