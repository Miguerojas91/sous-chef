$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Iniciando Sous Chef desde $ScriptDir..." -ForegroundColor Green

# 1. Iniciar Proxy (IA) en nueva ventana
Write-Host "Levantando Proxy de IA (puerto 3001)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd proxy; npm run dev"

# 2. Iniciar Frontend en nueva ventana
Write-Host "Levantando Frontend (Web)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# 3. Esperar a que arranquen
Write-Host "Esperando 5 segundos para que los servicios arranquen..."
Start-Sleep -Seconds 5

# 4. Abrir navegador
Write-Host "Abriendo Sous en tu navegador..."
$url = if (Test-Path "frontend\cert.pem") { "https://localhost:5175" } else { "http://localhost:5175" }
Start-Process $url

Write-Host "¡Todo listo! Revisa las otras ventanas si hay errores." -ForegroundColor Cyan
Write-Host "  → Proxy IA: http://localhost:3001/health" -ForegroundColor Yellow
Write-Host "  → Frontend: $url" -ForegroundColor Yellow
