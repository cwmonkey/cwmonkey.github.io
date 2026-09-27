REM del /f /q /s _site/*.* > NUL
REM rmdir /q /s _site
bundle exec jekyll serve --watch --config _config.yml,_config.local.yml --port 4001