# ═══════════════════════════════════════════
#   CredBusiness — Deploy Internet Banking (GloryBank)
#   Builds Next.js, uploads to VPS, restarts PM2
# ═══════════════════════════════════════════

$ErrorActionPreference = "Stop"
$VPS_HOST = "177.153.58.152"
$VPS_USER = "root"
$VPS_PORT = 22
$APP_DIR = "/var/www/credbusiness/GloryBank"
$LOCAL_DIR = Join-Path (Split-Path $PSScriptRoot -Parent) "GloryBank"

Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║  CredBusiness — Deploy Internet Banking       ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

# ── Step 1: Build locally ──
Write-Host "🔨 Step 1: Building Next.js app..."
Push-Location $LOCAL_DIR
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "  ✅ Build complete"
} finally {
    Pop-Location
}

# ── Step 2: Create directories on VPS ──
Write-Host ""
Write-Host "📁 Step 2: Preparing VPS directories..."
ssh -p $VPS_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "mkdir -p $APP_DIR/{.next,public,node_modules} /var/www/credbusiness/logs"
Write-Host "  ✅ Directories ready"

# ── Step 3: Upload essential files ──
Write-Host ""
Write-Host "📤 Step 3: Uploading files..."

# Upload package.json, next.config.ts, and other config files
$configFiles = @("package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs")
foreach ($f in $configFiles) {
    $localFile = Join-Path $LOCAL_DIR $f
    if (Test-Path $localFile) {
        Write-Host "  -> $f"
        scp -P $VPS_PORT -o StrictHostKeyChecking=no "$localFile" "${VPS_USER}@${VPS_HOST}:${APP_DIR}/${f}" 2>&1 | Out-Null
    }
}

# Upload .env for production (demo mode)
Write-Host "  -> .env.production"
$envContent = @"
DEMO_MODE=true
JWT_SECRET=$(openssl rand -hex 64 2>$null || [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString())
NEXT_PUBLIC_APP_URL=https://credbusinessconsultoria.com.br/banco
NODE_ENV=production
PORT=3002
"@
$envTmpFile = Join-Path $env:TEMP "glorybank-env"
$envContent | Out-File -FilePath $envTmpFile -Encoding utf8 -NoNewline
scp -P $VPS_PORT -o StrictHostKeyChecking=no "$envTmpFile" "${VPS_USER}@${VPS_HOST}:${APP_DIR}/.env" 2>&1 | Out-Null
Remove-Item $envTmpFile -ErrorAction SilentlyContinue

# Upload public directory
Write-Host "  -> public/"
$publicFiles = Get-ChildItem -Path (Join-Path $LOCAL_DIR "public") -File -Recurse
foreach ($f in $publicFiles) {
    $relativePath = $f.FullName.Substring((Join-Path $LOCAL_DIR "public").Length + 1).Replace("\", "/")
    $remoteDir = "$APP_DIR/public/$(Split-Path $relativePath -Parent)".Replace("\", "/").TrimEnd("/")
    ssh -p $VPS_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "mkdir -p '$remoteDir'" 2>&1 | Out-Null
    scp -P $VPS_PORT -o StrictHostKeyChecking=no "$($f.FullName)" "${VPS_USER}@${VPS_HOST}:${APP_DIR}/public/${relativePath}" 2>&1 | Out-Null
}

# Upload .next/standalone (the built app)
Write-Host "  -> .next/ (standalone build)..."
$standalonePath = Join-Path $LOCAL_DIR ".next\standalone"
if (Test-Path $standalonePath) {
    # Use tar to compress and upload
    Push-Location $LOCAL_DIR
    tar -czf "$env:TEMP\glorybank-build.tar.gz" .next
    Pop-Location
    scp -P $VPS_PORT -o StrictHostKeyChecking=no "$env:TEMP\glorybank-build.tar.gz" "${VPS_USER}@${VPS_HOST}:/tmp/glorybank-build.tar.gz" 2>&1 | Out-Null
    ssh -p $VPS_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "cd $APP_DIR && rm -rf .next && tar -xzf /tmp/glorybank-build.tar.gz && rm /tmp/glorybank-build.tar.gz"
    Remove-Item "$env:TEMP\glorybank-build.tar.gz" -ErrorAction SilentlyContinue
    Write-Host "  ✅ Build uploaded"
} else {
    Write-Host "  ⚠️  Standalone not found, uploading full .next..."
    Push-Location $LOCAL_DIR
    tar -czf "$env:TEMP\glorybank-build.tar.gz" .next
    Pop-Location
    scp -P $VPS_PORT -o StrictHostKeyChecking=no "$env:TEMP\glorybank-build.tar.gz" "${VPS_USER}@${VPS_HOST}:/tmp/glorybank-build.tar.gz" 2>&1 | Out-Null
    ssh -p $VPS_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "cd $APP_DIR && rm -rf .next && tar -xzf /tmp/glorybank-build.tar.gz && rm /tmp/glorybank-build.tar.gz"
    Remove-Item "$env:TEMP\glorybank-build.tar.gz" -ErrorAction SilentlyContinue
    Write-Host "  ✅ Build uploaded"
}

# ── Step 4: Install deps and restart ──
Write-Host ""
Write-Host "📦 Step 4: Installing dependencies and restarting..."
ssh -p $VPS_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "cd $APP_DIR && npm install --production 2>&1 && cd /var/www/credbusiness && pm2 delete credbusiness-banco 2>/dev/null; pm2 start ecosystem.config.js --only credbusiness-banco 2>&1 && pm2 save"

# ── Step 5: Verify ──
Write-Host ""
Write-Host "🔍 Step 5: Verifying..."
ssh -p $VPS_PORT -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" "pm2 status && echo '---' && sleep 3 && curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost:3002/banco"

Write-Host ""
Write-Host "✅ Internet Banking deployed!"
Write-Host "🌐 https://credbusinessconsultoria.com.br/banco"
