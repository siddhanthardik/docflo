@echo off
title Gyrex Clinic Desktop App Installer
color 0A
cls
echo ========================================================
echo          GYREX CLINIC DESKTOP APP INSTALLER            
echo ========================================================
echo.
echo Installing Gyrex Clinic App on your Desktop and Start Menu...
echo.

set SCRIPT="%TEMP%\CreateGyrexShortcut.vbs"
set DESKTOP=%USERPROFILE%\Desktop
set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs

:: Detect Browser Executable
set BROWSER=msedge.exe
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

:: Generate VBS Script to create Shortcuts
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%DESKTOP%\Gyrex Clinic.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = %BROWSER% >> %SCRIPT%
echo oLink.Arguments = "--app=https://gyrex.in/dashboard" >> %SCRIPT%
echo oLink.Description = "Gyrex Clinic Management System" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

echo sLinkFileStart = "%STARTMENU%\Gyrex Clinic.lnk" >> %SCRIPT%
echo Set oLinkStart = oWS.CreateShortcut(sLinkFileStart) >> %SCRIPT%
echo oLinkStart.TargetPath = %BROWSER% >> %SCRIPT%
echo oLinkStart.Arguments = "--app=https://gyrex.in/dashboard" >> %SCRIPT%
echo oLinkStart.Description = "Gyrex Clinic Management System" >> %SCRIPT%
echo oLinkStart.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo ========================================================
echo   SUCCESS! Gyrex Clinic App has been installed.       
echo ========================================================
echo.
echo Launching Gyrex Clinic now...
start "" %BROWSER% --app=https://gyrex.in/dashboard
timeout /t 3 >nul
exit
