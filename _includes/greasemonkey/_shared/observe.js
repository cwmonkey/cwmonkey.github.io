{% unless included_observe %}{% assign included_observe = true %}

////////////////////////////////
// observe
////////////////////////////////

function observe(targetNode, config, callback) {
	// Select the node that will be observed for mutations
	if (typeof targetNode === 'string') targetNode = document.querySelector(targetNode);

	const observer = new MutationObserver(callback);
	observer.observe(targetNode, config);

	return observer;
}

{% endunless %}