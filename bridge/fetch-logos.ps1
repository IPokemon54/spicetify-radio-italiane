$ErrorActionPreference = 'Stop'
$catalogSource = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\catalog.js')
$json = $catalogSource -replace '^\s*const RI_CATALOG\s*=\s*', '' -replace ';\s*$', ''
$stations = $json | ConvertFrom-Json
$logos = [ordered]@{}

foreach ($station in $stations) {
    try {
        $html = (Invoke-WebRequest -UseBasicParsing -Uri $station.page -TimeoutSec 20).Content
        $match = [regex]::Match($html, 'https://static\.mytuner\.mobi/media/tvos_radios/[^"''<> ]+\.(?:png|jpe?g|webp)')
        if ($match.Success) {
            $logos[$station.id] = $match.Value.Replace('&amp;', '&')
        }
    } catch {
        Write-Warning "Logo non trovato per $($station.name): $($_.Exception.Message)"
    }
}

$payload = $logos | ConvertTo-Json -Depth 3
$output = "const RI_LOGOS = $payload;`r`n"
Set-Content -LiteralPath (Join-Path $PSScriptRoot '..\logos.js') -Value $output -Encoding utf8
Write-Output "Loghi trovati: $($logos.Count)/$($stations.Count)"
