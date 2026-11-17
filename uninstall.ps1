$ErrorActionPreference = 'Stop'
$radioConfig = (& spicetify -c | Select-Object -Last 1).Trim()
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $radioConfig -PathType Leaf)) {
 throw 'Configurazione Spicetify non trovata.'
}
$radioRoot = Split-Path $radioConfig
$radioApp = [IO.Path]::GetFullPath((Join-Path $radioRoot 'CustomApps\radio-italiane'))
$radioParent = [IO.Path]::GetFullPath((Join-Path $radioRoot 'CustomApps'))
if ((Split-Path $radioApp) -ne $radioParent) { throw 'Percorso app non valido.' }
$radioServer = Join-Path $radioApp 'bridge\server.cjs'
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
 Where-Object { $_.CommandLine -and $_.CommandLine.Contains($radioServer) } |
 ForEach-Object { & taskkill.exe /PID $_.ProcessId /T /F }
spicetify config custom_apps radio-italiane-
if ($LASTEXITCODE -ne 0) { throw 'Rimozione app dalla configurazione fallita.' }
spicetify config extensions radio-italiane-installed.js-
if ($LASTEXITCODE -ne 0) { throw 'Rimozione estensione dalla configurazione fallita.' }
$radioStartup = Join-Path ([Environment]::GetFolderPath('Startup')) 'Radio Italiane.vbs'
Remove-Item -LiteralPath $radioStartup -Force -ErrorAction SilentlyContinue
$radioMarker = Join-Path $radioRoot 'Extensions\radio-italiane-installed.js'
Remove-Item -LiteralPath $radioMarker -Force -ErrorAction SilentlyContinue
if (Test-Path -LiteralPath $radioApp) { Remove-Item -LiteralPath $radioApp -Recurse -Force }
spicetify apply
if ($LASTEXITCODE -ne 0) { throw 'Applicazione Spicetify fallita.' }
Write-Host 'Radio on Spotify removed. Close Spotify completely and reopen it.'
