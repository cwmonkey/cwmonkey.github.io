del /f /q /s _site/*.* > NUL
rmdir /q /s _site
bundle exec jekyll serve --watch --config _config.yml,_config.local.yml
