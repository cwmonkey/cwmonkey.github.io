---
---
{% include greasemonkey/discord-snippets/meta.js %}

console.log('---=== Discord Snippets ===---');


////////////////////////////////
// Markdown converters
////////////////////////////////

const turndownService = new TurndownService();

const allowedTags = ['strong', 'em', 'ul', 'ol', 'li', 'blockquote'];

turndownService.addRule('restrictTags', {
  filter: function (node) {
    return !allowedTags.includes(node.nodeName.toLowerCase());
  },
  replacement: function (content) {
    return content;
  }
});

turndownService.addRule('multilineBlockquote', {
  filter: 'blockquote',
  replacement: function (content) {
    let formatted = content
      .trim()
      .split('{BR}')
      .map(line => line.trim())
      .map(line => `> ${line}`)
      .join('\n'); // Add markdown spacing

    return formatted + '\n\n';
  }
});

/* global showdown */
const converter = new showdown.Converter();

////////////////////////////////
// init
////////////////////////////////

async function init() {
  await waitForElement('body');

  observe(document.body, { attributes: false, childList: true, subtree: true }, update);

  snippetMessageActionsInit();
  snippetWindowInit();
}

init();

////////////////////////////////
// showSnippetWindow
////////////////////////////////

GM_addStyle(/* css */`
  .__snippetWindow_wrapper {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    &.__snippetWindow--hidden {
      display: none;
    }
    z-index: 9999;
  }

  .__snippetWindow {
    position: fixed;
    right: 20px;
    bottom: 70px;
    background: #242429;
    border: 1px solid #2b2b2f;
    border-radius: 16px;
    color: #fff;
    max-width: 60%;
    width: 600px;
    font-size: 14px;
    overflow: hidden;
    max-height: calc(100vh - 170px);
    display: flex;
    flex-direction: column;
    z-index: 10000;

    .__snippetWindow_header {
      padding: 16px;
      font-size: 24px;
      background: #242429;
      border-bottom: 1px solid #35353b;
      font-weight: bold;
      flex-shrink: 1;

      .__snippetWindow_header_icon {
        vertical-align: bottom;
      }
    }

    .__snippetWindow_inner {
      padding: 8px;
      flex-grow: 1;
      overflow: auto;
    }

    .__snippetWindow_section {
      background: #28282d;
      border: 1px solid #35353b;
      border-radius: 8px;
      padding: 12px;

      &:not(:last-child) {
        margin-bottom: 12px;
      }

      .__snippetWindow_section_header {
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 12px;

        &:empty {
          display: none;
        }
      }

      .__snippetWindow_section_config {
        padding: 7px;
        background: #242429;
        border: 1px solid #3b3b41;
        border-left-width: 4px;
        border-left-color: #9c56b3;
        border-radius: 4px;
        margin-bottom: 7px;
      }

      .__snippetWindow_section_settings {
        margin: 0;
        display: flex;
        flex-direction: row;

        .__delete {
          margin-left: auto;
          opacity: .5;
          background: transparent;
          border: 0;

          &:hover {
            opacity: 1;
          }
        }
      }

      .__snippetWindow_section_extra {
        padding-bottom: 7px;
        border-bottom: 1px solid #3b3b41;
        margin-bottom: 7px;
        word-break: break-word;

        &:empty {
          display: none;
        }
      }

      .__snippetWindow_section_link {
        margin-bottom: 7px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        width: 100%;
      }

      .__snippetWindow_section_content {
        padding-top: 7px;

        ol {
          margin-top: 7px;
        }

        p {
          margin-bottom: 7px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        li {
          padding: 7px;
          background: #121214;
          border: 1px solid #3b3b41;
          border-left: 4px solid #1e2327;
          border-radius: 4px;
          word-break: break-word;
          padding: 11px;
          margin-bottom: 7px;

          &:hover {
            background: #222225;
            cursor: pointer;
          }
        }
      }
    }
  }
`);

const snippetWindowHTML = /* html */`
  <div class="__snippetWindow_wrapper __snippetWindow--hidden" id="__snippetWindow_wrapper">
    <div id="__snippetWindow" class="__snippetWindow">
      <h2 class="__snippetWindow_header">
        <svg aria-hidden="true" class="__snippetWindow_header_icon" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="m13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z" class=""></path></svg>
        Snippets
      </h2>
      <div class="__snippetWindow_inner">
      </div>
    </div>
  </div>
`;

function snippetWindowInit() {
  function writePost(ev, send) {
    const li = ev.target.closest('.__snippetWindow_section_content li, .__snippetWindow_section_content blockquote');

    if (li) {
      const editor = document.querySelector('div[role="textbox"]');

      const section = li.closest('.__snippetWindow_section');
      const extraCheckbox = section.querySelector('.__snippetWindow_section_extraCheckbox');
      const quoteCheckbox = section.querySelector('.__snippetWindow_section_quoteCheckbox');
      const snippet = (quoteCheckbox.checked ? '> ' : '') + li.textContent;

      if (editor) simulatePaste(editor, (extraCheckbox.checked && snippetWindowSections[section.dataset.key].extra ? snippetWindowSections[section.dataset.key].extra + "\n\n" : '') + snippet);

      hideSnippetWindow();

      if (send) setTimeout(() => document.querySelector('[aria-label="Send Message"]').click(), 100);
      return true;
    }

    return false;
  }

  document.body.addEventListener('click', (ev) => {
    if (writePost(ev)) return;

    const del = ev.target.closest('.__delete');

    if (del) {
      const section = ev.target.closest('.__snippetWindow_section');

      GM.deleteValue(section.dataset.key);

      section.remove();
    }
  });

  document.body.addEventListener('contextmenu', (ev) => {
    if (writePost(ev, true)) return;
  }, true);

  document.body.addEventListener('change', (ev) => {
    if (ev.target.matches('.__snippetWindow_section_serverCheckbox')) {
      const section = ev.target.closest('.__snippetWindow_section');

      if (ev.target.checked) {
        section.classList.add('__snippetWindow_onlyShowOnServer');
      } else {
        section.classList.remove('__snippetWindow_onlyShowOnServer');
      }

      snippetWindowSections[section.dataset.key].onlyShowOnServer = ev.target.checked;
      GM.setValue(section.dataset.key, section.dataset.data);
    } else if (ev.target.matches('.__snippetWindow_section_quoteCheckbox')) {
      const section = ev.target.closest('.__snippetWindow_section');
      snippetWindowSections[section.dataset.key].quote = ev.target.checked;
      GM.setValue(section.dataset.key, section.dataset.data);
    } else if (ev.target.matches('.__snippetWindow_section_extraCheckbox')) {
      const section = ev.target.closest('.__snippetWindow_section');

      if (ev.target.checked) {
        snippetWindowSections[section.dataset.key].extra = prompt('Enter text to be prepended to each snippet:', snippetWindowSections[section.dataset.key].extra) || '';
      }

      if (!snippetWindowSections[section.dataset.key].extra) ev.target.checked = false;

      const extra = section.querySelector('.__snippetWindow_section_extra');
      extra.textContent = snippetWindowSections[section.dataset.key].extra;
      snippetWindowSections[section.dataset.key].extraChecked = ev.target.checked;
      GM.setValue(section.dataset.key, snippetWindowSections[section.dataset.key]);
    }
  });
}

let snippetWindow;
let snippetWindowWrapper;

function simulatePaste(targetElement, data){
  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/plain', data);

  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData: dataTransfer
  });

  targetElement.focus();
  targetElement.dispatchEvent(pasteEvent);
}

function addSnippetWindowSection(key, data) {
  makeSnippetWindowWrapper();
  const inner = snippetWindow.querySelector('.__snippetWindow_inner');

  inner.querySelector(`[data-key="${key}"]`)?.remove();

  const section = createElementFromHTML(/* html */`
    <section class="__snippetWindow_section ${data.onlyShowOnServer?'__snippetWindow_onlyShowOnServer':''} ${data.server?'__snippetWindow_server' + data.server:''}">
      <h3 class="__snippetWindow_section_header">${data.header?data.header:''}</h3>
      <div class="__snippetWindow_section_config">
        <p class="__snippetWindow_section_extra">${data.extra?data.extra:''}</p>
        <p class="__snippetWindow_section_settings">
          <label class="__snippetWindow_section_extraWrapper">
            <input type="checkbox" class="__snippetWindow_section_extraCheckbox" ${data.extraChecked && data.extra?'checked':''}> Show extra
          </label>
          <label>
            <input type="checkbox" class="__snippetWindow_section_serverCheckbox" ${data.onlyShowOnServer?'checked':''}> Only on home server
          </label>
          <label>
            <input type="checkbox" class="__snippetWindow_section_quoteCheckbox" ${data.quote?'checked':''}> Add quote tags
          </label>
          <button class="__delete">❌</button>
        </p>
        ${data.link ?
          `<p class="__snippetWindow_section_link">From post: <a href="${data.link}">${data.link}</a></p>` : ``
        }
      </div>
      <div class="__snippetWindow_section_content"></div>
    </section>
  `);

  if (data.server) {
    GM_addStyle(/* css */`
      .__snippetWindow_onlyShowOnServer.__snippetWindow_server${data.server} {
        display: none;

        .__server_${data.server} & {
          display: block;
        }
      }
    `);
  }

  section.dataset.key = key;

  const content = section.querySelector('.__snippetWindow_section_content');
  content.innerHTML = converter.makeHtml(data.html)
    .replace(/<blockquote>[\s\n]*/g, '<ul><li>')
    .replace(/[\s\n]*<\/blockquote>/g, '</li></ul>')
    .replace(/[ ]*(?=<p>)/g, '')
    .trim();

  content.querySelectorAll('[class^="hiddenVisually_"], [class^="timestamp_"], [class^="codeActions__"]').forEach(el => el.remove());

  inner.append(section);
}

const snippetWindowSections = {}

async function makeSnippetWindowWrapper() {
  if (!snippetWindowWrapper) {
    snippetWindowWrapper = createElementFromHTML(snippetWindowHTML);

    snippetWindowWrapper.addEventListener('click', (ev) => {
      if (ev.target === snippetWindowWrapper) hideSnippetWindow();
    });

    snippetWindow = snippetWindowWrapper.querySelector('#__snippetWindow');

    const values = await GM.listValues();
    values.forEach(async (value) => {
      if (value.match(/^snippet-item:/)) {
        const data = await GM.getValue(value);
        snippetWindowSections[value] = data;
        addSnippetWindowSection(value, data);
      }
    });
  }
}

async function showSnippetWindow() {
  await makeSnippetWindowWrapper();

  if (!document.querySelector('#__snippetWindow')) document.body.append(snippetWindowWrapper);

  const visible = snippetWindowWrapper.checkVisibility();

  if (!visible) {
    snippetWindowWrapper.classList.remove('__snippetWindow--hidden');
  } else {
    snippetWindowWrapper.classList.add('__snippetWindow--hidden');
  }
}

function hideSnippetWindow() {
  snippetWindowWrapper.classList.add('__snippetWindow--hidden');
}

////////////////////////////////
// checkSnippetButton
////////////////////////////////

let checkSnippetButtonDelayTO;
function checkSnippetButtonDelay() {
  clearTimeout(checkSnippetButtonDelayTO);
  checkSnippetButtonDelayTO = setTimeout(checkSnippetButton, 100);
}

let snippetButtonContainer;
function checkSnippetButton() {
  const buttons = document.querySelector('[class^="channelBottomBarArea_"] [class^="buttons__"]');

  if (!buttons) return;

  if (!snippetButtonContainer) {
    let firstClass = 'container__5287f';
    let inner1Class = 'button__74017 button__24af7';
    let inner2Class = 'buttonWrapper__24af7';

    const first = buttons.childNodes[0];
    if (first) {
      firstClass = first.className;
      const inner1 = first.childNodes[0];
      if (inner1) {
        inner1Class = inner1.className;
        const inner2 = inner1.childNodes[0];
        if (inner2) {
          inner2Class = inner2.className;
        }
      }
    }

    snippetButtonContainer = createElementFromHTML(/* html */`
      <div class="${firstClass}" id="__ds_snippets"><div class="${inner1Class}" role="button"><div class="${inner2Class}" style="width:20px;height:20px;">
        <!-- svg aria-hidden="true" class="icon_c1e9c4" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="m13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z" class=""></path></svg -->
        <img src="/assets/5f6b1b0353091184.svg" class="icon_c1e9c4">
      </div></div></div>
    `);

    const snippetButton = snippetButtonContainer.querySelector('[role="button"]');

    snippetButton.addEventListener('click', showSnippetWindow);
  }

  if (!buttons.querySelector('#__ds_snippets')) {
    buttons.prepend(snippetButtonContainer);
  }
}

////////////////////////////////
// message actions
////////////////////////////////

GM_addStyle(/* css */`
  .__snippetMessageActions_image {
    font-weight: bold;
    font-size: 30px;
    text-shadow: 1px 1px 1px #000;
    color: #0f0;
    line-height: 26px;
    text-indent: 6px;
  }

  .__snippetMessageActions_buttonText .__snippetMessageActions_image {
    font-weight: bold;
    color: #fff;
    font-size: 16px;
    text-shadow: 1px 1px 1px #000;
    text-align: center;
    line-height: 22px;
    text-indent: 0;
  }

  .__snippetMessageActions_buttonNo {
    margin-right: 7px;
    border-right: 1px solid #35353b;
    padding-right: 7px;
  }

  .__snippetMessageActions_buttonReplySnippet {
    svg path {
      filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 1));
      color: #0f0;
    }
  }
`);

function snippetMessageActionsInit() {
  document.body.addEventListener('click', async (ev) => {
    const button = ev.target.closest('[data-reply-text]');

    if (button) {
      ev.target.closest('[class^="buttonsInner__"]').querySelector('[aria-label="Reply"]')?.click();

      const editor = document.querySelector('div[role="textbox"]');

      simulatePaste(editor, button.dataset.replyText);

      setTimeout(() => document.querySelector('[aria-label="Send Message"]').click(), 100);
    } else if (ev.target.closest('.__snippetMessageActions_buttonReplySnippet')) {
      ev.target.closest('[class^="buttonsInner__"]').querySelector('[aria-label="Reply"]')?.click();
      showSnippetWindow();
    } else if (ev.target.closest('.__snippetMessageActions_buttonAddSnippet')) {
      const message = ev.target.closest('[class^="messageListItem__"]');
      const content = message.querySelector('[class^="contents_"] [id^="message-content-"]');

      // favorites
      const icon = document.querySelector('[class*="guildBreadcrumbIcon_"]')?.style.backgroundImage || document.querySelector('[class^="title_"] [class*="guildIcon_"]')?.style.backgroundImage;
      const server = [...icon.matchAll(/.+\/icons\/([0-9]+)\//g)][0][1];
      const messagePath = [...message.id.matchAll(/^chat-messages-(.+)$/g)][0][1].replace('-', '/');
      const link = `https://discord.com/channels/${server}/${messagePath}`;

      //navigator.clipboard.writeText = function() { console.log([...arguments]) }

      const key = `snippet-item:${link}`;
      const data = await GM.getValue(key) || {};
      //data.html = content.innerHTML;

      let html = content.innerHTML;

      html = html
        .replace(/<img[^>]+alt="([^"]+)"[^>]+>/ig, '$1')
        .replace(/<span [^>]*class="hiddenVisually_[^"]+">[^<]+<\/span>/g, '')
        .replace(/<span class="edited_[^"]+">[^<]+<\/span>/g, '')
        .replace(/\n/g, '{BR}');

      //console.log('html');
      //console.log(html);

      const markdown = turndownService.turndown(html)
        .replace(/\{BR\}/g, "\n");

      //console.log('markdown');
      //console.log(markdown);

      data.html = markdown;

      data.updated = Date.now();
      data.server = server;
      data.link = link;

      GM.setValue(key, data);
      snippetWindowSections[key] = data;
      addSnippetWindowSection(key, data);
    }
  }, true);
}

let checkSnippetMessageActionsDelayTO;
function checkSnippetMessageActionsDelay() {
  clearTimeout(checkSnippetMessageActionsDelayTO);
  checkSnippetMessageActionsDelayTO = setTimeout(checkSnippetMessageActions, 100);
}

function checkSnippetMessageActions() {
  document.querySelectorAll('[class^="messageListItem__"] [class^="buttonContainer_"]:not(:has(.__snippetMessageActions_button))').forEach((el) => {
    el.classList.add('__snippetMessageActions');
    const buttonsInner = el.querySelector('[class^="buttonsInner__"]');
    if (!buttonsInner) return;
    const child1 = buttonsInner.querySelector(':scope > span > div');
    const child2 = buttonsInner.querySelector(':scope > span > div > div');
    const child3 = buttonsInner.querySelector(':scope > span > div > div > div');

    // <img class="emoji" data-type="emoji" data-name="📝" alt="📝" draggable="false" src="/assets/5f6b1b0353091184.svg">

    const replySnippet = createElementFromHTML(`<span class="__snippetMessageActions_button __snippetMessageActions_buttonReplySnippet">
      <div class="${child1.className}" aria-label="Reply w/ Snippet" role="button" tabindex="0">
        <svg class="icon_f84418" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" style="background-image: url(&quot;/assets/5f6b1b0353091184.svg&quot;); background-size: contain; background-repeat: no-repeat; background-position: center center;"><path fill="currentColor" d="M2.3 7.3a1 1 0 0 0 0 1.4l5 5a1 1 0 0 0 1.4-1.4L5.42 9H11a7 7 0 0 1 7 7v4a1 1 0 1 0 2 0v-4a9 9 0 0 0-9-9H5.41l3.3-3.3a1 1 0 0 0-1.42-1.4l-5 5Z" class=""></path></svg>
      </div>
    </span>`);

    buttonsInner.childNodes[7]?.after(replySnippet);

    const nopeAction = createElementFromHTML(`<span class="__snippetMessageActions_button __snippetMessageActions_buttonText __snippetMessageActions_buttonNo">
      <div class="${child1.className}" role="button" tabindex="0" data-reply-text="Nope.">
        <div class="${child2.className}">
          <div class="${child3.className} __snippetMessageActions_image" role="img" style="">N</div>
        </div>
      </div>
    </span>`);

    buttonsInner.prepend(nopeAction);

    const yepAction = createElementFromHTML(`<span class="__snippetMessageActions_button __snippetMessageActions_buttonText">
      <div class="${child1.className}" role="button" tabindex="0" data-reply-text="Yep.">
        <div class="${child2.className}">
          <div class="${child3.className} __snippetMessageActions_image" role="img" style="">Y</div>
        </div>
      </div>
    </span>`);

    buttonsInner.prepend(yepAction);

    const snippetAction = createElementFromHTML(`<span class="__snippetMessageActions_button __snippetMessageActions_buttonAddSnippet">
      <div class="${child1.className}" role="button" tabindex="0">
        <div class="${child2.className}">
          <div class="${child3.className} __snippetMessageActions_image" role="img" style="background-image: url(&quot;/assets/5f6b1b0353091184.svg&quot;); background-size: contain; background-repeat: no-repeat; background-position: center center;">+</div>
        </div>
      </div>
    </span>`);

    buttonsInner.prepend(snippetAction);
  });
}

////////////////////////////////
// checkCurrentServer
////////////////////////////////

let checkCurrentServerDelayTO;
function checkCurrentServerDelay() {
  clearTimeout(checkCurrentServerDelayTO);
  checkCurrentServerDelayTO = setTimeout(checkCurrentServer, 100);
}

function checkCurrentServer() {
  const main = document.querySelector('main:not(.__server_updated)');

  if (!main) return;

  const icon = document.querySelector('[class*="guildBreadcrumbIcon_"]')?.style.backgroundImage || document.querySelector('[class^="title_"] [class*="guildIcon_"]')?.style.backgroundImage;

  if (!icon) return;

  const server = [...icon.matchAll(/.+\/icons\/([0-9]+)\//g)][0][1];

  if (!server) return;

  main.classList.add('__server_updated');
  document.body.className = '__server_' + server;
}

////////////////////////////////
// update
////////////////////////////////

function update(mutationList, observer) {
  checkSnippetButtonDelay();
  checkSnippetMessageActionsDelay();
  checkCurrentServerDelay();
}

////////////////////////////////
// tools
////////////////////////////////

{% include greasemonkey/_shared/observe.js %}

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/createElementFromHTML.js %}
