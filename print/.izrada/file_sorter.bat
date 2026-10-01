@echo off
setlocal EnableDelayedExpansion

set "SOURCE=C:\Users\Marin\Desktop\garan_git\garan-naljepnice\print\.izrada\garan-asus"

echo.
echo Processing and renaming colour PNG files...
echo.

for /r "%SOURCE%" %%F in (*_colour.png) do (
    set "FILENAME=%%~nF"
    set "EXT=%%~xF"
    
    rem Remove _colour from the end of the base filename
    set "NEWNAME=!FILENAME:_colour=!"
    
    echo Renaming:
    echo   %%~nxF
    echo   to !NEWNAME!!EXT!
    echo.

    ren "%%F" "!NEWNAME!!EXT!"
)

echo.
echo ==========================================
echo Done! All matching files renamed in place.
echo ==========================================
pause