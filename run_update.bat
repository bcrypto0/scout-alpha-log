@echo off
rem Publishes the delayed pre-listing log to github.com/bcrypto0/scout-alpha-log.
rem ASCII ONLY in this file - a non-ASCII character makes cmd spew
rem "'x' is not recognized" (learned the hard way on the watchdog bat).
rem Only events older than PUBLISH_DELAY_HOURS in update.mjs are ever pushed:
rem the live feed is the paid product, the history is the proof.
rem No-op when the delayed slice has not changed. Log: update.log
cd /d "C:\Users\b39cr\Projects\scout-alpha-log"
echo. >> update.log
echo ===== %DATE% %TIME% ===== >> update.log
"C:\Program Files\nodejs\node.exe" update.mjs >> update.log 2>&1
