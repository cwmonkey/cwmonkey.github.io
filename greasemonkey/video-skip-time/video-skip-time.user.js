---
---
{% include greasemonkey/video-skip-time/meta.js %}

console.log('---=== Video - Skip Time/Change Playback Speed ===---');

{% include greasemonkey/_shared/toolsWindow.js %}

////////////////////////////////
// Listener
////////////////////////////////

unsafeWindow.addEventListener('message', (event) => {
  let data = event.data;
console.log(event);
  if (Number(data) == data || (data.match && data.match(/[0-9]+(\.[0-9]+)?%/))) {
    data = {
      type: 'skip',
      amount: event.data
    };
  } else if (data.match && data.match(/[0-9]+(\.[0-9]+)?x/i)) {
    data = {
      type: 'speed',
      amount: event.data
    };
  } else if (data.match && data.match(/[0-9]+(\.[0-9]+)?s/i)) {
    data = {
      type: 'position',
      amount: event.data
    };
  }

  if (data.type === 'skip' || data.type === 'speed' || data.type === 'position') {
    document.querySelectorAll('video').forEach((el) => {
      if (!el.duration) return;

      if (data.type === 'position') {
        el.currentTime = parseFloat(data.amount);
      } else if (Number(data.amount) == data.amount) {
        el.currentTime += parseFloat(data.amount);
      } else if(data.amount.match(/[0-9]+(\.[0-9]+)?%/)) {
        el.currentTime += el.duration * (parseFloat(data.amount)/100);
      } else if(data.type === 'speed') {
        el.playbackRate = parseFloat(data.amount);
      }
    });

    document.querySelectorAll('iframe').forEach((el) => {
      el.contentWindow.postMessage({type: data.type, amount: data.amount }, '*');
    });
  }
});

////////////////////////////////
// Window Tools
////////////////////////////////

defaults = [
  '1x', '2x', '4x', '16x',
  'sep',
  -60, -10, -1, -.03,
  .03, 1, 10, 60, 60 * 5,
  'sep',
  '5%', '10%', '24%',
  'sep',
  '0s'
];

let videoControlsSection;

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmToolsWindow-shown') {
    if (!videoControlsSection) {
      createVideoControlsSection();
    }
  }
});

async function createVideoControlsSection() {
  videoControlsSection = createElementFromHTML(/* html */`
    <section id="videoControlsSection">
      <h3>Video Controls:</h3>
      <menu class="content"></menu>
    </section>
  `);

  addStyle(/* css */`
    #videoControlsSection {
      menu {
        margin: 0;
        text-wrap: nowrap;
      }

      .sep {
        &:before {
          content: "\\a0\\a0\\a0";
        }
      }
    }
  `, toolsWindow);

  const sections = toolsWindow.querySelector('#sections');

  const menu = videoControlsSection.querySelector('menu');

  settings = await GM_getValuesMatching(/^((-?([0-9]+(\.[0-9]+)?)|(\.[0-9]+))[xs%]?)|(sep)|(br)$/i);

  if (!settings.length) {
    defaults.forEach((d) => {
      settings.push({text: d, order: settings.length});
    })
  }

  settings.sort((a, b) => { return a.order > b.order });

  settings.forEach((setting) => {
    if (setting.text === 'sep') {
      const span = createElementFromHTML(/* html */`<span class="sep"><wbr /></span>`);
      menu.append(span);
    } else {
      const button = createElementFromHTML(/* html */`<button class="control">${setting.text}</button>`);
      menu.append(button);
    }
  });

  sections.append(videoControlsSection);

  videoControlsSection.addEventListener('click', (event) => {
    const target = event.composedPath()[0];

    if (target.closest('.control')) {
      const button = target.closest('.control');
      unsafeWindow.postMessage(button.textContent, '*');
    }
  }, true);
}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/GM_getValuesMatching.js %}
