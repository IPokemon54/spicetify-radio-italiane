$ErrorActionPreference = 'Stop'
$releaseUrl = 'https://github.com/IPokemon54/spicetify-radio-italiane/releases/latest/download/Radio-Italiane-Windows-v3.zip'
$workDir = Join-Path ([IO.Path]::GetTempPath()) ('radio-on-spotify-' + [guid]::NewGuid().ToString('N'))
$archive = Join-Path $workDir 'radio-on-spotify.zip'

try {
 New-Item -ItemType Directory -Force -Path $workDir | Out-Null
 Write-Host 'Download di Radio on Spotify...'
 Invoke-WebRequest -UseBasicParsing -Uri $releaseUrl -OutFile $archive
 Expand-Archive -LiteralPath $archive -DestinationPath $workDir -Force
 $installer = Get-ChildItem -LiteralPath $workDir -Filter 'install.ps1' -Recurse | Select-Object -First 1
 if (-not $installer) { throw 'Installer non trovato nella release.' }
 Get-ChildItem -LiteralPath $installer.Directory.FullName -File -Recurse | Unblock-File -ErrorAction SilentlyContinue
 & $installer.FullName
 if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'Installazione non completata.' }
} finally {
 if (Test-Path -LiteralPath $workDir) { Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue }
}
