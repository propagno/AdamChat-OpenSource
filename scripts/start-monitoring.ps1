# Script para iniciar a stack de monitoramento Grafana + Loki + Promtail

# Verifica se o Docker está em execução
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker não está em execução. Por favor, inicie o Docker Desktop primeiro." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Docker não está em execução. Por favor, inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "=== Configurando a Stack de Monitoramento AdamChat ===" -ForegroundColor Cyan

# Cria diretórios de logs se não existirem
Write-Host "Criando diretórios de logs..." -ForegroundColor Yellow
New-Item -Path "frontend/logs" -ItemType Directory -Force | Out-Null
New-Item -Path "backend/logs" -ItemType Directory -Force | Out-Null

# Cria diretórios de provisionamento do Grafana se não existirem
Write-Host "Criando diretórios de provisionamento do Grafana..." -ForegroundColor Yellow
New-Item -Path "grafana/provisioning/datasources" -ItemType Directory -Force | Out-Null
New-Item -Path "grafana/provisioning/dashboards" -ItemType Directory -Force | Out-Null

# Inicia os serviços de monitoramento
Write-Host "Iniciando serviços de monitoramento..." -ForegroundColor Green
docker-compose -f docker-compose-monitoring.yml up -d

# Aguarda um momento para os serviços iniciarem
Start-Sleep -Seconds 5

# Verifica se os serviços estão em execução
$services = @("loki", "promtail", "grafana")
foreach ($service in $services) {
    $status = docker ps --filter "name=$service" --format "{{.Status}}"
    if ($status -match "Up") {
        Write-Host "$service está em execução." -ForegroundColor Green
    } else {
        Write-Host "$service não está em execução. Verifique os logs com 'docker logs $service'." -ForegroundColor Red
    }
}

Write-Host "`n=== Informações de Acesso ===" -ForegroundColor Cyan
Write-Host "Grafana: http://localhost:3001" -ForegroundColor White
Write-Host "Usuário: admin" -ForegroundColor White
Write-Host "Senha: admin" -ForegroundColor White
Write-Host "`nLoki API: http://localhost:3100" -ForegroundColor White

Write-Host "`n=== Integrando com Aplicação ===" -ForegroundColor Cyan
Write-Host "1. Frontend: Importe e use o logger em frontend/src/utils/logger.js"
Write-Host "2. Backend: Use o decorator @log_request nos endpoints Flask e importe logger de backend/app/utils/logger.py"

Write-Host "`n=== Stack de Monitoramento Iniciada! ===" -ForegroundColor Green 