---
---
{% include greasemonkey/slack-enhancer/meta.js %}

(function() {
    'use strict';

    console.log('Slack Enhancer...');

    // The element we want to listen to for notification events
    const tabsSelector = '.p-tab_rail [role="tablist"]';

    // The DM element we'll look for to see if we have DM's
    const dmCountSelector = '#dms .c-mention_badge';

    // The Activity element we'll look for to see if we have new thread messages
    const activityCountSelector = '#activity .c-mention_badge';

    // The mention or DM indicator in the left bar
    const atOrDmCountSelector = '.p-view_contents--sidebar .c-mention_badge';

    // favicon
    let link = null;
    // Don't infinite loop
    let ignoreNextFaviconChange = false;

    // favicons
    const readIcon = 'data:image/png;base64,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';
    const unreadIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAACxLAAAsSwGlPZapAAAFGmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDg4LCAyMDIwLzA3LzEwLTIyOjA2OjUzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMTItMTBUMTA6MzI6MzEtMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTEwVDEwOjMzOjM2LTA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTEwVDEwOjMzOjM2LTA4OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmExODkyZGRmLTQ4ZDIt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';
    const alertIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFGmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDg4LCAyMDIwLzA3LzEwLTIyOjA2OjUzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjIuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMTItMDhUMTU6Mjg6MzItMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTEyLTA4VDE1OjMxOjA2LTA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTEyLTA4VDE1OjMxOjA2LTA4OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmE0YTc2OTg1LTE3NmMt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';

    // console log events
    const debug = false;
    const prepend = '[Slack Enhancer] - ';

    // Listen for a node to be created then resolve the promise and stop listening when found
    function listenForNode(selector) {
        const prm = new Promise((resolve, reject) => {
            const tabEl = document.querySelector(tabsSelector);

            // If we don't find the node on the first shot (unlikely since we are running at document start), listen for it in the document
            if (!tabEl) {
                const config = { attributes: false, childList: true, subtree: true };

                const callback = (mutationList, observer) => {
                    debug && console.log(prepend + 'listenForNode: callback');
                    const tabEl = document.querySelector(tabsSelector);

                    if (tabEl) {
                        debug && console.log(prepend + 'listenForNode: Target element found');
                        resolve(tabEl);

                        // Stop listening once found
                        observer.disconnect();
                    }
                };

                const observer = new MutationObserver(callback);
                observer.observe(document, config);
            } else {
                debug && console.log(prepend + 'listenForNode: Target element found instantly');
                resolve(tabEl);
            }
        });

        return prm;
    }

    // favicon element changes so we need to keep getting it
    function getLink() {
        // Get favicon element
        link = document.querySelector('link[rel~="icon"]');
    }

    function checkNotificationState() {
        setTimeout(() => {
            debug && console.log(prepend + '%ccheckNotificationState', 'font-weight:bold');

            getLink();

            const dmCountEl = document.querySelector(dmCountSelector);
            const atOrDmCountEl = document.querySelector(atOrDmCountSelector);
            const activityCountEl = document.querySelector(activityCountSelector);

            const currentTitle = document.title;

            if (debug) {
                if (link.href === readIcon) {
                    console.log(prepend + 'checkNotificationState: favicon indicates read');
                } else if (link.href === unreadIcon) {
                    console.log(prepend + 'checkNotificationState: favicon indicates unread');
                } else if (link.href === alertIcon) {
                    console.log(prepend + 'checkNotificationState: favicon indicates alert');
                } else {
                    console.log(prepend + 'checkNotificationState: favicon indicates other');
                }

                if (atOrDmCountEl) {
                    console.log(prepend + 'checkNotificationState: We have been @\'d or DM\'d');
                }

                if (dmCountEl) {
                    console.log(prepend + 'checkNotificationState: We have been DM\'d');
                }

                if (currentTitle.match(/! .*/)) {
                    console.log(prepend + 'checkNotificationState: title indicates we have been @\'d or DM\'d');
                }
            }

            // We have a legit @ or dm, do the red dot, change * to !
            if (dmCountEl || atOrDmCountEl) {
                debug && console.log(prepend + 'checkNotificationState: We have a DM or @');
                ignoreNextFaviconChange = true;
                link.href = alertIcon;
                document.title = currentTitle.replace(/\* /, '! ');
                // Otherwise if it's just a thread reply, make it look just "unread"
            } else if (currentTitle.match(/! .*/) || activityCountEl) {
                debug && console.log(prepend + 'checkNotificationState: We have thread or channel notification');
                ignoreNextFaviconChange = true;
                link.href = unreadIcon;
                document.title = currentTitle.replace(/! /, '* ');
            }
        }, 100);
    }

    listenForNode(tabsSelector).then((tabEl) => {
        // Check the state once right away
        checkNotificationState();

        // Now that we have the tab column, listen for changes on it
        const config = { attributes: false, childList: true, subtree: true };
        const observer = new MutationObserver(checkNotificationState);
        observer.observe(tabEl, config);

        getLink();
    });
})();