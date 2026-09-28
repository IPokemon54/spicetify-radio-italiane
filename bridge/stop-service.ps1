$ErrorActionPreference = 'Stop'
$radioPidPath = Join-Path $PSScriptRoot 'service.pid'
if (Test-Path -LiteralPath $radioPidPath) {
 $radioServiceId = [int](Get-Content -LiteralPath $radioPidPath)
 $radioProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$radioServiceId"
 $radioExpected = Join-Path $PSScriptRoot 'server.cjs'
 if ($radioProcess -and $radioProcess.CommandLine.Contains($radioExpected)) {
  & taskkill.exe /PID $radioServiceId /T /F
 }
}
