{% unless included_GM_getValuesMatching %}{% assign included_GM_getValuesMatching = true %}

////////////////////////////////
// GM_getValuesMatching
////////////////////////////////

async function GM_getValuesMatching(regex) {
  const values = await GM.listValues();

  const fetchPromises = values.map(async (key) => {
    if (!key.match(regex)) return;
    const data = await GM.getValue(key);
    return [key, data];
  });

  return await Promise.all(fetchPromises);
}

{% endunless %}