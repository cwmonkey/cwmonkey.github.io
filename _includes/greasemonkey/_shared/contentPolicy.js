{% unless included_contentPolicy %}{% assign included_contentPolicy = true %}


/* global trustedTypes */
const contentPolicy = trustedTypes.createPolicy('myAppPolicy', {
	createHTML: (string) => {
		return string;
	}
});

{% endunless %}