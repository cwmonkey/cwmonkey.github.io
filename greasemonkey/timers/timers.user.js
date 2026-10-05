---
---
{% include greasemonkey/timers/meta.js %}

console.log('---=== Timers ===---');

////////////////////////////////
//// toolsWindow
////////////////////////////////

let timersSection;

{% include greasemonkey/_shared/toolsWindow.js %}

window.addEventListener('message', (event) => {
  if (event.data.type === '__cwmToolsWindow-shown') {
    if (!timersSection) {
      createTimersSection();
    }
  }
});

////////////////////////////////
//// createNotificationsSection
////////////////////////////////

function createTimersSection() {
  addStyle(/* css */`
    #timersSection {
      input[type="number"] {
        width: 3em;

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          opacity: 1;
        }
      }

      #timer_year {
        width: 5em;
      }
    }
  `, toolsWindow);

  timersSection = createElementFromHTML(/* html */`
    <section id="timersSection">
      <h3>Timers:</h3>
      <div class="content">
        <ul>
          <li>
            <fieldset>
              <p><label>Title: <input type="text" id="timer_title"></label></p>
              <!-- p><label>Type: <input type="text" id="timer_type"></label></p -->
              <p><label>Alerts: <input type="text" id="timer_alerts" value="0,10m"></label></p>
            </fieldset>

            <fieldset>
              <p>
                <label>Days: <input type="number" id="timer_days" min="0"></label>
                <label>Hours: <input type="number" id="timer_hours" min="0"></label>
                <label>Minutes: <input type="number" id="timer_minutes" min="0"></label>
              </p>
            </fieldset>

            <p>OR</p>

            <fieldset>
              <p>
                <label><input type="number" id="timer_year" value="${(new Date()).getFullYear()}"></label>
                -
                <label><select id="timer_month">
                  ${(()=>{let out='';for(let i=0;i<=11;i++){out +=
                    `<option value="${i}" ${(new Date()).getMonth()===i?'selected':''}>${i+1} - ${(new Date(2000,i,1)).toLocaleString('en-US',{month:'short'})}</option>`;
                  }return out})()}
                </select></label>
                -
                <label><select id="timer_day">
                  ${(()=>{let out='';for(let i=1;i<=31;i++){out +=
                    `<option value="${i}" ${(new Date()).getDate()===i?'selected':''}>${i}</option>`;
                  }return out})()}
                </select></label>
              </p>
              <p>
                <label><input type="number" id="timer_hour" value="${(new Date()).getHours()%12||12}"></label>
                :
                <label><input type="number" id="timer_minute" value="${(new Date()).getMinutes()}"></label>
                <label><select id="timer_ampm">
                  <option></option>
                  <option ${(new Date()).getHours()<12?'selected':''}>AM</option>
                  <option ${(new Date()).getHours()>=12?'selected':''}>PM</option>
                </select></label>
              </p>
            </fieldset>

            <p><button id="timer_add">Add</button></p>

            <p><label><input type="checkbox" id="show_timers" ${localStorage.getItem('__cwmToolsTimers--show')?'checked':''}>Show timers (${window.location.host})</label></p>
          </li>
        </ul>
      </div>
    </section>
  `);

  const sections = toolsWindow.querySelector('#sections');
  sections.append(timersSection);

  timersSection.querySelector('#show_timers').addEventListener('change', (event) => {
    if (event.target.checked) {
      localStorage.setItem('__cwmToolsTimers--show', 1);
      if (!notificationWindow) {
        init();
      } else {
        notificationWindow.style.display = '';
      }
    } else {
      localStorage.removeItem('__cwmToolsTimers--show');
      notificationWindow.style.display = 'none';
    }
  });

  timersSection.querySelector('#timer_add').addEventListener('click', (event) => {
    const showToastTO = setTimeout(showToast.bind(this, 'Failed!', {target: event.target, clientX: event.clientX, clientY: event.clientY}, 'fail'), 100);

    const title = timersSection.querySelector('#timer_title').value;
    if (!title) return;
    //const type = timersSection.querySelector('#timer_type');
    const alerts = timersSection.querySelector('#timer_alerts').value.split(',').map((val)=>{return val.trim()});

    const days = parseFloat(timersSection.querySelector('#timer_days').value) || 0;
    const hours = parseFloat(timersSection.querySelector('#timer_hours').value) || 0;
    const minutes = parseFloat(timersSection.querySelector('#timer_minutes').value) || 0;
    const timeDuration = days*24 + hours + minutes/60;

    let duration;

    if (timeDuration) {
      duration = timeDuration;
    } else {
      const year = parseFloat(timersSection.querySelector('#timer_year').value) || 0;
      const month = parseFloat(timersSection.querySelector('#timer_month').value) || 0;
      const day = parseFloat(timersSection.querySelector('#timer_day').value) || 0;
      const hour = parseFloat(timersSection.querySelector('#timer_hour').value) || 0;
      const minute = parseFloat(timersSection.querySelector('#timer_minute').value) || 0;
      const ampm = timersSection.querySelector('#timer_ampm').value || 0;

      const then = new Date(year, month, day, (ampm=='PM'?hour+12:hour), minute);
      duration = (then.getTime() - Date.now()) / 1000 / 60 / 60;
    }

    let alertObjs = [];
    const remainingMultipliers = {s:1,m:60,h:60*60,d:24*60*60}
    alerts.forEach((alert) => {
      const matches = [...alert.matchAll(/^([0-9]+(?:\.[0-9]+)?([a-z])?)$/gi)];
      const type = matches[0][2];
      const num = parseFloat(matches[0][1]);
      const remaining = (type && remainingMultipliers[type]) ? num * remainingMultipliers[type] : num;
      alertObjs.push({
        remaining: remaining
      });
    });

    const config = {
      title: title,
      start: Date.now(),
      duration: duration,
      alerts: alertObjs
    };

    const key = `timer:custom:${title}`;

    GM.setValue(key, config);
    timers[key] = config;
    clearTimeout(showToastTO);
    showToast(`Added: ${title}`, event);
    addTimer(key, config);
  }, true);
}

////////////////////////////////
//// init
////////////////////////////////

let notificationWindowShadowRoot;
let notificationWindow;
const timers = {};

async function init() {
  if (!localStorage.getItem('__cwmToolsTimers--show')) return;

  const notificationWindowHost = await waitForElement('#__cwmNotificationWindow');
  notificationWindowShadowRoot = notificationWindowHost.shadowRoot;
  notificationWindow = notificationWindowShadowRoot.querySelector('#notificationWindow');

  await getTimers();

  showTimers();
}

init();

////////////////////////////////
// getTimers
////////////////////////////////

async function getTimers() {
  const values = await GM_getValuesMatching(/^timer:/);

  values.forEach(([key, data]) => {
    timers[key] = data;

    GM_addValueChangeListener(key, (key, oldValue, newValue, remote) => {
      timers[key] = newValue;
    });
  });
}

////////////////////////////////
// showTimers
////////////////////////////////

let timersEl;
const timerChecks = {};

function addTimer(key, data) {
  if (!key.match(/^timer:/)) return;

  const li = createElementFromHTML(/* html */`
    <li class="__item" data-priority="${data.priority||'normal'}">
      <span class="__title">${data.title}</span>
      <span class="__remaining" title="${new Date(data.start + data.duration * 60 * 60 * 1000).toLocaleString()}"></span>
      <button role="button" class="__refresh">♻️</button>
      <button role="button" class="__priority" data-priority-mute="🔕" data-priority-normal="🔔" data-priority-high="🚨"></button>
      <button role="button" class="__delete">❌</button>
    </li>
  `);

  const oldLi = timersEl.querySelector(`[data-key="${key}"]`);

  li.dataset.key = key;

  const remaining = li.querySelector('.__remaining');

  function checkRemaining() {
    if (!timers[key]) return;
    const endDate = new Date(timers[key].start + timers[key].duration * 60 * 60 * 1000);
    const endTime = endDate.getTime();
    let secondsRemaining = (endTime - Date.now()) / 1000;

    secondsRemaining = (endTime - Date.now()) / 1000;
    remaining.textContent = formatTimeRemaining(secondsRemaining);

    if (secondsRemaining <= 0 && timers[key].priority === 'mute') {
      li.querySelector('.__delete').click();
      return;
    }

    if (secondsRemaining > 60 * 60) {
      setTimeout(checkRemaining, 60 * 1000);
    } else if (secondsRemaining > 0) {
      setTimeout(checkRemaining, 1000);
    } else if (secondsRemaining < 0) {
      setTimeout(checkRemaining, 5 * 1000);
    }

    const alerts = timers[key].alerts;
    if (!alerts) return;

    alerts.forEach((alert, ak) => {
      if (timers[key].priority === 'mute') return;
      if (secondsRemaining > alert.remaining) return;

      if (!alert.alerted && alert.remaining !== 0) {
        sound([
          { freq: 659.25, duration: 0.2 }, // E5
          { freq: 932.33, duration: 0.2 }, // A♯5
          { freq: 830.61, duration: 0.2 }, // G♯5
          { freq: 554.37, duration: 0.4 } // C♯5
        ]);

        GM.notification({
          text: `Alert "${data.title}" expires in ${formatTimeRemaining(alert.remaining, true)}`,
          title: 'Timer',
          image: 'https://cwmonkey.github.io/images/monkey.png',
          onclick: function() {
            window.focus();
          }
        });
      } else if (alert.remaining === 0) {
        if (timers[key].priority === 'high' || !alert.alerted) {
          sound([
            { freq: 554.37, duration: 0.2 }, // C♯5
            { freq: 659.25, duration: 0.2 }, // E5
            { freq: 880, duration: 0.2 }, // A5
            { freq: 659.25, duration: 0.4 } // E5
          ]);
        }

        if (!alert.alerted) {
          GM.notification({
            text: `Alert "${data.title}" has expired`,
            title: 'Timer',
            image: 'https://cwmonkey.github.io/images/monkey.png',
            onclick: function() {
              window.focus();
            }
          });
        }
      }

      if (!alert.alerted) {
        timers[key].alerts[ak].alerted = 1;
        GM.setValue(key, timers[key]);
      }
    });
  }

  timerChecks[key] = checkRemaining;

  checkRemaining();

  if (oldLi) {
    oldLi.replaceWith(li);
  } else {
    timersEl.append(li);
  }
}

async function showTimers() {
  addStyle(/* css */`
    #notificationWindow {
      .__timers .__item {
        &[data-priority="mute"] {
          opacity: .5;

          .__priority:after {
            content: attr(data-priority-mute);
            filter: grayscale(1);
          }
        }

        &[data-priority="normal"] .__priority:after {
          content: attr(data-priority-normal);
        }

        &[data-priority="high"] .__priority:after {
          content: attr(data-priority-high);
        }
      }

      .__remaining {
        min-width: 5em;
        text-align: right;
      }
    }
  `, notificationWindowShadowRoot);

  notificationWindow.addEventListener('click', (ev) => {
    if (ev.target.closest('.__timers .__delete')) {
      if (!ev.isTrusted || confirm("Really delete?")) {
        const li = ev.target.closest('.__item');
        const key = li.dataset.key;

        GM.deleteValue(key);
        li.remove();
      }
    } else if (ev.target.closest('.__timers .__refresh')) {
      const li = ev.target.closest('.__item');
      const key = li.dataset.key;

      const endDate = new Date(timers[key].start + timers[key].duration * 60 * 60 * 1000);
      const endTime = endDate.getTime();
      const secondsRemaining = (endTime - Date.now()) / 1000;

      if (secondsRemaining <= 0 || confirm("Really refresh?")) {
        timers[key].start = Date.now();
        timers[key].alerts.forEach((alert, ak) => {
          delete timers[key].alerts[ak].alerted;
        });
        GM.setValue(key, timers[key]);
        timerChecks[key]();
      }
    } else if (ev.target.closest('.__timers .__priority')) {
      const li = ev.target.closest('.__item');
      const key = li.dataset.key;
      let priority = timers[key].priority || 'normal';

      if (priority === 'normal') {
        priority = 'mute';
      } else if (priority === 'mute') {
        priority = 'high';
      } else {
        priority = 'normal';
      }

      li.dataset.priority = priority;
      timers[key].priority = priority
      GM.setValue(key, timers[key]);
    }
  });

  timersEl = createElementFromHTML(`<ul class="__timers"></ul>`);

  notificationWindow.append(timersEl);

  Object.entries(timers).forEach(([key, data]) => {
    addTimer(key, data);
  });

  window.addEventListener('message', (event) => {
    const type = event.data?.type;

    if (type !== '__cwmTools_addTimer') return;

    const key = event.data.key;
    const data = event.data.data;

    timers[key] = data;
    GM.setValue(key, data);

    addTimer(key, data);
  });
}

////////////////////////////////
//// Tools
////////////////////////////////

////////////////////////////////
// sound
////////////////////////////////

function sound(sounds) {
  if (!Array.isArray(sounds)) {
    sounds = [sounds];
  }

  const ctx = new AudioContext();
  let startTime = ctx.currentTime;

  sounds.forEach((note, i) => {
    note.freq = note.freq || 300;
    note.duration = note.duration || 0.3;
    note.volume = note.volume || 0.2;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime);

    // Fade to avoid pops
    gain.gain.setValueAtTime(note.volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);


    // Stop sound from gobbling up CPU
    if (i == sounds.length -1) {
      osc.onended = () => {
        ctx.close();
      }
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.duration);
    startTime += note.duration;
  });
}

////////////////////////////////
// formatTimeRemaining
////////////////////////////////

function formatTimeRemaining(totalSeconds, skipZeroS) {
  // Calculate hours, minutes, and remaining seconds
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds / 3600) % 24);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let seconds = totalSeconds % 60;
  if (seconds < 0) seconds = 0;

  // Format to two digits with leading zeros
  let paddedDays = `${days}d`;
  let paddedHours = `${hours}h`;
  let paddedMinutes = `${minutes}m`;
  let paddedSeconds = `${Math.round(seconds)}s`;

  if (totalSeconds < 60 * 60 * 24) paddedDays = '';
  if (!hours || totalSeconds < 60 * 60) paddedHours = '';
  if (!minutes || totalSeconds < 60 || totalSeconds >= 60 * 60 * 24) paddedMinutes = '';
  if ((seconds === 0 && skipZeroS) || totalSeconds >= 60 * 60) paddedSeconds = '';

  return `${paddedDays} ${paddedHours} ${paddedMinutes} ${paddedSeconds}`;
}

{% include greasemonkey/_shared/showToast.js %}

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/addStyle.js %}

{% include greasemonkey/_shared/GM_getValuesMatching.js %}
