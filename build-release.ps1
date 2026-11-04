$ErrorActionPreference = 'Stop'
$dist = Join-Path $PSScriptRoot 'dist'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$rootFiles = 'index.js','style.css','manifest.json','README.md','cover.js','catalog.js','bridge-config.js','sidebar.js','radio-italiane-installed.js'
$bridgeFiles = 'server.cjs','config.cjs','world.cjs','resolver.cjs','relay.cjs','metadata.cjs','config.json','stations.json','descriptions.it.json'
foreach ($platform in @('Windows','Linux')) {
 $releaseName = 'Radio-Italiane-' + $platform + '-v3'
 $workspace = Join-Path $dist ('stage-' + [guid]::NewGuid().ToString('N'))
 $stage = Join-Path $workspace $releaseName
 New-Item -ItemType Directory -Force -Path $stage,(Join-Path $stage 'assets'),(Join-Path $stage 'bridge'),(Join-Path $stage 'bridge\vendor') | Out-Null
 try {
  foreach ($file in $rootFiles) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $stage $file) }
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'assets\cover.png') -Destination (Join-Path $stage 'assets\cover.png')
  foreach ($file in $bridgeFiles) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('bridge\' + $file)) -Destination (Join-Path $stage ('bridge\' + $file)) }
  Copy-Item -Path (Join-Path $PSScriptRoot 'bridge\vendor\*') -Destination (Join-Path $stage 'bridge\vendor')
  if ($platform -eq 'Windows') {
   Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'install.ps1') -Destination $stage
   Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'bridge\stop-service.ps1') -Destination (Join-Path $stage 'bridge')
   New-Item -ItemType Directory -Path (Join-Path $stage 'bridge\bin') | Out-Null
   foreach ($file in @('node.exe','ffmpeg.exe','ca-bundle.pem')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('bridge\bin\' + $file)) -Destination (Join-Path $stage 'bridge\bin') }
   foreach ($file in @('NODE-LICENSE.txt','FFMPEG-LICENSE.txt')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('bridge\' + $file)) -Destination (Join-Path $stage 'bridge') }
  } else {
   foreach ($file in @('install.sh','bridge/start-service.sh')) {
    $source = [IO.File]::ReadAllText((Join-Path $PSScriptRoot $file)).Replace("`r`n","`n")
    [IO.File]::WriteAllText((Join-Path $stage $file),$source,[Text.UTF8Encoding]::new($false))
   }
  }
  $archive = Join-Path $dist ($releaseName + '.zip')
  Compress-Archive -LiteralPath $stage -DestinationPath $archive -CompressionLevel Optimal -Force
  Write-Host $archive
 } finally {
  $resolvedWorkspace = [IO.Path]::GetFullPath($workspace)
  $resolvedDist = [IO.Path]::GetFullPath($dist).TrimEnd('\') + '\'
  if (!$resolvedWorkspace.StartsWith($resolvedDist,[StringComparison]::OrdinalIgnoreCase)) { throw 'Staging path outside dist' }
  Remove-Item -LiteralPath $resolvedWorkspace -Recurse -Force
 }
}
