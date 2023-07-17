// ==UserScript==
// @name         CWM
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @match        http*://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mysmilies.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

/* Usage:
    // @require      https://cwmonkey.github.io/js/greasemonkey/CWM.js?0.3

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
*/

(function() {
    'use strict';

    console.log('CWM 0.3');

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

    ////////////////////////////////
    // DOM manipulation
    ////////////////////////////////

    function ce(tagName, properties) {
        const el = document.createElement(tagName);
        properties = properties || {};

        Object.assign(el, properties);

        return el;
    }

    function qs(selector) {
        return document.querySelector(selector);
    }

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

    function trigger(eventName, el) {
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

        pollFor('.yt-live-chat-item-list-renderer').then((el) => {
            el.querySelectorAll('yt-live-chat-text-message-renderer').forEach((el) => {
                processMessage(el);
            });
        });

    */

    function pollFor(selector, text) {
        const prm = new Promise((resolve, reject) => {
            const poll = function() {
                const el = qs(selector);

                if (el && (!text || text === el.innerText)) {
                    resolve(el);
                } else {
                    setTimeout(poll, 100);
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

        // dom
        ce: ce,
        qs: qs,
        qsa: qsa,
        trigger: trigger,
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
        before: before
    };
})();