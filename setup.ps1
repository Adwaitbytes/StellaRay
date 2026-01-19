# Stellar zkLogin Gateway - Setup Script for Windows
# Run this in PowerShell from the stellar-gateway directory

Write-Host "🚀 Setting up Stellar zkLogin Gateway" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

# Check Node.js
Write-Host "`n📦 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm/pnpm
try {
    $pnpmVersion = pnpm --version 2>$null
    Write-Host "  ✅ pnpm: $pnpmVersion" -ForegroundColor Green
    $pm = "pnpm"
} catch {
    Write-Host "  ⚠️  pnpm not found, using npm" -ForegroundColor Yellow
    $pm = "npm"
}

# Create .env if not exists
Write-Host "`n⚙️  Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path "$rootDir\.env")) {
    Copy-Item "$rootDir\.env.example" "$rootDir\.env"
    Write-Host "  ✅ Created .env from .env.example" -ForegroundColor Green
    Write-Host "  ⚠️  Edit .env to add your Google OAuth credentials!" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ .env already exists" -ForegroundColor Green
}

# Install SDK dependencies
Write-Host "`n📦 Installing SDK dependencies..." -ForegroundColor Yellow
Push-Location "$rootDir\sdk"
& $pm install
if ($LASTEXITCODE -ne 0) { throw "SDK install failed" }
Write-Host "  ✅ SDK dependencies installed" -ForegroundColor Green
Pop-Location

# Install Demo dependencies
Write-Host "`n📦 Installing Demo dependencies..." -ForegroundColor Yellow
Push-Location "$rootDir\demo"
& $pm install
if ($LASTEXITCODE -ne 0) { throw "Demo install failed" }
Write-Host "  ✅ Demo dependencies installed" -ForegroundColor Green
Pop-Location

# Install Circuit dependencies (optional)
Write-Host "`n📦 Installing Circuit dependencies..." -ForegroundColor Yellow
Push-Location "$rootDir\circuits"
npm install 2>$null
Write-Host "  ✅ Circuit dependencies installed" -ForegroundColor Green
Pop-Location

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit .env and add your GOOGLE_CLIENT_ID" -ForegroundColor White
Write-Host "  2. Run: cd demo && $pm dev" -ForegroundColor White
Write-Host "  3. Open http://localhost:3000" -ForegroundColor White
Write-Host ""
