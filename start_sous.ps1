$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Iniciando Sous Chef desde $ScriptDir..." -ForegroundColor Green

# 1. Iniciar Backend en nueva ventana
Write-Host "Levantando Backend (API)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# 2. Iniciar Frontend en nueva ventana
Write-Host "Levantando Frontend (Web)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# 3. Esperar a que arranquen
Write-Host "Esperando 5 sgeundos para que los servicios arranquen..."
Start-Sleep -Seconds 5

# 4. Abrir navegador
Write-Host "Abriendo Sous en tu navegador..."
Start-Process "http://localhost:5173"

Write-Host "¡Todo listo! Revisa las otras ventanas si hay errores." -ForegroundColor Cyan
