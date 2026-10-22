@echo off
title SheetFlow Pro Server
echo Starting SheetFlow Pro...
start "" "http://localhost:4321"
python -m http.server 4321
pause
