// ==UserScript==
// @name         CWM
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  try to take over the world!
// @author       You
// @match        http*://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mysmilies.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

/* Usage:
    // @require      https://cwmonkey.github.io/js/greasemonkey/CWM.js?0.5

    // CWM
    const {
        // pretty debug output
        prettyDebug,
        // stuff
        sluggify, roundTo, once,
        // storage
        set, get, remove,
        // dom
        ce, qs, qsa, trigger, addEventListener, dispatchEvent, pageScrollTop, ngSetValue, append, prepend, addCSS,
        // dom updates
        Observer, pollFor,
        // audio
        speak, Sound,
        // cookie
        getCookie, setCookie,
        // hijack
        hijackWebSocket, hijackXMLHttpRequest,
        // pubsub
        sub, before,
        // ui
        floatingWindow, TimerReminder, Timer
        } = window.CWM;
*/

(function() {
    'use strict';

    console.log('CWM 0.5');

    ////////////////////////////////
    // Pretty Debug
    ////////////////////////////////

    /* Usage:

        // Set up debug logger
        let debugIcon = String.fromCodePoint(0x1f4a1);
        let debugName = '%c Your Script Name';
        const debugStyles = {
            nameStart:  'background:#000;color:#fff;font-weight: bold;border-radius: 3px;',
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

    */

    class prettyDebug {
        constructor(params) {
            params = params || {};
            this.debugIcon = params.debugIcon || '❓';
            this.debugName = params.debugName || '%c Debug ';
            this.debugStyles = {
                name:   'background:#7b46cf;color:#fff',
                method: 'background:#fff;color:#3275e4'
            };
            this.debugPrepend = params.debugPrepend || [this.debugIcon + '' + this.debugName + '%c ', this.debugStyles.name, this.debugStyles.method];
        }

        print(cmd, args) {
            args = Array.prototype.slice.call(args);
            var arg1 = args.shift();
            args.unshift.apply(args, this.debugPrepend);
            args[0] = args[0] + arg1;
            console[cmd].apply(console, args);
        }

        log() {
            this.print('log', arguments);
        }

        trace() {
            this.print('trace', arguments);
        }
    }

    ////////////////////////////////
    // Random Stuff
    ////////////////////////////////

    ////////////////////////////////
    // sluggify
    ////////////////////////////////

    function sluggify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    ////////////////////////////////
    // round to places
    ////////////////////////////////

    function roundTo(n, digits) {
        var negative = false;

        if (digits === undefined) {
            digits = 0;
        }

        if (n < 0) {
            negative = true;
            n = n * -1;
        }

        var multiplicator = Math.pow(10, digits);
        n = parseFloat((n * multiplicator).toFixed(11));
        //n = (Math.round(n) / multiplicator).toFixed(digits);
        n = (Math.ceil(n) / multiplicator).toFixed(digits);

        if (negative) {
            n = (n * -1).toFixed(digits);
        }

        return parseFloat(n);
    }

    ////////////////////////////////
    // Once
    ////////////////////////////////

    // Do something exactly one time for debugging
    const onces = {};
    function once(fn) {
        if (onces[fn]) return;
        onces[fn] = true;
        fn();
    }

    ////////////////////////////////
    // Local Storage
    ////////////////////////////////

    function set(name, val) {
        return localStorage.setItem(name, val);
    }

    function get(name) {
        return localStorage.getItem(name);
    }

    function remove(name) {
        return localStorage.removeItem(name);
    }

    ////////////////////////////////
    // DOM manipulation
    ////////////////////////////////

    // These are attributes that must be set with setAttribute
    const ceAttributes = {
        'for': 1
    };

    // document.createElement
    function ce(tagName, properties) {
        const el = document.createElement(tagName);
        properties = properties || {};

        Object.assign(el, properties);

        Object.entries(properties).forEach(([key, value]) => {
            if (ceAttributes[key]) {
                el.setAttribute(key, value);
            }
        });

        return el;
    }

    // document.querySelector
    function qs(selector) {
        return document.querySelector(selector);
    }

    // querySelectorAll
    function qsa(selector) {
        return document.querySelectorAll(selector);
    }

    function pageScrollTop(el) {
        let scrollTop = el.offsetTop;
        while (el.offsetParent) {
            el = el.offsetParent;
            scrollTop += el.offsetTop || 0;
        }

        return scrollTop;
    }

    let cwmEl = null;

    function _getCwmEl() {
        if (cwmEl) return cwmEl;
        cwmEl = document.querySelector('#__cwm');
        if (!cwmEl) {
            cwmEl = document.createElement('DIV');
            cwmEl.id = '__cwm';
            document.body.append(cwmEl);
        }
        return cwmEl;
    }

    function addEventListener(type, listener, options, el) {
        el = el || _getCwmEl();
        el.addEventListener(type, listener, options);
    }

    function dispatchEvent(type, detail, el) {
        el = el || _getCwmEl();
        const event = new CustomEvent(type, {detail: detail});
        el.dispatchEvent(event);
    }

    function trigger(eventName, el) {
        el = el || _getCwmEl();
        const event = new MouseEvent(eventName, {
            view: window,
            bubbles: true,
            cancelable: true
        });
        const cancelled = !el.dispatchEvent(event);
    }

    ////////////////////////////////
    // Mutation observer
    ////////////////////////////////

    /* Usage:

        const ob = new Observer({element: el, fn: () => {
            el.querySelectorAll('yt-live-chat-text-message-renderer').forEach((el) => {
                processMessage(el);
            });
        }})

    */

    class Observer {
        constructor(params) {
            this.delay = params.delay || false;
            this.element = params.element || document.body;
            this.selector = params.selector || '';
            this.waitForElement = params.waitForElement || false; // requires selector
            this.fn = params.fn || function() {};
            this.mutationType = params.mutationType || 'childList'; // '*' for all
            this.config = params.config || { attributes: false, childList: true, subtree: true };

            if (this.selector && this.waitForElement) {
                this.pollForSelector();
            } else {
                this.start();
            }
        }

        pollForSelector() {
            const el = document.querySelector(this.selector);
            if (el) {
                this.element = el;
                if (this.delay) {
                    this.tryUpdate();
                } else {
                    this.update();
                }
                this.start();
            } else {
                setTimeout(this.pollForSelector.bind(this), 100);
            }
        }

        update() {
            this.fn();
        }

        // We'll try to make sure this doesn't run too many times at once
        tryUpdate() {
            clearTimeout(this.tryUpdateTO);
            this.tryUpdateTO = setTimeout(this.update.bind(this), 100);
        }

        start() {
            const me = this;

            // Wait for dom to get populated, and check again when more stuff is added
            const callback = function(mutationsList, observer) {
                // Use traditional 'for loops' for IE 11
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList' && (me.mutationType === 'childList' || me.mutationType === '*')) {
                        if (me.delay) {
                            me.tryUpdate();
                        } else {
                            me.update();
                        }

                        break;
                    } else if (mutation.type === 'attributes' && (me.mutationType === 'attributes' || me.mutationType === '*')) {
                        if (me.delay) {
                            me.tryUpdate();
                        } else {
                            me.update();
                        }

                        break;
                    }
                }
            };

            // Create an observer instance linked to the callback function
            this.observer = this.observer || new MutationObserver(callback);

            // Only apply this if we are on a useful page
            this.observer.observe(this.element, this.config);
        }

        stop() {
            this.observer.disconnect();
        }
    }

    ////////////////////////////////
    // Poll for
    ////////////////////////////////

    /* Usage:

        pollFor('ytd-menu-service-item-renderer.ytd-menu-popup-renderer', 'Save to Watch later').then((el) => {
            el.querySelectorAll('yt-live-chat-text-message-renderer').forEach((el) => {
                processMessage(el);
            });
        });

    */

    function pollFor(selector, text) {
        const prm = new Promise((resolve, reject) => {
            const poll = function() {
                if (text) {
                    const els = Array.from(qsa(selector));

                    for (let i = 0, l = els.length, el; i < l; i++) {
                        el = els[i];

                        if (el.innerText.trim() === text) {
                            resolve(el);
                            return;
                        }
                    }
                } else {
                    const el = qs(selector);

                    if (el) {
                        resolve(el);
                    } else {
                        setTimeout(poll, 100);
                    }
                }
            };

            poll();
        });

        return prm;
    }


    ////////////////////////////////
    // Angular
    ////////////////////////////////

    function ngSetValue(el, value) {
        let angularEl = window.angular.element(el);
        el.value = value;

        if (el.tagName.toLowerCase() === 'input') {
            angularEl.trigger('input');
        } else {
            angularEl.trigger('change');
        }
    }

    ////////////////////////////////
    // Append/Prepend
    ////////////////////////////////

    // Append "el" to "toEl" and return "toEl"
    function append(toEl, el) {
        const els = Array.prototype.slice.call(arguments,1);

        toEl.append(...els);
        return toEl;
    }

    // Prepend "el" to "toEl" and return "toEl"
    function prepend(toEl, el) {
        const els = Array.prototype.slice.call(arguments,1);

        toEl.prepend(...els);
        return toEl;
    }

    ////////////////////////////////
    // Add Stylesheet
    ////////////////////////////////

    function addCSS(id, text) {
        const el = ce('style', {
            id: id,
            innerHTML: text
        });

        document.body.append(el);
    }

    ////////////////////////////////
    // Speak
    ////////////////////////////////

    function speak(sentence, pitch, rate, volume) {
        const utterance = new SpeechSynthesisUtterance(sentence);
        pitch = pitch || 1;
        rate = rate || 1;
        volume = volume || 1;

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        window.speechSynthesis.speak(utterance);
    }

    ////////////////////////////////
    // Sound
    ////////////////////////////////

    /* Usage:
        const authorAlert = new Sound({
            gain: .3,
            sequence: [{frequency: 400, time: .05}, {frequency: 300, time: .05}]
        });

        authorAlert.play();
    */

    class Sound {
        constructor(params) {
            this.params = params;

            this.params.sequence.forEach((p) => {
                p.context = new AudioContext();
                p.volume = p.context.createGain();
                p.volume.connect(p.context.destination);
                p.volume.gain.setValueAtTime(params.gain, p.context.currentTime);

                p.oscillator = p.context.createOscillator();
                p.oscillator.type = 'sine';
                p.oscillator.frequency.value = p.frequency;
                p.oscillator.connect(p.volume);
            });
        }

        play(gain) {
            if (typeof gain === 'undefined') {
                gain = this.params.gain || .3;
            }

            let timeOffset = 0;
            this.params.sequence.forEach((p) => {
                p.volume.gain.setValueAtTime(gain, p.context.currentTime);

                // TODO: Is it possible to not make a new one every time?
                const oscillator = p.context.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.value = p.frequency;
                oscillator.connect(p.volume);
                oscillator.start(p.context.currentTime + timeOffset);
                oscillator.stop(p.context.currentTime + timeOffset + p.time);
                timeOffset += p.time;
            });
        }
    }

    ////////////////////////////////
    // Cookies
    ////////////////////////////////

    /* Usage:

        setCookie('data-' + videoId, encodeURIComponent(JSON.stringify(videoData)));
        const videoData = decodeURIComponent(getCookie('data-' + v));
    */

    // get
    function getCookie(cname) {
        const name = cname + "=";
        const ca = document.cookie.split(';');

        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
        }

        return undefined;
    }

    // set
    // TODO: Expire
    function setCookie(name, value) {
        document.cookie = name + '=' + value + '; path=/';
    }

    ////////////////////////////////
    // Pub/Sub/Before/Hijack
    ////////////////////////////////

    /* Usage
        hijackWebSocket();
        hijackXMLHttpRequest();

        sub('XMLHttpRequest::send', function(that, args) {
            if (that._openArgs[1].startsWith('/ajax/images?')) {
                console.log(that._openArgs);
            }
        });

        sub('XMLHttpRequest::success', function(that, event) {
            if (that._openArgs[1].startsWith('/ajax/images?')) {
                const resData = JSON.parse(that.response);

                console.log(resData);

                resData.data.images.forEach((img) => {
                    console.log({
                        datetime: img.datetime,
                        url: 'https://i.imgur.com/' + img.hash + img.ext,
                        name: img.name
                    });
                });
            }
        });

        sub('Websocket::message', (instance, event) => {
            if (event.data.includes(',\'FILLED\',')) {
                console.log('order filled');
                const matches = event.data.match(/{"execution_event":{.+}}/);
                console.log(matches);
                try {
                    const data = JSON.parse(matches[0]);
                    console.log(data);
                } catch(err) {

                }
            }
        });
    */

    // Simply send the arguments to the callback
    const subs = {};
    function sub(name, callback) {
        if (!subs[name]) subs[name] = [];
        subs[name].push(callback);
    }

    function pub() {
        let args = Array.prototype.slice.call(arguments);
        const name = args.shift();

        if (subs[name]) {
            subs[name].forEach((cb) => {
                cb.apply(this, args);
            });
        }
    }

    // Send the arguments to the callbacks and allow them to be changed or cancelled
    const befores = {};
    function before(name, callback) {
        if (!befores[name]) befores[name] = [];
        befores[name].push(callback);
    }

    function beforePub(name, that, args) {
        if (befores[name]) {
            let newArgs = undefined;
            befores[name].every((cb) => {
                newArgs = cb.call(that, args);

                if (newArgs === false) {
                    return false;
                } else if (newArgs) {
                    args = newArgs;
                }

                return true;
            });

            if (newArgs === false) {
                // Stops the call
                return false;
            } else if (newArgs) {
                // Changes the call's arguments
                return newArgs;
            }
        }
    }

    // Reduce boilerplate for hijacking
    function hijack(name, func, that, args) {
        pub(name, that, args);

        const newArgs = beforePub(name, that, args);

        if (newArgs === false) {
            return;
        } else if (newArgs) {
            args = newArgs;
        }

        func.apply(that, args);
    }

    ////////////////////////////////
    // WebSocket
    ////////////////////////////////

    function hijackWebSocket() {
        (function(open) {
            WebSocket.prototype.open = function() {
                hijack('Websocket::open', open, this, arguments);
            };
        })(WebSocket.prototype.open);

        (function(send) {
            WebSocket.prototype.send = function() {
                hijack('Websocket::send', send, this, arguments);
            };
        })(WebSocket.prototype.send);

        const _WebSocket = window.WebSocket;
        window.WebSocket = function() {
            const instance = new _WebSocket(...arguments);
            pub('Websocket::new', instance, arguments);

            instance.addEventListener('message', function(event) {
                pub('Websocket::message', instance, event);
            }, false);

            return instance;
        };
    }

    ////////////////////////////////
    // XMLHttpRequest
    ////////////////////////////////

    function hijackXMLHttpRequest() {
        (function(open) {
            XMLHttpRequest.prototype.open = function() {
                this._openArgs = arguments;
                hijack('XMLHttpRequest::open', open, this, arguments);

                this.addEventListener('readystatechange', function(event) {
                    pub('XMLHttpRequest::readystatechange', this, event);
                    if (this.readyState === XMLHttpRequest.DONE) {
                        const status = this.status;

                        if (status === 0 || (status >= 200 && status < 400)) {
                            pub('XMLHttpRequest::success', this, event);
                        }
                    }
                }, false);
            };
        })(XMLHttpRequest.prototype.open);

        (function(setRequestHeader) {
            XMLHttpRequest.prototype.setRequestHeader = function() {
                hijack('XMLHttpRequest::setRequestHeader', setRequestHeader, this, arguments);
            };
        })(XMLHttpRequest.prototype.setRequestHeader);

        (function(send) {
            XMLHttpRequest.prototype.send = function() {
                hijack('XMLHttpRequest::send', send, this, arguments);
            };
        })(XMLHttpRequest.prototype.send);
    }

    ////////////////////////////////
    // UI
    ////////////////////////////////

    ////////////////////////////////
    // Draggable/Resizeable Window
    ////////////////////////////////

    /* Usage:
        const myWindow = new floatingWindow({
            name: 'mine', // Used as part of key to store size/position
            data: data, // Stored values (height, width, top, left) go here
                        // Format: `floatingWindow-${name}-height`, etc
            set: setValue, // Function sto store size/position
            title: 'My Window', // Title to show in header
            width: 200, // Defaults
            height: 100,
            top: 100,
            left: 100
        });
    */

    class floatingWindow {
        constructor(params) {
            this.params = params;

            // Used for saving data
            this.name = params.name;
            this.data = params.data; // Saved values
            this.set = params.set;

            this.prefix = 'floatingWindow-' + this.name + '-';

            // Other
            this.title = params.title;

            // Defaults
            this.defaultWidth = params.width || 100;
            this.defaultHeight = params.height || 100;
            this.defaultTop = params.top || 0;
            this.defaultLeft = params.left || 0;

            // Window elements
            this.windowEl = null;
            this.headerEl = null;
            this.contentEl = null;
            this.vpEl = null;

            this.sections = {};

            // init
            this.create();
        }

        create() {
            const data = this.data;
            const prefix = this.prefix;
            const set = this.set;

            // Window size/position
            let top = data[prefix + 'top'] || this.defaultTop;
            let left = data[prefix + 'left'] || this.defaultLeft;
            let width = data[prefix + 'width'] || this.defaultWidth;
            let height = data[prefix + 'height'] || this.defaultHeight;

            // Viewport size, to constrain window
            // TODO: Compensate for page scrollbar width
            let vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            let vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);

            addEventListener('resize', (event) => {
                vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            });

            // Constrain to viewport
            if (height > vh) height = vh;
            if (top + height > vh) top = vh - height;
            if (width > vw) width = vw;
            if (left + width > vw) left = vw - width;
            // TODO: Shrink size if we end up with negative values?
            if (top < 0) top = 0;
            if (left < 0) left = 0;

            const windowEl = ce('SECTION', {
                className: 'cwm-fw-window cwm-floating-window-' + sluggify(this.name)
            });

            const headerEl = ce('H2', {
                className: 'cwm-fw-header',
                textContent: this.title
            });

            /* const titleButtonsEl = ce('SPAN', {
                className: 'samh-buttons'
            });

            const minimizeEl = ce('SPAN', {
                className: 'samh-tools'
            }); */

            const contentEl = ce('DIV', {
                className: 'cwm-fw-content'
            });

            windowEl.append(headerEl, contentEl);

            this.windowEl = windowEl;
            this.headerEl = headerEl;
            this.contentEl = contentEl;

            document.body.append(windowEl);

            // Drag & Resize

            windowEl.style.width = width + 'px';
            windowEl.style.height = height + 'px';
            windowEl.style.left = left + 'px';
            windowEl.style.top = top + 'px';

            windowEl.setAttribute('data-x', left);
            windowEl.setAttribute('data-y', top);

            interact(windowEl).resizable({
                // resize from all edges and corners
                edges: { left: true, right: true, bottom: true, top: true },
                margin: 8,
                listeners: {
                    move (event) {
                        var target = event.target;

                        var x = (parseFloat(target.getAttribute('data-x')) || 0);
                        var y = (parseFloat(target.getAttribute('data-y')) || 0);

                        // update the element's style
                        target.style.width = event.rect.width + 'px';
                        target.style.height = event.rect.height + 'px';

                        // translate when resizing from top or left edges
                        x += event.deltaRect.left;
                        y += event.deltaRect.top;

                        // target.style.transform = 'translate(' + x + 'px,' + y + 'px)';
                        target.style.left = x + 'px';
                        target.style.top = y + 'px';

                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);

                        // Store values
                        set(prefix + 'width', event.rect.width);
                        set(prefix + 'height', event.rect.height);

                        set(prefix + 'left', x);
                        set(prefix + 'top', y);
                    }
                },
                modifiers: [
                    // keep the edges inside the parent
                    interact.modifiers.restrictEdges({
                        outer: document.body
                    }),

                    // minimum size
                    interact.modifiers.restrictSize({
                        min: { width: 100, height: 50 }
                    })
                ] //,
                // inertia: true
            }).draggable({
                cursorChecker() {},
                allowFrom: '.cwm-fw-header',
                listeners: {
                    move (event) {
                        var target = event.target;
                        // keep the dragged position in the data-x/data-y attributes
                        var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        // constrain to viewport
                        if (x + event.rect.width > vw) x = vw - event.rect.width;
                        if (y + event.rect.height > vh) y = vh - event.rect.height;
                        if (x < 0) x = 0;
                        if (y < 0) y = 0;

                        // translate the element
                        // target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                        target.style.left = x + 'px';
                        target.style.top = y + 'px';

                        // update the posiion attributes
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);

                        // Store values
                        set(prefix + 'left', x);
                        set(prefix + 'top', y);
                    }
                },
                // inertia: true,
                modifiers: [
                    interact.modifiers.restrictEdges({
                        outer: {
                            left: 0, // the left edge must be >= 0
                            top: 0, // the top edge must be >= 0
                            // These don't seem to work
                            right: vw, // the right edge must be <= viewport width
                            bottom: vh, // the bottom edge must be <= viewport height
                        }
                    })
                ]
            });
        }

        addSection(params) {
            const className = params.className || '';
            const sectionEl = ce('SECTION', {
                className: 'cwm-fw-section ' + className
            });
            const key = params.key || floatingWindow.getNewKey();
            this.sections[key] = sectionEl;
            this.contentEl.append(sectionEl);

            return sectionEl;
        }

        createRow(params) {
            params = params || {};
            const className = params.className || '';
            const rowEl = ce('DIV', { className: 'cwm-fw-row ' + className });
            const rowContentEl = ce('DIV', { className: 'cwm-fw-row-content' });
            const rowActionsEl = ce('DIV', { className: 'cwm-fw-row-actions' });
            rowEl.append(rowContentEl, rowActionsEl);

            return {
                rowEl: rowEl,
                rowContentEl: rowContentEl,
                rowActionsEl: rowActionsEl
            };
        }

        createTimerRow(params) {
            const els = this.createRow();
            const {rowEl, rowContentEl, rowActionsEl} = els;
            const timerEl = ce('SPAN', {
                className: 'cwm-fw-timer'
            });

            const reminders = params.reminders;

            const timer = new Timer(timerEl, params.time, reminders);

            timer.update();

            rowContentEl.append(ce('STRONG', { textContent: params.title + ': ' }), timerEl);

            return els;
        }

        static keyCounter = 0;

        static getNewKey() {
            floatingWindow.keyCounter++;
            return 'cwm-fw-' + Date.now() + floatingWindow.keyCounter;
        }
    }

    ////////////////////////////////
    // Timers
    ////////////////////////////////

    /* Usage:
        // Assuming we are loading store data in with this tye of format
        const data = {'my-timer': {}}

        // setup
        const d = new Date();
        const dp6 = new Date(d.getTime() + 6 * 60 * 60 * 1000);

        const my10mReminderSound = new Sound({
            gain: .3,
            sequence: [{frequency: 500, time: .05}, {frequency: 1, time: .03}, {frequency: 600, time: .05}, {frequency: 1, time: .03}, {frequency: 700, time: .05}]
        });

        const my0mReminderSound = new Sound({
            gain: .3,
            sequence: [{frequency: 700, time: .05}, {frequency: 1, time: .03}, {frequency: 800, time: .05}, {frequency: 1, time: .03}, {frequency: 900, time: .05}]
        });

        const key = 'my-timer';
        const time = dp6.getTime();
        const value = data[key];

        value.time = time;

        const timerEl = ce('SPAN', {
            className: 'my-timer'
        });

        // Create reminders

        let reminders = [];

        if (!value.triggered10m) {
            reminders.push(new TimerReminder({
                key: key,
                property: 'triggered10m',
                title: '10m warning',
                text: 'This timer will expire in 10 minutes.',
                image: 'https://i.imgur.com/Z8bK9AA.jpg',
                sound: my10mReminderSound,
                remaining: 10 * 60 * 1000,
                fn() {
                    data[key].triggered10m = 1;
                    setValue(key, value);
                }
            }));
        }

        if (!value.triggered0m) {
            reminders.push(new TimerReminder({
                key: key,
                property: 'triggered0m',
                title: 'Timer expired',
                text: 'This timer has expired.',
                image: 'https://i.imgur.com/Z8bK9AA.jpg',
                sound: my0mReminderSound,
                remaining: 0,
                fn() {
                    data[key].triggered0m = 1;
                    setValue(key, value);
                }
            }));
        }

        // Create timer
        const timer = new Timer(timerEl, time, reminders);

        timer.update();

        document.body.append(timerEl);
    */

    class TimerReminder {
        constructor(params) {
            this.params = params;

            // notification
            this.text = params.text;
            this.title = params.title;
            this.image = params.image;

            // other
            this.key = params.key; // Used to make sure we don't fire reminders on multiple tabs
            this.property = params.property; // SAA

            this.remaining = params.remaining;
            this.sound = params.sound;
            this.fn = params.fn;

            // state
            this.triggered = false;
        }

        trigger() {
            // Only fire once
            if (this.triggered) return false;
            this.triggered = true;

            // See if this has already been triggered
            GM.getValue(this.key).then((value) => {
                if (!value || value[this.property]) return;
                const triggeringKey = this.key + '.' + this.property;
                dispatchEvent(this.property, {key: triggeringKey, newValue: '1'});
                const triggering = get(triggeringKey);
                if (triggering) return;
                set(triggeringKey, 1);

                if (this.text) {
                    GM.notification(this.params);
                }

                if (this.sound) {
                    this.sound.play();
                }

                if (this.fn) {
                    this.fn();
                }

                setTimeout(() => {
                    // TODO: Add to CWM, derp
                    localStorage.removeItem(triggeringKey);
                });
            });
        }
    }

    class Timer {
        constructor(el, time, reminders) {
            this.el = el;
            this.time = time;
            this.reminders = reminders;
            this.timeout = null;

            const date = new Date(time);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            this.hours = hours % 12 || 12;
            this.minutes = ('' + minutes).padStart(2, '0');
            this.ampm = hours >= 12 ? 'pm' : 'am';
        }

        update() {
            clearTimeout(this.timeout);
            const now = Date.now();
            let remaining = this.time - now;
            let first = 0;
            let second = 0;
            let nextto = 1000;
            let secondPadAmount = 2;

            let firstUnit = 'h';
            let secondUnit = 'm';

            const hours = this.hours;
            const minutes = this.minutes;
            const ampm = this.ampm;

            if (this.reminders) {
                this.reminders.forEach((reminder, i) => {
                    reminder = this.reminders[i];

                    if (remaining < reminder.remaining) {
                        reminder.trigger();
                        delete this.reminders[i];
                    }
                });
            }

            // done
            if (remaining <= 0) {
                this.el.classList.add('done');
                nextto = null;
            // seconds
            } else if (remaining < 60 * 1000) {
                first = Math.floor(remaining / 1000);
                second = remaining - (first * 1000);
                nextto = 100;
                secondPadAmount = 3;
                firstUnit = 's';
                secondUnit = 'ms';
            // minutes
            } else if (remaining < 60 * 60 * 1000) {
                first = Math.floor(remaining / 60 / 1000);
                second = Math.floor((remaining - (first * 60 * 1000)) / 1000);
                firstUnit = 'm';
                secondUnit = 's';
            // hours
            } else {
                first = Math.floor(remaining / 60 / 60 / 1000);
                second = Math.floor((remaining - (first * 60 * 60 * 1000)) / 60 / 1000);
            }

            first = ('' + first).padStart(2, '0');
            second = ('' + second).padStart(secondPadAmount, '0');

            this.el.textContent = `${first}${firstUnit}${second}${secondUnit} (${hours}:${minutes}${ampm})`;

            if (nextto) {
                this.timeout = setTimeout(this.update.bind(this), nextto);
            }
        }
    }

    ////////////////////////////////
    // Export
    ////////////////////////////////

    window.CWM = {
        prettyDebug: prettyDebug,

        // stuff
        sluggify: sluggify,
        roundTo: roundTo,
        once: once,

        // storage
        set: set,
        get: get,
        remove: remove,

        // dom
        ce: ce,
        qs: qs,
        qsa: qsa,
        trigger: trigger,
        addEventListener: addEventListener,
        dispatchEvent: dispatchEvent,
        pageScrollTop: pageScrollTop,
        ngSetValue: ngSetValue,
        append: append,
        prepend: prepend,
        addCSS: addCSS,
        // dom updates
        Observer: Observer,
        pollFor: pollFor,

        // audio
        speak: speak,
        Sound: Sound,

        // cookie
        getCookie: getCookie,
        setCookie: setCookie,

        // hijack
        hijackWebSocket: hijackWebSocket,
        hijackXMLHttpRequest: hijackXMLHttpRequest,

        // pubsub
        sub: sub,
        before: before,

        // ui
        floatingWindow: floatingWindow,
        TimerReminder: TimerReminder,
        Timer: Timer,
    };
})();