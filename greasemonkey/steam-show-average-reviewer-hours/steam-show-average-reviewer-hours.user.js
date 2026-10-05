---
---
{% include greasemonkey/steam-show-average-reviewer-hours/meta.js %}

console.log('---=== Steam - Show Average Reviewer Hours ===---');

async function getAvg(id, force) {
  let avg;

  if (!force) {
    avg = await GM.getValue(`avg:${id}`);
    const updated = avg?.updated || 0;

    if (Date.now() - updated > 1000 * 60 * 60 * 24 * 7) {
      avg = null;
    }
  }

  if (!avg) {
    const reviewUrl = `https://store.steampowered.com/ajaxappreviews/${id}?filter=summary&date_range_type=all&day_range=30&start_date=-1&end_date=-1&cursor=*&filter_offtopic_activity=1&playtime_filter_max=0&playtime_filter_min=0&playtime_type=all&purchase_type=all&review_type=all&hardware_os=all&hardware_cpu=all&hardware_gpu=all&hardware_device_type=all&use_review_quality=1&language=english&summary_num_positive_reviews=35792&summary_num_reviews=59563&origin=https%3A%2F%2Fstore.steampowered.com`;

    try {
      const response = await fetch(reviewUrl);

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();

      let avgHours = 0;
      let reviewCount = 0;
      let avgTopHours = 0;
      let reviewTopCount = 0;
      let avgRecentHours = 0;
      let reviewRecentCount = 0;

      // recentreviews?

      result.reviews.forEach((review) => {
        avgHours += review.author.playtime_forever;
        reviewCount++;
        avgTopHours += review.author.playtime_forever;
        reviewTopCount++;
      });

      result.recentreviews.forEach((review) => {
        avgHours += review.author.playtime_forever;
        reviewCount++;
        avgRecentHours += review.author.playtime_forever;
        reviewRecentCount++;
      });

      if (!avgHours) return;

      avgHours = Math.round(avgHours / 60 / reviewCount);
      avgTopHours = Math.round(avgTopHours / 60 / reviewTopCount);
      avgRecentHours = Math.round(avgRecentHours / 60 / reviewRecentCount);

      avg = {
        avgHours: avgHours,
        reviewCount: reviewCount,
        avgTopHours: avgTopHours,
        reviewTopCount: reviewTopCount,
        avgRecentHours: avgRecentHours,
        reviewRecentCount: reviewRecentCount,
        updated: Date.now()
      };

      GM.setValue(`avg:${id}`, avg);
    } catch (error) {
      return;
    }
  }

  return avg;
}

async function doAppPage() {
  addStyle(/* css */`
    .glance_ctn_responsive_left:not(.__cwmAvgHoursDone):before {
      content: "Avg Review Hours: --";
      display: block;
      text-transform: uppercase;
      font-size: 11px;
      padding-right: 10px;
      padding-top: 9px;
      padding-bottom: 13px;
      color: var(--summary-title-text-color);
    }
  `);

  observeForElement('.glance_ctn_responsive_left:not(.__cwmAvgHoursDone)', async (glance_ctn_responsive_left) => {
    glance_ctn_responsive_left.classList.add('__cwmAvgHoursDone')
    const id = window.location.href.split('/')[4];

    const avgHoursEl = createElementFromHTML(/* html */`
      <div id="avgHours" class="release_date">
        <div class="user_reviews_summary_row">
          <div class="subtitle">Avg Review Hours:</div>
          <div class="summary">--</div>
        </div>
      </div>
    `);

    glance_ctn_responsive_left.prepend(avgHoursEl);

    const avg = await getAvg(id, true);

    avgHoursEl.querySelector('.summary').textContent = `${avg.avgHours.toLocaleString()} (${avg.reviewCount})`;
  });
}

async function doHomePage() {
  addStyle(/* css */`
    .__cwmAvgHours {
      text-shadow: 1px 1px #000;
      padding: .5em .75em;
      position: absolute;
      z-index: 10000;
      background: rgba(0, 0, 0, .75);
    }
  `);

  observeForElement('a.capsule_image_ctn:not(.__cwmAvgHoursDone), a[data-ds-appid]:not(.__cwmAvgHoursDone), .hero_click_overlay:not(.__cwmAvgHoursDone)', async (el) => {
    el.classList.add('__cwmAvgHoursDone')
    const id = el.href.split('/')[4];
    const avg = await getAvg(id);
    el.prepend(createElementFromHTML(/* html */`
      <span class="__cwmAvgHours">Average Review Hours: ${avg.avgHours.toLocaleString()} (${avg.reviewCount})</span>
    `));
  })
}

async function doSearchPage() {
  // Same as homepage for now
  doHomePage();
}

////////////////////////////////
// init
////////////////////////////////

async function init() {
  await waitForElement('body');

  if (document.body.classList.contains('app')) {
    doAppPage();
  } else if (document.body.classList.contains('search_page')) {
    doSearchPage();
  } else {
    doHomePage();
  }
}

init();

////////////////////////////////
//// Tools
////////////////////////////////

{% include greasemonkey/_shared/waitForElement.js %}

{% include greasemonkey/_shared/createElementFromHTML.js %}

{% include greasemonkey/_shared/observeForElement.js %}

{% include greasemonkey/_shared/addStyle.js %}
