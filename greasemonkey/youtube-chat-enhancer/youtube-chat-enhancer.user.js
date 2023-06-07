---
---
{% include greasemonkey/youtube-chat-enhancer/meta.js %}

/*

TODO:
Figure out distribution
Put code on github
Keyword highlight/alert
Anti-keywords (mute/hide messages with certain words)
"Hard" mute (hide messages) - allow mods/owners to be seen?
"Hard" quiet (hide messages) - allow mods/owners to be seen?
Fav messages
Global settings (vs channel)
Global mute sound
User notes
User defined sounds
User specific sounds

*/

(function() {
    'use strict';

    console.log('YouTube Chat Enhancements');
    console.log(window.CWM);

    // CWM
    const {
        // pretty debug output
        prettyDebug,
        // stuff
        sluggify, roundTo, once,
        // storage
        set, get,
        // dom
        ce, qs, qsa, trigger, pageScrollTop, ngSetValue, append, prepend, addCSS,
        // dom updates
        Observer, pollFor,
        // audio
        speak, Sound,
        // cookie
        getCookie, setCookie,
        // hijack
        hijackWebSocket, hijackXMLHttpRequest,
        // pubsub
        sub, before
        } = window.CWM;

    // TODO Move to CWM

    // Set up alerts
    const mentionAlert = new Sound({
        gain: .3,
        sequence: [{frequency: 600, time: .05}, {frequency: 650, time: .05}, {frequency: 700, time: .05}]
    });

    const authorAlert = new Sound({
        gain: .3,
        sequence: [{frequency: 400, time: .1}, {frequency: 300, time: .05}]
    });

    // Set up debug logger
    let debugIcon = '▶️';
    let debugName = '%c YouTube Chat Enhancements';
    const debugStyles = {
        nameStart:  'background:#fd0009;color:#fff;font-weight: bold;border-radius: 3px;',
        method:     'background:#fff;color:#3275e4'
    };

    const oPrettyDebug = new prettyDebug({
        debugPrepend: [debugIcon + '' + debugName + ' %c ', debugStyles.nameStart, debugStyles.method]
    });

    oPrettyDebug.log('Initializing...');
    const log = oPrettyDebug.log.bind(oPrettyDebug);
    const trace = oPrettyDebug.trace.bind(oPrettyDebug);

    function glog(text) {
        log(text, 'color: #000');
    }

    let channelName = undefined;
    let startDate = undefined;
    let videoId = undefined;
    let videoTitle = undefined;
    let date = undefined;

    const scriptDataEl = window.parent.window.document.querySelector('script.ytd-player-microformat-renderer');

    if (scriptDataEl) {
        const data = JSON.parse(scriptDataEl.innerText);

        channelName = data.author;
        startDate = data.publication[0].startDate;
        videoId = data.embedUrl.match(/\/([^\/]+)$/)[1];
        videoTitle = data.name;

        const videoData = {
            channelName: channelName,
            startDate: startDate,
            videoId: videoId,
            videoTitle: videoTitle
        };

        setCookie('data-' + videoId, encodeURIComponent(JSON.stringify(videoData)));
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const v = urlParams.get('v');
        const videoData = getCookie('data-' + v);
        const data = JSON.parse(decodeURIComponent(videoData));

        channelName = data.channelName;
        startDate = data.startDate;
        videoId = data.videoId;
        videoTitle = data.videoTitle;
    }

    date = new Date(startDate);

    console.log(channelName);
    console.log(startDate);
    console.log(videoId);
    console.log(videoTitle);

    let chatVisibilityDefault = 'normal';
    GM.getValue('chatVisibilityDefault-' + channelName).then(function(value) {
        if (value && value === 'quiet') {
            sCMChatVisibilityDefaultQuietInput.checked = true;
            checkChatVisibilityDefault();
            chatVisibilityDefault = value;
        }
    });

    addCSS('ytce-defaults', `
      /* --------------------------------
         Reset
      -------------------------------- */

      /* http://meyerweb.com/eric/tools/css/reset/
         v2.0 | 20110126
         License: none (public domain)
      */

      .ytce-wrapper html,.ytce-wrapper body,.ytce-wrapper div,.ytce-wrapper span,.ytce-wrapper applet,.ytce-wrapper object,.ytce-wrapper iframe,.ytce-wrapper h1,.ytce-wrapper h2,.ytce-wrapper h3,.ytce-wrapper h4,.ytce-wrapper h5,.ytce-wrapper h6,.ytce-wrapper p,.ytce-wrapper blockquote,.ytce-wrapper pre,.ytce-wrapper a,.ytce-wrapper abbr,.ytce-wrapper acronym,.ytce-wrapper address,.ytce-wrapper big,.ytce-wrapper cite,.ytce-wrapper code,.ytce-wrapper del,.ytce-wrapper dfn,.ytce-wrapper em,.ytce-wrapper img,.ytce-wrapper ins,.ytce-wrapper kbd,.ytce-wrapper q,.ytce-wrapper s,.ytce-wrapper samp,.ytce-wrapper small,.ytce-wrapper strike,.ytce-wrapper strong,.ytce-wrapper sub,.ytce-wrapper sup,.ytce-wrapper tt,.ytce-wrapper var,.ytce-wrapper b,.ytce-wrapper u,.ytce-wrapper i,.ytce-wrapper center,.ytce-wrapper dl,.ytce-wrapper dt,.ytce-wrapper dd,.ytce-wrapper ol,.ytce-wrapper ul,.ytce-wrapper li,.ytce-wrapper fieldset,.ytce-wrapper form,.ytce-wrapper label,.ytce-wrapper legend,.ytce-wrapper table,.ytce-wrapper caption,.ytce-wrapper tbody,.ytce-wrapper tfoot,.ytce-wrapper thead,.ytce-wrapper tr,.ytce-wrapper th,.ytce-wrapper td,.ytce-wrapper article,.ytce-wrapper aside,.ytce-wrapper canvas,.ytce-wrapper details,.ytce-wrapper embed,.ytce-wrapper figure,.ytce-wrapper figcaption,.ytce-wrapper footer,.ytce-wrapper header,.ytce-wrapper hgroup,.ytce-wrapper menu,.ytce-wrapper nav,.ytce-wrapper output,.ytce-wrapper ruby,.ytce-wrapper section,.ytce-wrapper summary,.ytce-wrapper time,.ytce-wrapper mark,.ytce-wrapper audio,.ytce-wrapper video {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        font: inherit;
        vertical-align: baseline;
      }
      .ytce-wrapper article,.ytce-wrapper aside,.ytce-wrapper details,.ytce-wrapper figcaption,.ytce-wrapper figure,.ytce-wrapper footer,.ytce-wrapper header,.ytce-wrapper hgroup,.ytce-wrapper menu,.ytce-wrapper nav,.ytce-wrapper section {
        display: block;
      }
      .ytce-wrapper {
        line-height: 1;
      }
      .ytce-wrapper ol,.ytce-wrapper ul {
        list-style: none;
      }
      .ytce-wrapper blockquote,.ytce-wrapper q {
        quotes: none;
      }
      .ytce-wrapper blockquote:before,.ytce-wrapper blockquote:after,.ytce-wrapper q:before,.ytce-wrapper q:after {
        content: '';
        content: none;
      }
      .ytce-wrapper table {
        border-collapse: collapse;
        border-spacing: 0;
      }

      /* --------------------------------
         Wrapper
      -------------------------------- */

      .ytce-wrapper {
        font-family: sans-serif;
        font-sie: 12px;
      }

      /* --------------------------------
         Menus
      -------------------------------- */

      .ytce-menu[class] {
        background: #3e3e3e;
        color: #fff;
        padding: 10px;
        border-radius: 4px;
        text-align: left;
        border: 1px solid #000;
      }

      .ytce-menu[class] li {
        list-style: none;
      }

      .ytce-menu[class] li button:not(:first-child) {
        margin-left: 5px;
      }

      .ytce-header[class] {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 2px;
      }

      .ytce-header[class]:not(:first-child) {
        margin-top: 10px;
      }

      .ytce-menu a {
        color: #fff;
        text-decoration: underline;
      }
      .ytce-menu a:hover {
        color: #2196f3;
      }

      /* --------------------------------
         Buttons
      -------------------------------- */

      .ytce-button {
        color: #fff;
        background: #000;
        cursor: pointer;
        border: 1px solid #000;
        border-radius: 3px;
      }

      .ytce-button:hover {
        background-color: #2196f3;
      }

      .ytce-delete-button {
        background: red;
      }


      /* --------------------------------
         Chat Settings
      -------------------------------- */

      .ytce-settings-menu {
          position: fixed;
          right: 10px;
          top: 58px;
          text-align: right;
      }

      .ytce-help {
        text-align: right;
      }

      /* Toggle */
      .ytce-settings-toggle {
        border: none;
        overflow: hidden;
        height: 30px;
        width: 30px;
        background-color: #3e3e3e;
        border-radius: 25px;
        text-indent: 51px;

        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50' width='50px' height='50px'%3E%3Cpath fill='white' d='M 0 7.5 L 0 12.5 L 50 12.5 L 50 7.5 Z M 0 22.5 L 0 27.5 L 50 27.5 L 50 22.5 Z M 0 37.5 L 0 42.5 L 50 42.5 L 50 37.5 Z'/%3E%3C/svg%3E");
        background-repeat: no-repeat no-repeat;
        background-position: center center;
        background-size: 50%;

        cursor: pointer;
      }

      .ytce-opened .ytce-settings-toggle {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50' width='50px' height='50px'%3E%3Cpath fill='white' d='M 9.15625 6.3125 L 6.3125 9.15625 L 22.15625 25 L 6.21875 40.96875 L 9.03125 43.78125 L 25 27.84375 L 40.9375 43.78125 L 43.78125 40.9375 L 27.84375 25 L 43.6875 9.15625 L 40.84375 6.3125 L 25 22.15625 Z'/%3E%3C/svg%3E");
        background-repeat: no-repeat no-repeat;
        background-position: center center;
        background-size: cover;
        background-size: 50%;
        margin-bottom: 10px;
      }

      /* --------------------------------
         User visibility
      -------------------------------- */

      /* Menu */

      .ytce-author-context-menu .ytce-header {
      }

      .ytce-author-context-menu button {
        margin-top: 5px;
        width: 100%;
        text-align: left;
        padding-left: 20px;
      }

      .ytce-author-context-menu button.ytce-selected {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24px' height='24px'%3E%3Cpath fill='white' d='M 20.292969 5.2929688 L 9 16.585938 L 4.7070312 12.292969 L 3.2929688 13.707031 L 9 19.414062 L 21.707031 6.7070312 L 20.292969 5.2929688 z'/%3E%3C/svg%3E");
        background-repeat: no-repeat no-repeat;
        background-position: left center;
        background-size: auto 100%;
      }

      /* Messages */

      yt-live-chat-text-message-renderer {
        transition: opacity .5s ease-in-out;
      }

      .ytce-default-visibility-quiet div > yt-live-chat-text-message-renderer:not(:hover) {
        opacity: .5;
      }

      [ytce-author-volume="mute"][class][class]:not(:hover) {
        opacity: .25;
      }
      [ytce-author-volume="mute"]:not(:hover) #content {
        display: flex;
      }
      [ytce-author-volume="mute"]:not(:hover) #message {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      [ytce-author-volume="mute"]:not(:hover) #content > yt-live-chat-author-chip {
        white-space: nowrap;
      }

      [ytce-author-volume="quiet"][class][class]:not(:hover) {
        opacity: .5;
      }

      [ytce-author-volume="normal"][class][class] {
        opacity: 1;
      }

      [ytce-author-volume="highlight"][class][class] {
        opacity: 1;
        border: 1px solid limegreen !important;
        border-radius: 8px;
        background: linear-gradient(90deg, rgba(0,255,0,1) 0%, rgba(0,255,0,1) 20px, rgba(0,255,0,0) 20px);
      }

      [ytce-author-volume="alert"][class][class] {
        opacity: 1;
        border: 1px solid limegreen !important;
        border-radius: 8px;
        background: linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,0,0,1) 20px, rgba(255,0,0,0) 20px);
      }

      .yt-live-chat-author-chip {
        cursor: url("data:image/svg+xml,%3Csvg width='17px' height='19px' viewBox='0 0 17 19' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cg id='bundle-os-x-cursors' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='Made-with-💕by-Azendoo-design-team---@azendoo' transform='translate(-195.000000, -33.000000)'%3E%3Cg id='contextualmenu' transform='translate(195.000000, 33.000000)'%3E%3Cpath d='M8,17.4697 L8,17.9997 L17,17.9997 L17,7.9997 L8,7.9997 L8,8.4267 L8,17.4697 Z' id='cursor' fill='%23FFFFFF'%3E%3C/path%3E%3Cpath d='M0,16.4219 L0,0.4069 L11.591,12.0259 L4.81,12.0259 L4.399,12.1499 L0,16.4219 Z' id='cursor' fill='%23FFFFFF'%3E%3C/path%3E%3Cpath d='M9.0845,17.0962 L5.4795,18.6312 L0.7975,7.5422 L4.4835,5.9892 L9.0845,17.0962 Z' id='cursor' fill='%23FFFFFF'%3E%3C/path%3E%3Cpath d='M7.751,16.4155 L5.907,17.1895 L2.807,9.8155 L4.648,9.0405 L7.751,16.4155 Z' id='cursor' fill='%23000000'%3E%3C/path%3E%3Cpath d='M15,12 L10,12 L10,11 L15,11 L15,12 Z M15,14 L10,14 L10,13 L15,13 L15,14 Z M15,16 L10,16 L10,15 L15,15 L15,16 Z M9,17 L16,17 L16,9 L9,9 L9,17 Z' id='cursor' fill='%23000000'%3E%3C/path%3E%3Cpath d='M1,2.814 L1,14.002 L3.969,11.136 L4.397,10.997 L9.165,10.997 L1,2.814 Z' id='cursor' fill='%23000000'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), auto;
      }
    `);

    ////////////////////////////////
    // App wrapper
    ////////////////////////////////

    const chatEnhancementsWrapper = ce('div', {
        className: 'ytce-wrapper'
    });

    document.body.append(chatEnhancementsWrapper);

    ////////////////////////////////
    // Author Context Menu
    ////////////////////////////////

    let currentUser = undefined;

    const aCMWrapperEl = ce('div', {
        id: 'ytce-author-context-menu',
        className: 'ytce-author-context-menu',
        style: `
          position: fixed;
          left: 0;
          top: 0;
          display: none;
        `
    });

    const aCMHeaderEl = ce('li', {
        name: 'ytce-author-context-menu',
        innerText: '--',
        className: 'ytce-header'
    });

    const aCMMenu = ce('menu', {
        className: 'ytce-menu'
    });

    function setUserVolume(user, volume) {
        if (volume) {
            GM.setValue('authorVolume-' + channelName + '-' + user, volume);
        } else {
            GM.deleteValue('authorVolume-' + channelName + '-' + user);
        }
        authorVolumes[user] = volume;

        chatContainer.querySelectorAll('yt-live-chat-text-message-renderer').forEach((el) => {
            const authorEl = el.querySelector('#author-name');
            const author = authorEl.innerText;
            if (author === user) {
                el.setAttribute('ytce-author-volume', authorVolumes[author]);
            }
        });
    }

    const aCMDefaultButton = ce('button', {
        type: 'button',
        innerText: 'Default',
        className: 'ytce-button'
    });

    aCMDefaultButton.addEventListener('click', () => {
        setUserVolume(currentUser, undefined);
    });

    const aCMMuteButton = ce('button', {
        type: 'button',
        innerText: 'Mute',
        className: 'ytce-button'
    });

    aCMMuteButton.addEventListener('click', () => {
        setUserVolume(currentUser, 'mute');
    });

    const aCMQuietButton = ce('button', {
        type: 'button',
        innerText: 'Quiet',
        className: 'ytce-button'
    });

    aCMQuietButton.addEventListener('click', () => {
        setUserVolume(currentUser, 'quiet');
    });

    const aCMNormalButton = ce('button', {
        type: 'button',
        innerText: 'Normal',
        className: 'ytce-button'
    });

    aCMNormalButton.addEventListener('click', () => {
        setUserVolume(currentUser, 'normal');
    });

    const aCMHighlightButton = ce('button', {
        type: 'button',
        innerText: 'Highlight',
        className: 'ytce-button'
    });

    aCMHighlightButton.addEventListener('click', () => {
        setUserVolume(currentUser, 'highlight');
    });

    const aCMAlertButton = ce('button', {
        type: 'button',
        innerText: 'Alert',
        className: 'ytce-button'
    });

    aCMAlertButton.addEventListener('click', () => {
        setUserVolume(currentUser, 'alert');
    });

    aCMMenu.append(
        aCMHeaderEl,
        append(ce('li'), aCMDefaultButton),
        append(ce('li'), aCMMuteButton),
        append(ce('li'), aCMQuietButton),
        append(ce('li'), aCMNormalButton),
        append(ce('li'), aCMHighlightButton),
        append(ce('li'), aCMAlertButton),
    );

    // TODO: I could maybe be smrter about all the repitition here and above
    const menuButtons = {
        default:   aCMDefaultButton,
        mute:      aCMMuteButton,
        quiet:     aCMQuietButton,
        normal:    aCMNormalButton,
        highlight: aCMHighlightButton,
        alert:     aCMAlertButton
    };

    aCMWrapperEl.append(aCMMenu);

    document.body.addEventListener('contextmenu', (ev) => {
        if (ev.target.matches('.yt-live-chat-author-chip')) {
            ev.preventDefault();
            currentUser = ev.target.innerText;
            const volume = authorVolumes[currentUser];

            for (const [key, el] of Object.entries(menuButtons)) {
                el.classList.remove('ytce-selected');
            }

            if (volume && menuButtons[volume]) {
                menuButtons[volume].classList.add('ytce-selected');
            } else {
                aCMDefaultButton.classList.add('ytce-selected');
            }

            aCMHeaderEl.innerText = currentUser;
            // TODO: make phobic of falling below bottom
            aCMWrapperEl.style.left = ev.clientX + 'px';
            aCMWrapperEl.style.top = ev.clientY + 'px';
            aCMWrapperEl.style.display = 'block';
        }
    });

    document.body.addEventListener('click', (ev) => {
        setTimeout(() => {
            aCMWrapperEl.style.display = 'none';
        }, 0);
    });

    chatEnhancementsWrapper.append(aCMWrapperEl);

    ////////////////////////////////
    // Chat Setting Context Menu
    ////////////////////////////////

    // Wrapper
    const sCMWrapperEl = ce('div', {
        id: 'ytce-settings-menu',
        className: 'ytce-settings-menu',
        style: `
        `
    });

    // Open/Close
    let settingsMenuOpened = false;
    const sCMToggleButton = ce('button', {
        className: 'ytce-settings-toggle',
        type: 'button',
        innerText: 'Open'
    });

    sCMToggleButton.addEventListener('click', () => {
        if (settingsMenuOpened) {
            settingsMenuOpened = false;
            sCMMenu.style.display = 'none';
            sCMToggleButton.innerText = 'Open';
            sCMWrapperEl.classList.remove('ytce-opened');
        } else {
            settingsMenuOpened = true;
            sCMMenu.style.display = 'block';
            sCMToggleButton.innerText = 'Close';
            sCMWrapperEl.classList.add('ytce-opened');
        }
    });

    sCMWrapperEl.append(sCMToggleButton);

    // Menu
    const sCMMenu = ce('menu', {
        className: 'ytce-menu',
        style: 'display: none;'
    });

    sCMMenu.append(
        append(ce('li', {className: 'ytce-help'}), ce('a', {
            href: 'https://cwmonkey.github.io/greasemonkey/youtube-chat-enhancer/',
            innerText: 'YT Chat Enhancer v{% include greasemonkey/youtube-chat-enhancer/version %}',
            target: '_blank'
        }))
    );

    sCMWrapperEl.append(sCMMenu);

    // Volume

    const sCMAlertVolumeInput = ce('input', {
        type: 'range',
        min: 0,
        max: 1,
        step: .1,
        value: .3,
        id: 'ytce-alert-volume'
    });

    sCMMenu.append(
        ce('li', {innerText: 'Alert Volume:', className: 'ytce-header'}),
        append(ce('li'), sCMAlertVolumeInput)
    );

    GM.getValue('alertVolume-' + channelName).then((value) => {
        if (value) {
            sCMAlertVolumeInput.value = parseFloat(value);
        }
    });

    sCMAlertVolumeInput.addEventListener('change', () => {
        GM.setValue('alertVolume-' + channelName, parseFloat(sCMAlertVolumeInput.value));
        mentionAlert.play(parseFloat(sCMAlertVolumeInput.value));
    });

    // Chat Visibility

    function checkChatVisibilityDefault() {
        const chatVisibility = document.querySelector('input[name="ytce-chat-visibility-default"]:checked').value;

        if (chatVisibility == 'quiet') {
            document.body.classList.add('ytce-default-visibility-quiet');
            GM.setValue('chatVisibilityDefault-' + channelName, chatVisibility);
        } else {
            document.body.classList.remove('ytce-default-visibility-quiet');
            GM.deleteValue('chatVisibilityDefault-' + channelName);
        }
    };

    // Visibility Normal
    const sCMChatVisibilityDefaultNormalInput = ce('input', {
        type: 'radio',
        value: 'normal',
        checked: 'checked',
        name: 'ytce-chat-visibility-default',
        id: 'ytce-chat-visibility-default-normal'
    });

    sCMChatVisibilityDefaultNormalInput.addEventListener('change', checkChatVisibilityDefault);

    // Visibility Quiet
    const sCMChatVisibilityDefaultQuietInput = ce('input', {
        type: 'radio',
        value: 'quiet',
        checked: undefined,
        name: 'ytce-chat-visibility-default',
        id: 'ytce-chat-visibility-default-normal'
    });

    sCMChatVisibilityDefaultQuietInput.addEventListener('change', checkChatVisibilityDefault);

    // Append
    sCMMenu.append(
        ce('li', {innerText: 'Default Chat Visibility:', className: 'ytce-header'}),
        append(ce('li'), prepend(ce('label', { innerText: 'Normal' }), sCMChatVisibilityDefaultNormalInput)),
        append(ce('li'), prepend(ce('label', { innerText: 'Quiet' }), sCMChatVisibilityDefaultQuietInput)),
    );

    // Sounds

    // Mentions
    const sCMChatSoundsMentionsInput = ce('input', {
        type: 'checkbox',
        checked: 'checked'
    });

    sCMChatSoundsMentionsInput.addEventListener('change', () => {
        if (sCMChatSoundsMentionsInput.checked) {
            GM.deleteValue('muteMentions-' + channelName);
        } else {
            GM.setValue('muteMentions-' + channelName, 1);
        }
    });

    GM.getValue('muteMentions-' + channelName).then((value) => {
        if (value) {
            sCMChatSoundsMentionsInput.checked = false;
        }
    });

    // "Alerted" Users
    const sCMChatSoundsAlertUsersInput = ce('input', {
        type: 'checkbox',
        checked: 'checked'
    });

    sCMChatSoundsAlertUsersInput.addEventListener('change', () => {
        if (sCMChatSoundsAlertUsersInput.checked) {
            GM.deleteValue('muteAlerteds-' + channelName);
        } else {
            GM.setValue('muteAlerteds-' + channelName, 1);
        }
    });

    GM.getValue('muteAlerteds-' + channelName).then((value) => {
        if (value) {
            sCMChatSoundsAlertUsersInput.checked = false;
        }
    });

    // Keywords
    const sCMChatSoundsKeywordsInput = ce('input', {
        type: 'checkbox',
        checked: 'checked'
    });

    sCMChatSoundsKeywordsInput.addEventListener('change', () => {
        if (sCMChatSoundsKeywordsInput.checked) {
            GM.deleteValue('muteKeywords-' + channelName);
        } else {
            GM.setValue('muteKeywords-' + channelName, 1);
        }
    });

    GM.getValue('muteKeywords-' + channelName).then((value) => {
        if (value) {
            sCMChatSoundsKeywordsInput.checked = false;
        }
    });

    sCMMenu.append(
        ce('li', {innerText: 'Sounds:', className: 'ytce-header'}),
        append(ce('li'), prepend(ce('label', { innerText: 'Mentions' }), sCMChatSoundsMentionsInput)),
        append(ce('li'), prepend(ce('label', { innerText: '"Alerted" Users' }), sCMChatSoundsAlertUsersInput)),
        // append(ce('li'), prepend(ce('label', { innerText: 'Keywords' }), sCMChatSoundsKeywordsInput)),
    );

    // Import/Export

    // Delete

    function deletePreferences(cb) {
        GM.listValues().then((values) => {
            let promises = [];

            values.forEach((key) => {
                promises.push(GM.deleteValue(key));
            });

            Promise.all(promises).then(() => {
                if (cb) cb();
            });
        });
    }

    // Export
    const sCMExportTextarea = ce('textarea');

    const sCMExportButton = ce('button', {
        type: 'button',
        innerText: 'Export',
        className: 'ytce-button'
    });

    sCMExportButton.addEventListener('click', () => {
        GM.listValues().then((values) => {
            const exports = {};
            let promises = [];

            values.forEach((key) => {
                promises.push(GM.getValue(key).then((value) => {
                    exports[key] = value;
                }));
            });

            Promise.all(promises).then(() => {
                sCMExportTextarea.value = JSON.stringify(exports);
            });
        });
    });

    const sCMExportCopyButton = ce('button', {
        type: 'button',
        innerText: 'Copy',
        className: 'ytce-button'
    });

    sCMExportCopyButton.addEventListener('click', () => {
        sCMExportTextarea.select();
        document.execCommand('copy');
    });

    // Import
    const sCMImportTextarea = ce('textarea');

    const sCMImportButton = ce('button', {
        type: 'button',
        innerText: 'Import',
        className: 'ytce-button'
    });

    sCMImportButton.addEventListener('click', () => {
        const value = sCMImportTextarea.value;

        if (!value) return;

        let prefs = {};

        try {
            prefs = JSON.parse(value);
        } catch(err) {
            alert('Failed to import settings');
            return;
        }

        const promises = [];

        if (confirm('Importing these settings will delete your current settings. This cannot be undone. Continue?')) {
            deletePreferences(() => {
                for (const [key, val] of Object.entries(prefs)) {
                    promises.push(GM.setValue(key, val));
                }
            });
        }

        Promise.all(promises).then(() => {
            document.location.reload(true);
        });
    });

    const sCMDeleteButton = ce('button', {
        type: 'button',
        innerText: 'Delete',
        className: 'ytce-button ytce-delete-button'
    });

    sCMDeleteButton.addEventListener('click', () => {
        if (confirm('Delete all your settings, favorited messages and user notes? This cannot be undone.')) {
            deletePreferences(() => {
                document.location.reload(true);
            });
        }
    });

    sCMMenu.append(
        ce('li', {innerText: 'Export Settings:', className: 'ytce-header'}),
        append(ce('li'), sCMExportTextarea),
        append(ce('li'), sCMExportButton, sCMExportCopyButton),
        ce('li', {innerText: 'Import Settings:', className: 'ytce-header'}),
        append(ce('li'), sCMImportTextarea),
        append(ce('li'), sCMImportButton),
        ce('li', {innerText: 'Delete Settings:', className: 'ytce-header'}),
        append(ce('li'), sCMDeleteButton),
    );

    // Wrapper append

    chatEnhancementsWrapper.append(sCMWrapperEl);

    ////////////////////////////////
    // Message Processing
    ////////////////////////////////

    const authorVolumes = {};
    function processMessage(el, alerts) {
        el.classList.add('processed');
        const authorEl = el.querySelector('#author-name');
        const author = authorEl.innerText;
        const mention = el.querySelector('.mention');

        if (sCMChatSoundsMentionsInput.checked && alerts && mention) {
            mentionAlert.play(parseFloat(sCMAlertVolumeInput.value));
        }

        if (authorVolumes[author]) {
            el.setAttribute('ytce-author-volume', authorVolumes[author]);

            if (sCMChatSoundsAlertUsersInput.checked && alerts && authorVolumes[author] === 'alert') {
                authorAlert.play(parseFloat(sCMAlertVolumeInput.value));
            }
        } else {
            GM.getValue('authorVolume-' + channelName + '-' + author).then((value) => {
                if (value) {
                    authorVolumes[author] = value;
                    el.setAttribute('ytce-author-volume', authorVolumes[author]);

                    if (sCMChatSoundsAlertUsersInput.checked && alerts && value === 'alert') {
                        authorAlert.play(parseFloat(sCMAlertVolumeInput.value));
                    }
                }
            });
        }
    }

    let chatContainer = null;
    pollFor('.yt-live-chat-item-list-renderer').then((el) => {
        chatContainer = el;

        el.querySelectorAll('yt-live-chat-text-message-renderer').forEach((el) => {
            processMessage(el, false);
        });

        const ob = new Observer({element: el, fn: () => {
            el.querySelectorAll('yt-live-chat-text-message-renderer:not(.processed)').forEach((el) => {
                processMessage(el, true);
            });
        }})
    });

    /*console.log(window.parent.window.document.querySelector('meta[itemprop="startDate"]').getAttribute('content'));
    console.log(window.parent.window.document.querySelector('meta[itemprop="identifier"], [itemprop="videoId"]').getAttribute('content'));
    console.log(window.parent.window.document.querySelector('meta[name="title"]').getAttribute('content'));*/

    setTimeout(() => {
        mentionAlert.play(parseFloat(sCMAlertVolumeInput.value));
    }, 1000);
})();