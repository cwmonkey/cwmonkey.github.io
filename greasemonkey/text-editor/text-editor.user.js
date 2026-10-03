---
---
{% include greasemonkey/text-editor/meta.js %}

console.log('---=== Discord Text Editor ===---');

/* global showdown */
const converter = new showdown.Converter();

////////////////////////////////
// init
////////////////////////////////

async function init() {
  await waitForElement('body');
}

init();

let rmousedown =false;
let showedWindow = false;
let textWindow;
let preview;
let editor;
let hasEdits = false;
let currentKey;
let selector;
let name;

document.addEventListener('mousedown', (event) => {
  if (event.button === 2) rmousedown = true;
}, true);

document.addEventListener('keydown', (event) => {
  if (rmousedown && event.key.toLowerCase() === 'e') {
    event.preventDefault();
    toggleWindow();
    showedWindow = true;
  }
}, true);

document.addEventListener('contextmenu', (event) => {
  if (showedWindow) {
    event.preventDefault();
  }

  rmousedown = false;
  showedWindow = false;
}, true);

function toggleWindow() {
  if (!textWindow) {
    createWindow();
  }

  if (textWindow.style.display) {
    textWindow.style.display = '';
  } else {
    textWindow.style.display = 'none';
  }
}

function createWindow() {
  let textWindowShadowRoot;
  let undefined;

  addStyle(/* css */`
    {% include greasemonkey/_shared/shadowDomReset.css %}

    a:link {
      color: #FFE7BF;
    }

    a:visited {
      color: #E2DACE;
    }

    a:active {
      color: red;
    }

    #window {
      position: fixed;
      z-index: 100000;
      background: #2C2F3F;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      color: #fff;
      display: flex;
      flex-direction: column;
      font-family: sans-serif;
      border: 1px solid #6E738F;
      border-radius: 6px;
      overflow: hidden;
    }

    button {
      color: #fff;
      border: 1px solid #6E738F;
      background: #2C2F3F;
      border-radius: 4px;
      padding: 2px 8px;

      &:hover {
        background: #3C3F4F;
      }

      &:active {

      }
    }

    #header {
      display: flex;
      flex-direction: row;
      background: #f6ecda;
      color: #000;
      padding: 8px;

      h2 {
        margin: 0 10px 0 0;
        font-size: 14px;
      }

      #close {
        margin-left: auto;
      }
    }

    #content {
      display: flex;
      flex-direction: row;
      overflow: hidden;

      > * {
        flex-grow: 1;
      }
    }

    #editor_wrapper {
      display: flex;
      flex-direction: column;
      padding: 8px 0 8px 8px;
      flex-shrink: 1;

      > * {
        flex-shrink: 1;
      }

      #editor {
        height: 100%;
        background: #000;
        border: 1px solid #6E738F;
        color: #ddd;
      }
    }

    #preview {
      max-height: 100%;
      background: #3C3F4F;
      border: 1px solid #6E738F;
      color: #ddd;
      margin: 8px;
      border-radius: 6px;
      overflow: hidden;
      overflow-y: auto;
      font-size: 14px;
      line-height: 1.4;
      flex-grow: 1;
      width: 100%;

      .line {
        display: flex;
        flex-direction: row;
        padding-right: 8px;
      }

      .copy {
        margin: 2px;
      }

      .suggest {
        color: red;
      }

      p,
      ul,
      ol,
      blockquote {
        /*white-space: break-spaces;*/
        margin: 0;
      }

      ul,
      ol {
        padding-left: 1.585em;
      }

      blockquote {
        padding-left: 8px;
        border-left: 3px solid #ddd;
        margin-left: 8px;
      }

      button {
        font-size: 12px;
      }

      .section_start {
        background: #6E738F;
        padding: 2px;
        margin-bottom: 4px;
      }

      .blank_lines {
        white-space: break-spaces;
      }
    }
  `, textWindowShadowRoot = createShadowElementFromHTML(/* html */`
    <aside id="window" style="display: none">
      <header id="header">
        <h2>Discord Multi-Post Editor Thing</h2>

        <label id="text_selector_wrapper">
          <select id="selector"></select>
        </label>

        <button id="close">x</button>
      </header>
      <div id="content">
        <div id="editor_wrapper">
          <input type="text" id="name"/>
          <textarea id="editor"></textarea>
          <button id="save">Save</button>
          <button id="save_discord">Save to Discord</button>
          <button id="delete">Delete</button>
        </div>
        <div id="preview"></div>
      </div>
    </aside>
  `, undefined, true));

  textWindow = textWindowShadowRoot.querySelector('#window');

  preview = textWindow.querySelector('#preview');
  editor = textWindow.querySelector('#editor');
  selector = textWindow.querySelector('#selector');
  name = textWindow.querySelector('#name');

  editor.addEventListener('input', callDelay(updatePreview, 500));

  function setHasEdits() {
    hasEdits = true;
  }

  editor.addEventListener('input', setHasEdits);

  const resizeObserver = new ResizeObserver(callDelay((entries) => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (width) GM.setValue('editorWidth', width);
    }
  }));
  resizeObserver.observe(editor);
  GM.getValue('editorWidth').then((width) => {
    if (width) editor.style.width = width + 'px';
  });

  name.addEventListener('input', setHasEdits);

  textWindow.querySelector('#close').addEventListener('click', () => {
    if (!hasEdits || confirm("Close before saving?")) {
      toggleWindow();
    }
  });

  textWindow.querySelector('#save').addEventListener('click', (event) => {
    let isNew = false;

    if (!currentKey) {
      currentKey = 'text:' + Date.now();
      isNew = true;
    }

    GM.setValue(currentKey, {
      text: editor.value,
      name: name.value
    });

    if (isNew) {
      setupWindow();
    }

    hasEdits = false;

    showToast((isNew ? 'Saved New Text' : 'Saved Text') + ': ' + name.value + (currentKey), event);
  });

  textWindow.querySelector('#save_discord').addEventListener('click', (event) => {
    textWindow.querySelector('#save').click();

    window.postMessage({
      type: 'addSnippet',
      id: currentKey,
      text: editor.value
    }, '*');

    showToast('Saved to Discord', event);
  });

  textWindow.querySelector('#delete').addEventListener('click', async () => {
    if (!currentKey) return;

    if (confirm("Delete current text?")) {
      await GM.deleteValue(currentKey);
      currentKey = null;
      setupWindow();
    }
  });

  selector.addEventListener('change', async (event) => {
    if (!hasEdits || confirm("Close before saving?")) {
      currentKey = selector.value;
      GM.setValue('textLast', currentKey);

      if (currentKey) {
        const value = await GM.getValue(currentKey);
        name.value = value.name;
        editor.value = value.text;
      } else {
        name.value = '';
        editor.value = '';
      }

      updatePreview();
    }
  });

  preview.addEventListener('click', (event) => {
    const copy = event.target.closest('.copy');
    const copySection = event.target.closest('.copy_section');

    let text;

    if (copy) {
      text = lines[parseInt(copy.dataset.idx)];
    } else if (copySection) {
      text = sections[parseInt(copySection.dataset.idx)].join("\n");
    }

    if (text) {
      console.log(event);
      navigator.clipboard.writeText(text);
      showToast('Copied Line: ' + text, event);
    }
  });

  setupWindow();
}

async function setupWindow() {
  const values = await GM_getValuesMatching(/^text:/);
  currentKey = await GM.getValue('textLast');

  selector.replaceChildren();

  values.sort((a, b) => {
    return a[1].name > b[1].name
  });

  const option = createElementFromHTML(/* html */`<option value="">[Load Saved Text]</option>`);
  selector.append(option);

  values.forEach(([key, value]) => {
    const option = createElementFromHTML(/* html */`<option value="${key}" ${key === currentKey ? 'selected':''}></option>`);
    option.textContent = value.name;
    selector.append(option);
    selector.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

let lines;
let sections;

const suggestions = [
  {reg: /\b(and)\b/gi, replace: '&'},
  {reg: /\b(at)\b/gi, replace: '@'},
  {reg: /\b(with)\b/gi, replace: 'w/'},
  {reg: /\b(with ?out)\b/gi, replace: 'w/o'},
  {reg: /\b(rendezvous)\b/gi, replace: 'rdv'}
];
function suggest(el) {
  el.querySelectorAll('li, p').forEach((el) => {
    suggestions.forEach((sug) => {
      el.innerHTML = el.innerHTML.replace(sug.reg, '<span class="suggest">$1</span>');
    })
  });
}

function updatePreview(event) {
  const value = editor.value;
  lines = [];
  sections = [];

  preview.replaceChildren();

  if (!value) return;

  let sectionCharacterCount = 0;
  let blankLinesCount = 0;
  let inBlockquote = false;
  let blockquoteLines = [];
  let section_start;

  function addSectionCopy(count, hard) {
    if (section_start) {
      section_start.children[0].title = sections[sections.length - 1].join("\n");
    }

    if (count) preview.append(createElementFromHTML(/* html */`<div>${count}${hard ? ' <em>(Hard post break from 3+ new lines here)</em>':''}</div>`));
    section_start = createElementFromHTML(/* html */`<div class="section_start"><button class="copy_section" data-idx="${sections.length}">Copy Section</button></div>`);
    preview.append(section_start);

    sections.push([]);
  }

  addSectionCopy();

  const valueLines = value.split("\n");

  valueLines.forEach((line, idx) => {
    let charactersToAdd = 0;

    if (line.match(/^>/)) {
      inBlockquote = true;
      blockquoteLines.push(line);
    } else if (inBlockquote) {
      const div = createElementFromHTML(/* html */`<div class="line"><button class="copy" data-idx="${lines.length}">C</button> <div></div></div>`);
      const blockquote = div.children[1];
      const blockquoteText = blockquoteLines.join("\n");
      div.children[0].title = blockquoteText;
      blockquote.append(createElementFromHTML(converter.makeHtml(blockquoteText)));
      lines.push(blockquoteText);
      charactersToAdd += blockquoteText.length;
      blockquoteLines = [];

      suggest(div);
      if (sectionCharacterCount + charactersToAdd >= 2000) {
        addSectionCopy(sectionCharacterCount);
        preview.append(div);
        sectionCharacterCount = charactersToAdd + 1;
        charactersToAdd = 0;
      } else {
        preview.append(div);
      }

      blankLinesCount = 0;

      sections[sections.length - 1].push(blockquoteText);

      inBlockquote = false;
    }

    if (line === "") {
      blankLinesCount++;
    } else if (!line.match(/^>/)) {
      if (blankLinesCount) {
        if (blankLinesCount > 2) {
          addSectionCopy(sectionCharacterCount, true);
          blankLinesCount = 0;
          sectionCharacterCount = 0;
        } else {
          const div = createElementFromHTML(/* html */`<div class="line"><span class="blank_lines">${"\n".repeat(blankLinesCount)}</span></div>`);
          preview.append(div);

          const lineCount = blankLinesCount > 2 ? 2 : blankLinesCount;

          sections[sections.length - 1].push("\n".repeat(lineCount - 1));

          sectionCharacterCount += lineCount;
        }
      }

      const div = createElementFromHTML(/* html */`<div class="line"><button class="copy" data-idx="${lines.length}">C</button> <span></span></div>`);
      div.children[0].title = line;
      const span = div.children[1];
      span.append(createElementFromHTML(converter.makeHtml(line)));
      lines.push(line);
      charactersToAdd += line.length;

      suggest(div);
      if (sectionCharacterCount + charactersToAdd >= 2000) {
        addSectionCopy(sectionCharacterCount);
        preview.append(div);
        sectionCharacterCount = charactersToAdd + 1;
        charactersToAdd = 0;
      } else {
        preview.append(div);
      }

      sections[sections.length - 1].push(line);

      blankLinesCount = 0;
    }

    // Acount for trailing \n
    if (idx === valueLines.length - 1) {
      sectionCharacterCount += charactersToAdd;
    } else {
      sectionCharacterCount += charactersToAdd ? charactersToAdd + 1 : 0;
    }
  });

  if (sectionCharacterCount) {
    preview.append(createElementFromHTML(/* html */`<div>${sectionCharacterCount}</div>`));
  }
}

////////////////////////////////
// tools
////////////////////////////////

////////////////////////////////
// showToast
////////////////////////////////

{% include greasemonkey/_shared/addStyle.js %}

function showToast(message, event) {
  let isShadow = false;
  let root;
  let undefined;

  if (event.target) {
    root = event.target.getRootNode();
    isShadow = root instanceof ShadowRoot;
  }

  if (!(isShadow ? root : document).querySelector('#__toast_notification')) {
    addStyle(/* css */`
      .__toast_notification {
        position: fixed;
        top: 50%;
        left: 50%;
        display: block;
        z-index: 100001;
        pointer-events: none;

        background-color: #00a971;
        color: white;
        font-size: 14px;
        font-family: sans-serif;

        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        max-width: 200px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;

        animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

        &:not(.__toast_positioned) {
          transform: translate(-50%, -50%);
        }

        &.__toast-fade-out {
          animation: slideOut 0.3s ease forwards;
        }
      }

      /* Slide In & Fade In Animation */
      @keyframes slideIn {
        from {
          transform: translateY(100px) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        to {
          transform: translateY(-20px) scale(0.95);
          opacity: 0;
        }
      }
    `, (isShadow ? root : undefined), '__toast_notification');
  }

  const toast = document.createElement('div');
  toast.classList.add('__toast_notification');
  toast.textContent = message;

  if (event) {
    toast.classList.add('__toast_positioned');
    toast.style.left = event.clientX + "px";
    toast.style.top = event.clientY + "px";
  }

  (isShadow ? root : document.body).appendChild(toast);

  setTimeout(() => {
    toast.classList.add('__toast-fade-out');
    
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 1000);
}

////////////////////////////////
// callDelay
////////////////////////////////

function callDelay(fn, delay) {
  if (typeof delay === 'undefined') delay = 100;

  let TO;
  let context;
  let event;

  function callFn() {
    fn.call(context, event);
  }

  return (ev) => {
    context = this;
    event = ev;
    clearTimeout(TO);
    TO = setTimeout(callFn, delay);
  };
}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/createShadowElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/GM_getValuesMatching.js %}
