Write-Host "Iniciando ambiente de desenvolvimento com hot reload..." -ForegroundColor Green

# Verificar se o Docker está em execução
try {
    $null = docker info
} catch {
    Write-Host "⚠️ O Docker não está em execução, por favor inicie o Docker e tente novamente." -ForegroundColor Red
    exit 1
}

# Parar containers anteriores se estiverem em execução
Write-Host "Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Construir e iniciar os containers
Write-Host "Construindo e iniciando os containers de desenvolvimento..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml up --build

# Este comando só será executado quando os containers forem parados
Write-Host "Containers de desenvolvimento finalizados." -ForegroundColor Yellow 