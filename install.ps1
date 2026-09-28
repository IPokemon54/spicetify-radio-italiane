$ErrorActionPreference = 'Stop'
if (-not $PSScriptRoot -or -not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'manifest.json'))) {
 $releaseUrl = 'https://github.com/IPokemon54/spicetify-radio-italiane/releases/latest/download/Radio-Italiane-Windows-v3.zip'
 $downloadDir = Join-Path ([IO.Path]::GetTempPath()) ('radio-on-spotify-' + [guid]::NewGuid().ToString('N'))
 $downloadArchive = Join-Path $downloadDir 'radio-on-spotify.zip'
 try {
  New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null
  Write-Host 'Download di Radio on Spotify...'
  Invoke-WebRequest -UseBasicParsing -Uri $releaseUrl -OutFile $downloadArchive
  Expand-Archive -LiteralPath $downloadArchive -DestinationPath $downloadDir -Force
  $downloadedInstaller = Get-ChildItem -LiteralPath $downloadDir -Filter 'install.ps1' -Recurse | Select-Object -First 1
  if (-not $downloadedInstaller) { throw 'Installer non trovato nella release.' }
  Get-ChildItem -LiteralPath $downloadedInstaller.Directory.FullName -File -Recurse | Unblock-File -ErrorAction SilentlyContinue
  & $downloadedInstaller.FullName
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'Installazione non completata.' }
 } finally {
  if (Test-Path -LiteralPath $downloadDir) { Remove-Item -LiteralPath $downloadDir -Recurse -Force -ErrorAction SilentlyContinue }
 }
 return
}
$radioConfig = (& spicetify -c | Select-Object -Last 1).Trim()
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $radioConfig)) { throw 'Configurazione Spicetify non trovata.' }
$radioTarget = Join-Path (Split-Path $radioConfig) 'CustomApps\radio-italiane'
$oldPidFile = Join-Path $radioTarget 'bridge\service.pid'
if (Test-Path -LiteralPath $oldPidFile) {
 $oldPid = [int](Get-Content -LiteralPath $oldPidFile -Raw)
 Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
 Start-Sleep -Milliseconds 500
}
New-Item -ItemType Directory -Force -Path $radioTarget | Out-Null
if ([IO.Path]::GetFullPath($PSScriptRoot) -ne [IO.Path]::GetFullPath($radioTarget)) {
 Get-ChildItem -LiteralPath $PSScriptRoot | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $radioTarget -Recurse -Force }
}
$radioBridge = Join-Path $radioTarget 'bridge'
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start()
$radioPort = ([Net.IPEndPoint]$listener.LocalEndpoint).Port
$listener.Stop()
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
$keyBytes = New-Object byte[] 32
$random.GetBytes($keyBytes)
$random.Dispose()
$radioKey = -join ($keyBytes | ForEach-Object { $_.ToString('x2') })
$bridgeConfig = @{ port = $radioPort; key = $radioKey } | ConvertTo-Json -Compress
Set-Content -LiteralPath (Join-Path $radioBridge 'config.json') -Value $bridgeConfig -Encoding UTF8
$clientConfig = 'const RI_BRIDGE = {"base":"http://127.0.0.1:' + $radioPort + '","key":"' + $radioKey + '"};'
Set-Content -LiteralPath (Join-Path $radioTarget 'bridge-config.js') -Value $clientConfig -Encoding UTF8
$radioNode = Join-Path $radioBridge 'bin\node.exe'
$radioServer = Join-Path $radioBridge 'server.cjs'
$radioLaunch = Join-Path $radioBridge 'launch.vbs'
$radioVbs = 'CreateObject("WScript.Shell").Run """' + $radioNode + '"" ""' + $radioServer + '""", 0, False'
Set-Content -LiteralPath $radioLaunch -Value $radioVbs -Encoding Unicode
$radioStartup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Radio Italiane.vbs'
Copy-Item -LiteralPath $radioLaunch -Destination $radioStartup -Force
Start-Process -FilePath $radioNode -ArgumentList ('"' + $radioServer + '"') -WorkingDirectory $radioBridge -WindowStyle Hidden
& spicetify config custom_apps radio-italiane
if ($LASTEXITCODE -ne 0) { throw 'Configurazione Spicetify fallita.' }
& spicetify apply
if ($LASTEXITCODE -ne 0) { throw 'Applicazione Spicetify fallita.' }
Write-Host 'Radio Italiane installata. Servizio locale avviato e abilitato al login.'
