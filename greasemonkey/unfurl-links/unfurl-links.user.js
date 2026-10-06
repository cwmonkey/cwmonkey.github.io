---
---
{% include greasemonkey/unfurl-links/meta.js %}

console.log('---=== UnfURL Links ===---');

////////////////////////////////
// init
////////////////////////////////

async function init() {
  await waitForElement('body');

  // Hold right click and click left click on a link to unfurl
  // TODO: long press
  let currentUnfurlA;
  let unfurlRightClicking = false;
  let unfurlRightLeftClicked = false;
  let unfurlTO;

  document.body.addEventListener('mousedown', (event) => {
    let a;

    if ((a = event.target.closest('a')) && event.button === 2) {
      currentUnfurlA = a;
      unfurlRightClicking = true;
      document.body.classList.add('__cwmToolsWindow--takeNoAction');
    } else if (event.button === 1 && a) {
      currentUnfurlA = a;
    }
  }, true);

  document.body.addEventListener('click', (event) => {
    let a;

    if ((a = event.target.closest('a')) && a === currentUnfurlA && unfurlRightClicking) {
      event.preventDefault();
      event.stopPropagation();
      unfurlRightLeftClicked = true;
    }
  }, true);

  document.body.addEventListener('contextmenu', (event) => {
    let a;

    if ((a = event.target.closest('a')) && unfurlRightLeftClicked) {
      unfurl(currentUnfurlA);
      event.preventDefault();
      event.stopPropagation();
    }

    currentUnfurlA = null;
    unfurlRightClicking = false;
    unfurlRightLeftClicked = false;
    setTimeout(() => {document.body.classList.remove('__cwmToolsWindow--takeNoAction')}, 0);
  }, true);
}

init();

////////////////////////////////
// unfurl
////////////////////////////////

unfurls = {};
async function unfurl(a, force) {
  if (unfurls[a]) {
    unfurls[a].remove();
    force = true;
  }

  let key = `unfurl:${a.href}`
  let data;

  if (!force) {
    data = await GM.getValue(key);

    // Clean URL provided before
    if (data && data.url && data.url !== a.href) {
      data = await GM.getValue('unfurl:' + data.url);
    }
  }

  // No cached data
  if (!data) {
    res = await GM.xmlHttpRequest({url: a.href}).catch(e => console.error(e));

    const page = new DOMParser().parseFromString(res.responseText, "text/html");

    data = {
      updated: Date.now()
    };

    // Metas
    const properties = [
      ['title', 'og:title'],
      ['title', 'twitter:title'],
      ['url', 'og:url'],
      ['image', 'og:image'],
      ['image', 'og:image:url'],
      ['image', 'twitter:image'],
      ['alt', 'og:image:alt'],
      ['alt', 'twitter:image:alt'],
      ['description', 'og:description'],
      ['published', 'article:published_time'],
      ['published', 'datePublished'],
      ['site', 'og:site_name'],
      ['site', 'twitter:site'],
    ];

    properties.forEach((property) => {
      if (!data[property[0]]) {
        const meta = page.querySelector(`meta[property="${property[1]}"], meta[itemprop="${property[1]}"]`);

        if (meta) data[property[0]] = meta.getAttribute('content');
      }
    });

    // Published fallback
    if (!data.published) {
      const time = page.querySelector('time[datetime]');

      if (time) data.published = time.getAttribute('datetime');
    }

    // Title fallback
    if (!data.title) {
      const title = page.querySelector('title, h1');
      if (title) data.title = title.textContent;
    }

    // Icon
    const icon = page.querySelector('link[rel="apple-touch-icon"], link[rel="icon"]');

    if (icon) {
      data.icon = icon.getAttribute('href');
    }

    if (!data.url) {
      data.url = a.href;
    }

    if (data.url !== a.href) {
      key = 'unfurl:' + data.url;

      GM.setValue('unfurl:' + a.href, {
        updated: Date.now(),
        url: data.url
      });
    }

    GM.setValue(key, data);
  }

  if (data) {
    const style = addStyle(/* css */`
      {% include greasemonkey/_shared/shadowDomReset.css %}
      {% include greasemonkey/_shared/cwmBase.css %}

      :host-context(body.__cwmInvertColors) aside {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      #card {
        :host-context(body.__cwmInvertColors) & {
          filter: invert(1) hue-rotate(180deg) !important;
        }

        background: var(--window-background-color);
        border: 1px solid var(--accent-color);
        border-radius: 4px;
        line-height: 1.4;
        overflow: hidden;
        color: var(--color);
        font-family: var(--font-family);
        font-size: var(--font-size);
        display: flex;
        flex-direction: row;
        max-width: 720px;

        .content {
          flex-shrink: 1;
        }

        .title {
          margin: 0;
          color: var(--header-color);
          padding: var(--panel-padding);
        }

        .published {
          font-style: italic;
          padding: 0 var(--panel-padding);
          font-size: 12px;
          margin: 0;
        }

        .description {
          padding: var(--panel-padding);
          margin: 0;
        }

        .site {
          padding: var(--panel-padding);
          padding-top: 0;
          font-size: 12px;
          font-style: italic;
          margin: 0;
        }

        .icon {
          height: 14px;
          vertical-align: middle;
        }

        .image {
          width: 100%;
          max-width: 150px;
          position: relative;
          overflow: hidden;

          img {
            object-fit: cover;
            width: 100%;
            position: absolute;
          }
        }
      }
    `, false);

    const card = createShadowElementFromHTML(/* html */`
      <aside id="card">
        ${data.image?`<div class="image"><img src="${new URL(data.image, data.url).href}"></div>`:''}
        <div class="content">
          ${data.title?`<h3 class="title">${data.title}</h3>`:''}
          ${data.published?`<p class="published">Published: ${(new Date(data.published)).toLocaleString()}</p>`:''}
          ${data.description?`<p class="description">${data.description}</p>`:''}
          ${data.site || data.icon ? `<div class="site">
            ${data.icon?`<img class="icon" src="${new URL(data.icon, data.url).href}">`:''}
            ${data.site && data.icon ? ' - ' : ''}
            ${data.site?data.site:''}
          </div>`:''}
        </div>
      </aside>
    `);

    card.prepend(style);

    a.after(card.host);

    unfurls[a] = card.host;
  }
}

////////////////////////////////
//// Tools
////////////////////////////////

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/createShadowElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}
