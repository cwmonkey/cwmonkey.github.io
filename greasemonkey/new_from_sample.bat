@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM Get the new Greasemonkey script name
REM ============================================================

set /p "greasemonkey_script_name=Enter greasemonkey script name: "

if "%greasemonkey_script_name%"=="" (
    echo.
    echo Error: Script name cannot be empty.
    exit /b 1
)

REM ============================================================
REM Get today's date in yyyy-MM-dd format
REM ============================================================

for /f %%D in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "today=%%D"

echo.
echo Script name: %greasemonkey_script_name%
echo Date:        %today%
echo.

REM ============================================================
REM Process each _sample-script directory
REM ============================================================

for %%S in (
    ".\_sample-script"
    "..\_includes\greasemonkey\_sample-script"
) do (
    set "source_dir=%%~S"
    set "parent_dir=%%~dpS"
    set "new_dir=!parent_dir!!greasemonkey_script_name!"

    echo ============================================================
    echo Processing: !source_dir!
    echo ============================================================

    REM ------------------------------------------------------------
    REM Make sure the source directory exists
    REM ------------------------------------------------------------

    if not exist "!source_dir!\" (
        echo ERROR: "!source_dir!" does not exist.
        exit /b 1
    )

    REM ------------------------------------------------------------
    REM Make sure the destination doesn't already exist
    REM ------------------------------------------------------------

    if exist "!new_dir!\" (
        echo ERROR: "!new_dir!" already exists.
        exit /b 1
    )

    REM ------------------------------------------------------------
    REM Copy _sample-script to the new directory name
    REM ------------------------------------------------------------

    echo Copying:
    echo   !source_dir!
    echo   to
    echo   !new_dir!
    echo.

    xcopy "!source_dir!" "!new_dir!" /E /I /H /Y >nul

    if errorlevel 1 (
        echo ERROR: Failed to copy "!source_dir!".
        exit /b 1
    )

    REM ------------------------------------------------------------
    REM Replace text inside all files
    REM ------------------------------------------------------------

    echo Updating file contents...

    powershell -NoProfile -Command ^
        "$name = '%greasemonkey_script_name%';" ^
        "$date = '%today%';" ^
        "$dir = '!new_dir!';" ^
        "Get-ChildItem -LiteralPath $dir -Recurse -File | ForEach-Object {" ^
        "    $content = Get-Content -LiteralPath $_.FullName -Raw;" ^
        "    $content = $content.Replace('_sample-script', $name);" ^
        "    $content = $content.Replace('1970-01-01', $date);" ^
        "    Set-Content -LiteralPath $_.FullName -Value $content -NoNewline" ^
        "}"

    REM ------------------------------------------------------------
    REM Rename files containing _sample-script
    REM ------------------------------------------------------------

    echo Renaming files...

    powershell -NoProfile -Command ^
        "$name = '%greasemonkey_script_name%';" ^
        "$dir = '!new_dir!';" ^
        "Get-ChildItem -LiteralPath $dir -Recurse -File |" ^
        "    Sort-Object FullName -Descending |" ^
        "    ForEach-Object {" ^
        "        if ($_.Name.Contains('_sample-script')) {" ^
        "            $newName = $_.Name.Replace('_sample-script', $name);" ^
        "            Rename-Item -LiteralPath $_.FullName -NewName $newName;" ^
        "        }" ^
        "    }"

    echo.
    echo Completed: !new_dir!
    echo.
)

echo ============================================================
echo All done!
echo ============================================================
echo.
echo Created:
echo   .\%greasemonkey_script_name%
echo   ..\_includes\%greasemonkey_script_name%
echo.

endlocal
