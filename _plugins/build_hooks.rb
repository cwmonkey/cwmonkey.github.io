require "fileutils"

Jekyll::Hooks.register :site, :post_write do |site|
  files = {
    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/discord-snippets/discord-snippets.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/f5fd88c0-d7ed-4943-9b73-464ed26c5064.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/fix-ugly-links/fix-ugly-links.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/33f388b0-dd9e-4683-92cc-dd8dd73adaa2.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/invert-colors/invert-colors.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/fe67d747-cd4e-42c8-bb7c-4292907b8a7d.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/outline-links/outline-links.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/c77becbc-1e54-47a0-b2b4-e15066105750.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/sa-thread-quick-mode/sa-thread-quick-mode.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/0e39df1a-a131-4108-9d7b-0e2b02f0be56.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/steam-show-average-reviewer-hours/steam-show-average-reviewer-hours.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/b6065f71-1f7a-4731-90ba-48c3113979b2.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/remove-right-click-blocker-and-popups/remove-right-click-blocker-and-popups.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/e9426b70-ec3e-4687-9470-10b0e9a5512f.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/text-editor/text-editor.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/12c8626b-ce4b-4ce3-b09f-13b3292b80ec.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/timers/timers.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/207a282d-dde6-41f3-90c0-b74ac827b627.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/video-skip-time/video-skip-time.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/de79f065-5670-4754-870c-21082a49826e.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/yt-video-dark-mode/yt-video-dark-mode.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/5df73b9c-682a-40b9-98eb-cdef87343126.user.js"
  }

  files.each do |source, destination|
    FileUtils.cp(source, destination)
  end
end
