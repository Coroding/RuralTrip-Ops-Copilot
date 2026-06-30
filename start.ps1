$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Commercial Planning One-Click Start ===" -ForegroundColor Green
Write-Host ""

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  Write-Host "npm was not found. Please install Node.js first." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path ".\node_modules")) {
  Write-Host "First run: installing dependencies..." -ForegroundColor Yellow
  npm.cmd install
}

if (-not $env:DEEPSEEK_API_KEY) {
  Write-Host ""
  Write-Host "Enter your DeepSeek API key. It is used only in this window and will not be saved." -ForegroundColor Yellow
  $secureKey = Read-Host "DeepSeek API Key" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  try {
    $env:DEEPSEEK_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

if (-not $env:PORT) {
  $env:PORT = "8787"
}

Write-Host ""
Write-Host "Building standalone page..." -ForegroundColor Cyan
npm.cmd run build:standalone

$url = "http://127.0.0.1:$($env:PORT)/"
Write-Host ""
Write-Host "Starting server: $url" -ForegroundColor Green
Write-Host "Waiting for server to become ready..." -ForegroundColor DarkGray
Write-Host ""

$server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
      $ready = $true
      break
    }
  }
  catch {
  }
}

if ($ready) {
  Write-Host "Server is ready. Opening browser..." -ForegroundColor Green
  Start-Process $url
}
else {
  Write-Host "Server did not become ready. Please check the messages above." -ForegroundColor Red
}

Write-Host ""
Write-Host "Press Enter to stop the server." -ForegroundColor Yellow
Read-Host

if ($server -and -not $server.HasExited) {
  Stop-Process -Id $server.Id -Force
}
