# Run Reza Pro against local Backend.
# Emulator (default): http://10.0.2.2:5000/api
# Physical device: pass LAN IP
#   .\scripts\run_dev.ps1 -LanIp 192.168.1.42

param(
  [string]$LanIp = "",
  [string]$Device = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($LanIp) {
  $apiBase = "http://${LanIp}:5000/api"
} else {
  $apiBase = "http://10.0.2.2:5000/api"
}

Write-Host "API_BASE=$apiBase"
$args = @("run", "--dart-define=API_BASE=$apiBase")
if ($Device) { $args += @("-d", $Device) }
flutter @args
