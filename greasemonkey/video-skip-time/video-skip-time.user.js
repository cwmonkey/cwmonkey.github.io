---
---
{% include greasemonkey/video-skip-time/meta.js %}

console.log('---=== Video - Skip Time/Change Playback Speed ===---');

unsafeWindow.addEventListener('message', (event) => {
  let data = event.data;

  if (Number(data) === data || (data.match && data.match(/[0-9]+(\.[0-9]+)?%/))) {
    data = {
      type: 'skip',
      amount: event.data
    };
  } else if (data.match && data.match(/[0-9]+(\.[0-9]+)?x/i)) {
    data = {
      type: 'speed',
      amount: event.data
    };
  }

  if (data.type === 'skip' || data.type === 'speed') {
    document.querySelectorAll('video').forEach((el) => {
      if (Number(data.amount) === data.amount) {
        el.currentTime += data.amount;
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
