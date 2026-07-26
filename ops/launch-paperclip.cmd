@ECHO off
SETLOCAL
SET NODE=C:\Program Files\nodejs\node.exe
SET PKG=C:\Users\joshl\AppData\Roaming\npm\node_modules\paperclipai\dist\index.js
SET CFG=E:\clean\.paperclip-laptop\instances\default\config.json
"%NODE%" "%PKG%" run --config "%CFG%"
ENDLOCAL
