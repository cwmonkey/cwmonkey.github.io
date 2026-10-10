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

  let key = `unfurl:${a.href}`;
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
    let url = a.href;
    let fetchUrl = url;
    let json = false;

    // Meta defaults
    let properties = [
      ['title', 'og:title'],
      ['title', 'twitter:title'],
      ['url', 'og:url'],
      ['image', 'og:image'],
      ['image', 'og:image:url'],
      ['image', 'twitter:image'],
      ['alt', 'og:image:alt'],
      ['alt', 'twitter:image:alt'],
      ['description', 'og:description'],
      ['description', 'description'],
      ['published', 'article:published_time'],
      ['published', 'datePublished'],
      ['site', 'og:site_name'],
      ['site', 'twitter:site'],
    ];

    const matches = [...url.matchAll(/^https:\/\/truthsocial\.com\/@[^\/]+\/posts\/([0-9]+)/gi)];
    if (matches.length) {
      fetchUrl = `https://truthsocial.com/api/v1/statuses/${matches[0][1]}`;
      json = true;
    }

    res = await GM.xmlHttpRequest({
      method: 'GET',
      url: fetchUrl,
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
      },
      responseType: json ? 'json' : 'text'
    }).catch(e => console.error(e));

    data = {
      updated: Date.now()
    };

    if (json) {
      jsonRes = res.response;

      data.url = jsonRes.url;
      data.title = `${jsonRes.account.display_name} (@${jsonRes.account.username})`;
      data.description = jsonRes.content.replace(/(^<p>)|(<\/p>$)/ig, '');
      //data.image = jsonRes.account.avatar_static;
      //data.alt = jsonRes.account.display_name;
      if (jsonRes.media_attachments) {
        jsonRes.media_attachments.forEach((att) => {
          if (data.image) return;
          if (att.type === 'image') {
            data.image = att.preview_url;
            data.alt = att.description || '';
          }
        });
      }
      data.published = jsonRes.created_at;
      data.site = 'TruthSocial';
      data.icon = 'https://truthsocial.com/favicon.ico';
    } else {
      const page = new DOMParser().parseFromString(res.responseText, "text/html");

      if (url.match(/^https:\/\/(x|twitter)\.com/)) {
        data.description = page.querySelector('h1.sr-only').textContent;
      }

      properties.forEach((property) => {
        if (!data[property[0]]) {
          const meta = page.querySelector(`meta[property="${property[1]}"], meta[itemprop="${property[1]}"], meta[name="${property[1]}"]`);

          if (meta) {
            data[property[0]] = meta.getAttribute('content');

            if (property[0] === 'url') {
              data[property[0]] = new URL(data[property[0]], a.href)
            }
          }
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
        // reddit, wikipedia
        const description = page.querySelector('shreddit-post-text-body, main section p:not([role="note"]):not([class*="empty"])');
        if (description) data.description = description.textContent;
      }

      // URL
      if (!data.url) {
        data.url = a.href;
      }

      // Site fallback
      if (!data.site) {
        data.site = new URL('/', data.url).host;
      }

      // image fallback
      if (!data.image) {
        const selectors = ['shreddit-post', 'figure img', 'article img', 'main img', 'img'];

        selectors.forEach((selector) => {
          if (data.image) return;
          const image = page.querySelector(selector);
          if (!image) return;
          data.image = image.getAttribute('content-href') || new URL(image.getAttribute('src'), data.url).href;
        });
      }

      if (data.url !== a.href) {
        key = 'unfurl:' + data.url;

        GM.setValue('unfurl:' + a.href, {
          updated: Date.now(),
          url: data.url
        });
      }

      // Icon
      const icon = page.querySelector('link[rel="apple-touch-icon"], link[rel*="icon"]');

      if (icon) {
        data.icon = icon.getAttribute('href');
      } else {
        const urlo = new URL('/favicon.ico', data.url);
        data.icon = urlo.href;
      }
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
        display: table;
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
          display: table-cell;
          width: 100%;

          > :nth-child(3) {
            padding-right: 2em;
          }
        }

        .title {
          margin: 0;
          color: var(--header-color);
          padding: var(--panel-padding);
          padding-bottom: 0;
        }

        .published {
          font-style: italic;
          padding: var(--panel-padding);
          padding-bottom: 0;
          font-size: 12px;
          margin: 0;
        }

        .icon {
          max-height: 14px;
          vertical-align: top;
          margin-right: 3px;
        }

        .description {
          padding: var(--panel-padding);
          padding-bottom: 0;
          margin: 0;
          white-space: break-spaces;
        }

        .content > :last-child {
          padding-bottom: var(--panel-padding);
        }

        .reply {
          display: flex;
          flex-direction: row;
          flex-shrink: 1;
          flex-grow: 1;

          button {
            min-height: 2em;
            flex-grow: 1;
            border-right: 0;
            border-bottom: 0;
            border-left-width: 0;
          }
        }

        .image {
          width: 150px;
          min-width: 150px;
          max-height: 250px;
          position: relative;
          overflow: hidden;
          float: right;

          img {
            width: 100%;
            height: 100%;
            max-height: 250px;
            display: block;

            &:hover {
              object-fit: contain;
            }
          }

          ~ .content .reply button{
            border-left-width: 1px;
          }
        }
      }
    `, false);

    let card;

    try {
      card = createShadowElementFromHTML(/* html */`
        <aside id="card">
          <div class="content">
            <button type="button" class="close">×</button>
            ${data.image?`<div class="image"><img src="${new URL(data.image, data.url).href}"></div>`:''}
            ${data.title?`<h3 class="title">${data.title}</h3>`:''}
            ${data.published || data.site?`<p class="published">
              ${data.icon?`<img class="icon" src="${new URL(data.icon, data.url).href}">`:''}
              ${data.site?data.site:''}
              ${(data.site || data.icon) && data.published ? ' - ' : ''}
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
    } catch(err) {
      GM.deleteValue(key);
      GM.deleteValue(`unfurl:${a.href}`);
    }

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

    card.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => {
        if (img.src.startsWith('data:')) {
          img.remove();
        }

        GM.xmlHttpRequest({
          method: 'GET',
          url: img.src,
          responseType: 'arraybuffer',
          onload: (response) => {
            const bytes = new Uint8Array(response.response);
            let binary = '';
            for (const byte of bytes) binary += String.fromCharCode(byte);

            const base64 = btoa(binary);
            const contentType = response.responseHeaders
              .match(/^content-type:\s*([^\r\n]+)/im)?.[1]
              ?.trim() || 'application/octet-stream';

            img.src = `data:${contentType};base64,${base64}`;
          },
        });
      });
    });

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
              `> *${preview.title.replace(/\n/g, ' ')}*` +
              `${preview.description||preview.published?`\n> ${preview.published?`_<!date^${Math.round(new Date(preview.published).getTime()/1000)}^{date}, {time}|${new Date(preview.published).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}>_`:''}${preview.published&&preview.description?' · ':''}${preview.description?preview.description.replace(/\n/g, ' '):''}`:''}`
          },
          ...(preview.image && { accessory: {
            type: 'image',
            image_url: preview.image,
            alt_text: preview.title
          }})
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
