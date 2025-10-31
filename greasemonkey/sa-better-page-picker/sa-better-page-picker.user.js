---
---
{% include greasemonkey/sa-better-page-picker/meta.js %}

(function() {
    'use strict';

    // Make styling for new element and hide old select
    const style = document.createElement("STYLE");
    style.textContent = `
        /* Hide old page picker dropdown */
        div.pages select {
            display: none !important;
        }

        /* Style new page picker conform to SA styles */
        div.pages input {
            margin: 0 0 3px 10px;
            padding: 0 0 0 4px;
            width: 50px;
            line-height: 30px;
            border-radius: 0;
            border: 1px solid #666;
            border-right: none;
            vertical-align: bottom;
            box-shadow: inset 1px 1px 1px #fff, inset -1px -1px 1px #bbb, 2px 2px 2px rgba(26,26,26,.39);
        }

        /* Always show up/down arrows */
        div.pages input::-webkit-inner-spin-button {
            padding: 0;
            outline: 1px solid #666;
            box-shadow: inset 1px 1px 1px #fff, inset -1px -1px 1px #bbb, 2px 2px 2px rgba(26, 26, 26, .39);
        }
        div.pages input {
            -moz-appearance: textfield;
        }
        div.pages input:hover,
        div.pages input:focus {
            -moz-appearance: auto;
        }

        div.pages button {
            margin: 0 10px 3px 0;
            padding: 0 4px 0 4px;
            line-height: 30px;
            border-radius: 0;
            border: 1px solid #666;
            vertical-align: bottom;
            box-shadow: inset 1px 1px 1px #fff, inset -1px -1px 1px #bbb, 2px 2px 2px rgba(26,26,26,.39);
        }
        div.pages button:hover {
            background-color: #b05042;
            box-shadow: inset 1px 1px 1px #fd735f, inset -1px -1px 1px #8a3023, 2px 2px 2px rgba(26,26,26,.39);
            color: #fff;
        }
    `;

    const darkStyleOverrides = `
        div.pages input {
            border: #304867 1px solid;
            border-right: none;
            box-shadow: inset 1px 1px 1px #65a1ee, inset -1px -1px 1px #65a1ee, 2px 2px 2px rgba(96,96,96,.39);
        }

        div.pages button {
            border: #304867 1px solid;
            border-left: none;
            box-shadow: inset 1px 1px 1px #65a1ee, inset -1px -1px 1px #65a1ee, 2px 2px 2px rgba(96,96,96,.39);
        }
        div.pages button:hover {
            background-color: #304867;
            color: #eee;
            box-shadow: inset 1px 1px 1px #65a1ee, inset -1px -1px 1px #65a1ee, 2px 2px 2px rgba(96,96,96,.39);
        }

        /* Always show up/down arrows */
        div.pages input::-webkit-inner-spin-button {
            outline: 1px solid #666;
            box-shadow: inset 1px 1px 1px #65a1ee, inset -1px -1px 1px #65a1ee, 2px 2px 2px rgba(96, 96, 96, .39);
        }
    `;

    document.documentElement.append(style);

    // Fix dark stylings if necessary

    function fixDarkStyles() {
        const body = document.querySelector('body');

        // If we have a body we will assume the head is done loading
        if (body) {
            // Fragile, but the best indicator we have of dark theme
            const darkLink = document.querySelector('link[rel="stylesheet"][href*="dark.css"]');

            if (darkLink) {
                style.textContent += darkStyleOverrides;
            }
        } else {
            // Poll again later if we didn't find a body element
            setTimeout(fixDarkStyles, 30);
        }
    }

    fixDarkStyles();

    // New page picker event handler
    function goToPage(page, url) {
        page = parseInt(page) || 1;
        window.location = url + "&pagenumber=" + page;
    }

    // Wait for the select to render on the page
    let max = null;
    let dataUrl = null;
    let currentPage = null;

    function addNewPagePicker(existsSelector, selector) {
        // Since this function can fire before the select is fully loaded, we will wait for a later element to load
        const existsElement = document.querySelector(existsSelector);

        if (existsElement) {
            const select = document.querySelector(selector);

            // If we haven't set the last page yet, set it once
            if (!max) {
                const options = select.children;
                max = options[options.length - 1].value;
                dataUrl = select.dataset.url;
                currentPage = select.value;
            }

            // Make new page picker elements
            const input = document.createElement("INPUT");
            input.type = "number";
            input.min = 1;
            input.max = max;
            input.value = currentPage;

            const button = document.createElement("BUTTON");
            button.type = "button";
            button.textContent = "Go";
            button.dataset.url = dataUrl;

            // Event listeners, button click or [enter] press in text box

            input.addEventListener("keydown", (event) => {
                if (event.key === 'Enter' || event.keyCode === 13) {
                    goToPage(input.value, dataUrl);
                }
            });

            button.addEventListener("click", () => {
                goToPage(input.value, dataUrl);
            });

            // Append new page picker elements after old select element
            select.after(input, button);
            select.remove();
        } else {
            // If not found, keep polling for select
            setTimeout(addNewPagePicker.bind(this, existsSelector, selector), 30);
        }
    }

    // Poll for old page picker and add new page pickers
    addNewPagePicker("#thread", ".breadcrumbs .pages select");
    addNewPagePicker("#copyright", ".breadcrumbs .pages select");
})();
