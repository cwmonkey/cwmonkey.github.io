require "fileutils"

Jekyll::Hooks.register :site, :post_write do |site|
  files = {
    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/fix-ugly-links/fix-ugly-links.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/33f388b0-dd9e-4683-92cc-dd8dd73adaa2.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/invert-colors/invert-colors.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/fe67d747-cd4e-42c8-bb7c-4292907b8a7d.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/outline-links/outline-links.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/c77becbc-1e54-47a0-b2b4-e15066105750.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/remove-right-click-blocker-and-popups/remove-right-click-blocker-and-popups.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/e9426b70-ec3e-4687-9470-10b0e9a5512f.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/video-skip-time/video-skip-time.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/de79f065-5670-4754-870c-21082a49826e.user.js",

    "E:/wamp64/www/cwmonkey.github.io/_site/greasemonkey/yt-video-dark-mode/yt-video-dark-mode.user.js" =>
      "F:/Tools/tamperdav/dav/Tampermonkey/sync/5df73b9c-682a-40b9-98eb-cdef87343126.user.js"
  }

  files.each do |source, destination|
    FileUtils.cp(source, destination)
  end
end
