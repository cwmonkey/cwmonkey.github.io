---
---
{% include greasemonkey/slack-enhancer/meta.js %}

/* TODO:
   BUG: "reply in thread" opens thread in right column
   BUG: Opening a thread in the right column can open it in the main window if you go to that channel
*/

(function() {
    'use strict';

    console.log('Slack Enhancer...');

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

    const pathParts = window.location.pathname.split('/');
    const workspaceId = pathParts[2];

    /* ---------------------------------
       Terrible link builder bullshit
    --------------------------------- */

    function localLink(location) {
        const threadUrlParts = location.split(/[\/&=]/);
        const channelId = threadUrlParts[4];
        const threadId = threadUrlParts[6];
        let threadUrl = 'https://app.slack.com/client/' + workspaceId + '/' + channelId

        if (threadId) {
            threadUrl += '/thread/' + channelId + '-' + threadId;
        }

        return threadUrl;
    }

    function jankyLinkBuilder(content, location) {
        const oldInnerHTML = content.innerHTML;

        document.body.classList.add('link_loading');

        content.innerHTML = location;

        pollFor('.p-draft_unfurls__unfurl').then((el) => {
            // Fix for a link being posted
            let a = el.querySelector('a');

            // TODO: check to see if on same slack instance
            if (a && !a.href.includes('slack.com')) {
                content.innerHTML = oldInnerHTML;
                console.log('navigating', a, location);
                window.location = localLink(location);
                return;
            }

            el.click();

            return pollFor('.c-sk-modal_portal .c-message_attachment__part a');
        }).then((el) => {
            if (!el) return;
            content.innerHTML = oldInnerHTML;
            el.click();
            console.log(el);
            document.body.classList.remove('link_loading');
        });
    }

    function gotoLocation(data) {
        const a = document.querySelector('a[href="' + data.location + '"]');

        if (a) {
            a.click();
        } else {
            const content = document.querySelector('.ql-editor p');

            // If there are no message boxes around, click the threads nav
            if (!content) {
                document.body.classList.add('link_loading');

                const threads = document.querySelector('[data-item-key="Vall_threads"]');

                if (!threads) {
                    const location = data.location.replace('/archives/', '/messages/');
                    window.location = location;
                    return;
                }

                threads.click()

                pollFor('.ql-editor p').then((el) => {
                    jankyLinkBuilder(el, data.location);
                });

                return;
            }

            jankyLinkBuilder(content, data.location);
        }
    }

    /* ---------------------------------
       Slack Redirect
    --------------------------------- */

    if (window.location.pathname.match(/^\/archives\//)) {
        pollFor('a[href^="/messages/"][target="_self"]').then((el) => {
            // console.log(el.href);
            window.location = el.href;
        });

        return;
    }

    /* ---------------------------------
       Mentions/Activity/Threads Page
    --------------------------------- */

    // If this is an iframe assume it's the right sidebar
    if (window.parent !== window /*&& pathParts[3] && pathParts[3] === 'activity-page'*/ ) {
        console.log('Slack Mentions... Iframe...');

        function postMessage(data) {
            window.parent.window.postMessage(data, window.location.protocol + '//' + window.location.host);
        }

        addCSS('sm-iframe', `
            .p-top_nav {
                display: none;
            }

            .p-workspace-layout {
                grid-template-rows: 0 auto !important;
            }

            .p-workspace-layout .p-workspace__secondary_view,
            .p-workspace__primary_view {
                max-height: none;
            }

            body:not(.link_loading) .p-workspace__primary_view:not([aria-label="Mentions & reactions"]) {
                display: none;
            }

            .p-activity_page__item_background {
                margin: 0 !important;
                border-radius: 0 !important;
                border-top: none;
                border-right: none;
                border-bottom: none;
                border-left: 1px solid rgba(var(--sk_primary_background,255,255,255),1);
            }

            .c-message_kit__message {
                margin-top: 0;
            }

            .p-activity_page__item {
                border-radius: 0 !important;
            }

            .p-member_profile_hover_card__popover {
                right: 0 !important;
            }

            .link_loading .c-sk-modal_portal,
            .link_loading .p-client_container {
                opacity: 0;
            }

        `);

        window.addEventListener('message', (ev) => {
            if (ev.origin !== window.location.protocol + '//' + window.location.host) return;

            const data = ev.data;

            if (data.type === 'location') {
                gotoLocation(data);
                // console.log('trying to navigate to ' + data.location);
            } else if (data.type === 'mentions') {
                document.querySelector('[data-item-key="Pactivity"]').click();
            }

        }, false);

        function isOrChild(el, selector) {
            return el.matches(selector) || el.closest(selector);
        }

        document.addEventListener('click', (ev) => {
            // Close thread
            if (isOrChild(ev.target, '.p-flexpane_header [aria-label="Close secondary view"]')) {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                document.querySelector('[data-item-key="Pactivity"]').click();
                return;
            }

            // Forward link to main pane
            if (
                isOrChild(ev.target, '.c-sk-modal_portal')
            ) {
                return;
            }

            // clicked a slack link
            if (isOrChild(ev.target, 'a[href*="slack.com/archives/"]')) {
                console.log('clicked a slack link', ev.target);

                let a = ev.target;

                if (a.tagName !== 'A') {
                    a = a.closest('a');
                }

                postMessage({
                    type: 'location',
                    location: a.href
                });

                console.log(ev.target.href);
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                return;
            }

            // don't hijack tool links
            if (
                isOrChild(ev.target, '.p-video_controls_overlay')
                || isOrChild(ev.target, '.c-reaction')
                || isOrChild(ev.target, '.p-file_image_thumbnail__wrapper')
                || isOrChild(ev.target, '.c-message_attachment__row')
                || isOrChild(ev.target, 'a[target="_blank"]:not([href*="slack.com/archives/"])')
                || isOrChild(ev.target, '.p-threads_view__footer')
            ) {
                return;
            }

            const messageWrapper = ev.target.closest('.c-virtual_list__item');
            // id="reaction-  ?
            if (messageWrapper) {
                const a = messageWrapper.querySelector('a');
                if (!a) return;
                // https://unzipped.slack.com/archives/C016Q92U1QA/p1689366782061219?thread_ts=1689363512.567069&cid=C016Q92U1QA
                if (a.href.includes('?thread_ts=')) {
                    // Let it go
                } else {
                    console.log('else', a);
                    postMessage({
                        type: 'location',
                        location: a.href
                    });
                    console.log(a.href);
                    ev.stopPropagation();
                    ev.stopImmediatePropagation();
                }
            }
        });

        const nativeEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(...args) {
            if (args[0] === 'click') {
                // console.log(this, args);
            }
            nativeEventListener.apply(this, args);
        }

        return;
    }

    /* ---------------------------------
       Main Slack Page
    --------------------------------- */

    // Don't run in iframes
    if (window.parent !== window) return

    addCSS('sm-general', `
        :root {
            --iframe-width: 320px;
            --iframe-top: 0;
        }

        .p-workspace-layout {
            margin-right: var(--iframe-width);
        }

        #mentions_iframe {
            position: fixed;
            top: var(--iframe-top);
            right: 0;
            z-index: 1000;
            border: none;
            width: var(--iframe-width);
            height: 100vh;
        }

        .link_loading .c-sk-modal_portal,
        .link_loading .p-client_container {
            opacity: 0;
        }

        .link_loading:after {
            content: "Link loading...";
            position: absolute;
            color: #fff;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
`);

    const iframe = ce('iframe', {
        src: 'https://app.slack.com/client/' + workspaceId + '/activity-page',
        id: 'mentions_iframe',
    });

    function iframePostMessage(data) {
        iframe.contentWindow.postMessage(data, window.location.protocol + '//' + window.location.host);
    }

    window.addEventListener('message', (ev) => {
        if (ev.origin !== window.location.protocol + '//' + window.location.host) return;

        const data = ev.data;

        if (data.type === 'location') {
            console.log(data);
            gotoLocation(data);
        }

    }, false);

    pollFor('body').then(() => {
        document.body.append(iframe);

        document.body.addEventListener('click', (ev) => {
            if (ev.target.closest('.c-message_kit__thread_replies')) {
                ev.preventDefault();
                ev.stopPropagation();

                let button = ev.target.closest('.c-message_kit__thread_replies').querySelector('button') || ev.target;

                setTimeout(() => {
                    const link = ev.target.closest('.c-virtual_list__item').querySelector('a');
                    const messageUrl = link.href;
                    const threadUrlParts = messageUrl.split('/');
                    const channelId = threadUrlParts[4];
                    const threadId = link.dataset.ts;
                    // const threadUrl = 'https://app.slack.com/client/' + workspaceId + '/' + channelId + '/thread/' + channelId + '-' + threadId;
                    const threadUrl = messageUrl + '?thread_ts=' + threadId + '&cid=' + channelId;
                    console.log(threadUrl);

                    iframePostMessage({
                        type: 'location',
                        location: threadUrl
                    });
                }, 100);
            } else if (ev.target.tagName === 'A' && ev.target.href.match(/https:\/\/[^.]+.slack.com\/archives\/[^\/]+\/[^?]+\?thread_ts=[^&]+&cid=.+/)) {
                ev.preventDefault();
                ev.stopPropagation();

                // const threadUrlParts = ev.target.href.split(/[\/&=]/);
                // const channelId = threadUrlParts[4];
                // const threadId = threadUrlParts[6];
                // const threadUrl = 'https://app.slack.com/client/' + workspaceId + '/' + channelId + '/thread/' + channelId + '-' + threadId;
                const threadUrl = ev.target.href;

                iframePostMessage({
                    type: 'location',
                    location: threadUrl
                });
            } else if (ev.target.closest('[data-item-key="Pactivity"]')) {
                ev.preventDefault();
                ev.stopPropagation();

                iframePostMessage({
                    type: 'mentions'
                });
            }
        });
    });
})();