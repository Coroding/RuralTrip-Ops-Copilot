$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

$outDir = Join-Path (Get-Location) "exports\screenshots"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$browsers = @(
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
)

$browser = $browsers | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  throw "Cannot find Edge or Chrome. Please install Microsoft Edge or Google Chrome first."
}

Write-Host "Building app..." -ForegroundColor Cyan
npm.cmd run build:standalone

$env:PORT = "8797"
if (-not $env:DEEPSEEK_API_KEY) {
  $env:DEEPSEEK_API_KEY = "screenshot-export-placeholder"
}

$server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory (Get-Location) -WindowStyle Hidden -PassThru

try {
  $baseUrl = "http://127.0.0.1:$($env:PORT)/"
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        $ready = $true
        break
      }
    }
    catch {
    }
  }
  if (-not $ready) {
    throw "Local server did not become ready."
  }

  $screens = @(
    "guide",
    "upload",
    "overview",
    "analysis",
    "report",
    "publish",
    "manage",
    "progress",
    "services",
    "messages",
    "course"
  )

  foreach ($screen in $screens) {
    $file = Join-Path $outDir "$screen.png"
    $url = "${baseUrl}?screen=$screen"
    Write-Host "Exporting $screen.png" -ForegroundColor Green
    & $browser `
      --headless `
      --disable-gpu `
      --hide-scrollbars `
      --window-size=900,1400 `
      --screenshot="$file" `
      "$url" | Out-Null
  }

  Write-Host ""
  Write-Host "Screenshots exported to: $outDir" -ForegroundColor Green
}
finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}
