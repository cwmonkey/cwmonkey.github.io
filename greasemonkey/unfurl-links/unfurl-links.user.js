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
    res = await GM.xmlHttpRequest({
      method: 'GET',
      url: a.href,
      anonymous: false,
      headers: {
        'User-Agent': navigator.userAgent,
        'Sec-Ch-Ua': '"Google Chrome";v="125"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': 'Windows',
        'Referer': 'https://' + window.location.host,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    }).catch(e => console.error(e));

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

    if (!data.published) {
      // Just get the first thing that looks like an ISO date
      const matches = [...res.responseText.matchAll(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))/gi)];

      if (matches.length) {
        data.published = matches[0][0];
      }
    }

    // Title fallback
    if (!data.title) {
      const title = page.querySelector('title, h1');
      if (title) data.title = title.textContent;
    }

    if (!data.title) {
      const title = page.querySelector('shreddit-title');
      if (title) data.title = title.getAttribute('title');
    }

    // Description fallback
    if (!data.description) {
      const description = page.querySelector('shreddit-post-text-body');
      if (description) data.description = description.textContent;
    }

    // URL
    if (!data.url) {
      data.url = a.href;
    }

    // image fallback
    if (!data.image) {
      const image = page.querySelector('shreddit-post');
      if (image) data.image = image.getAttribute('content-href');
    }

    if (data.url !== a.href) {
      key = 'unfurl:' + data.url;

      GM.setValue('unfurl:' + a.href, {
        updated: Date.now(),
        url: data.url
      });
    }

    // Icon
    const icon = page.querySelector('link[rel="apple-touch-icon"], link[rel="icon"]');

    if (icon) {
      data.icon = icon.getAttribute('href');
    } else {
      const urlo = new URL('/favicon.ico', data.url);
      data.icon = urlo.href;
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
        position: relative;

        .close {
          opacity: 0;
          position: absolute;
          top: 5px;
          right: 5px;
        }

        &:hover .close {
          opacity: 1;
        }

        .content {
          flex-shrink: 1;

          > :nth-child(2) {
            padding-right: 2em;
          }
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

        .icon {
          max-height: 14px;
          vertical-align: middle;
          margin-right: 3px;
        }

        .description {
          padding: var(--panel-padding);
          margin: 0;
        }

        .reply {
          display: flex;
          flex-direction: row;

          button {
            min-height: 2em;
            flex-grow: 1;
            border-right: 0;
            border-bottom: 0;
          }
        }

        .image {
          width: 100%;
          max-width: 150px;
          position: relative;
          overflow: hidden;

          img {
            object-fit: cover;
            position: absolute;
            min-width: 100%;
            min-height: 100%;
            width: 100%;
            height: 100%;

            &:hover {
              object-fit: contain;
            }
          }
        }
      }
    `, false);

    const card = createShadowElementFromHTML(/* html */`
      <aside id="card">
        ${data.image?`<div class="image"><img src="${new URL(data.image, data.url).href}"></div>`:''}
        <div class="content">
          <button type="button" class="close">×</button>
          ${data.title?`<h3 class="title">${data.title}</h3>`:''}
          ${data.published || data.site || data.icon?`<p class="published">
            ${data.icon?`<img class="icon" src="${new URL(data.icon, data.url).href}">`:''}
            ${data.site?data.site:''}
            ${data.site || data.icon ? ' - ' : ''}
            ${data.published?(new Date(data.published)).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }):''}</p>`:''}
          ${data.description?`<p class="description">${data.description}</p>`:''}
          ${window.location.host==='app.slack.com'?`<div class="reply">
            <button type="button" class="send_to_slack">Reply (Thread)</button>
            <button type="button" class="send_to_slack_broadcast">Reply (Channel)</button>
          </div>`:''}
        </div>
      </aside>
    `);

    card.querySelector('.close').addEventListener('click', () => {
      card.host.remove();
      delete unfurls[a];
    });

    card.querySelector('.send_to_slack')?.addEventListener('click', (event) => {
      sendToSlack(a, data);
    });

    card.querySelector('.send_to_slack_broadcast')?.addEventListener('click', (event) => {
      sendToSlack(a, data, true);
    });

    card.prepend(style);

    a.after(card.host);

    unfurls[a] = card.host;
  }
}

////////////////////////////////
// sendToSlack
////////////////////////////////

function sendToSlack(el, preview, reply_broadcast) {
  if (typeof reply_broadcast === 'undefined') reply_broadcast = false;
  const SLACK_TOKEN = localStorage.getItem('unfurl-links-SLACK_TOKEN') || prompt('Enter Manual UnfURL Reply app token.');
  localStorage.setItem('unfurl-links-SLACK_TOKEN', SLACK_TOKEN);
  const CHANNEL_ID = el.closest('[data-msg-channel-id]').dataset.msgChannelId;
  const THREAD_TS = el.closest('[data-msg-ts]').dataset.msgTs;

  GM_xmlhttpRequest({
    method: 'POST',
    url: 'https://slack.com/api/chat.postMessage',

    headers: {
      "Authorization": `Bearer ${SLACK_TOKEN}`,
      "Content-Type": 'application/json'
    },

    data: JSON.stringify({
      channel: CHANNEL_ID,
      thread_ts: THREAD_TS,
      reply_broadcast: reply_broadcast,

      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*${preview.title}*` +
              `${preview.description||preview.published?`\n\n${preview.published?`_${new Date(preview.published).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}_`:''}${preview.published&&preview.description?' · ':''}${preview.description?preview.description:''}`:''}`
          },
          accessory: {
            type: 'image',
            image_url: preview.image,
            alt_text: preview.title
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'image',
              image_url: preview.icon,
              alt_text: preview.site
            },
            {
              type: 'mrkdwn',
              text: `<${preview.url}|${preview.site}>`
            }
          ]
        }
      ]
    }),

    onload(response) {
      const result = JSON.parse(response.responseText);

      if (!result.ok) {
        console.error('Slack error:', result);
        return;
      }

      console.log('Preview posted:', result.ts);
    },

    onerror(error) {
      console.error('Request failed:', error);
    }
  });
}

////////////////////////////////
//// Tools
////////////////////////////////

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/createShadowElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}
