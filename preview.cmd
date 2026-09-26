@echo off
setlocal
cd /d "%~dp0"

set "PORT=8000"
if not "%~1"=="" set "PORT=%~1"

echo Local preview: http://127.0.0.1:%PORT%/
echo Keep this window open. Press Ctrl+C to stop the preview.
start "" "http://127.0.0.1:%PORT%/"
python -m http.server %PORT% --bind 127.0.0.1
