{% unless included_createElementFromHTML %}{% assign included_createElementFromHTML = true %}

////////////////////////////////
// createElementFromHTML
////////////////////////////////

/* global trustedTypes */
const contentPolicy = trustedTypes.createPolicy('myAppPolicy', {
	createHTML: (string) => {
		return string;
	}
});

function createElementFromHTML(htmlString) {
	const template = document.createElement('template');
	template.innerHTML = contentPolicy.createHTML(htmlString.trim());
	return template.content.firstElementChild;
}

{% endunless %}