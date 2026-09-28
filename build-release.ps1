$ErrorActionPreference = 'Stop'
$releaseName = 'Radio-Italiane-Windows-v3'
$dist = Join-Path $PSScriptRoot 'dist'
$stage = Join-Path $dist $releaseName
$archive = Join-Path $dist ($releaseName + '.zip')
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
New-Item -ItemType Directory -Force -Path $stage, (Join-Path $stage 'assets'), (Join-Path $stage 'bridge'), (Join-Path $stage 'bridge\bin'), (Join-Path $stage 'bridge\vendor') | Out-Null
$rootFiles = 'index.js','style.css','manifest.json','README.md','install.ps1','cover.js','catalog.js','bridge-config.js','sidebar.js','radio-italiane-installed.js'
foreach ($file in $rootFiles) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $stage $file) }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'assets\cover.png') -Destination (Join-Path $stage 'assets\cover.png')
$bridgeFiles = 'server.cjs','world.cjs','resolver.cjs','relay.cjs','metadata.cjs','config.json','stations.json','descriptions.it.json','stop-service.ps1','NODE-LICENSE.txt','FFMPEG-LICENSE.txt'
foreach ($file in $bridgeFiles) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('bridge\' + $file)) -Destination (Join-Path $stage ('bridge\' + $file)) }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'bridge\bin\node.exe') -Destination (Join-Path $stage 'bridge\bin\node.exe')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'bridge\bin\ffmpeg.exe') -Destination (Join-Path $stage 'bridge\bin\ffmpeg.exe')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'bridge\bin\ca-bundle.pem') -Destination (Join-Path $stage 'bridge\bin\ca-bundle.pem')
Copy-Item -Path (Join-Path $PSScriptRoot 'bridge\vendor\*') -Destination (Join-Path $stage 'bridge\vendor')
Compress-Archive -LiteralPath $stage -DestinationPath $archive -CompressionLevel Optimal
Remove-Item -LiteralPath $stage -Recurse -Force
Write-Host $archive
