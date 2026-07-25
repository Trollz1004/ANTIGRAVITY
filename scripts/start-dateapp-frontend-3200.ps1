$ErrorActionPreference = 'Stop'
cd E:\ANTIGRAVITY\frontend\react-app
$env:NODE_ENV = 'production'
$env:PORT = '3200'
node.exe E:\ANTIGRAVITY\frontend\react-app\node_modules\tsx\dist\cli.mjs server.ts
