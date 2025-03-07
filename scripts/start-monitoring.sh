#!/bin/bash

# Script para iniciar a stack de monitoramento Grafana + Loki + Promtail

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== Configurando a Stack de Monitoramento AdamChat ===${NC}"

# Verifica se o Docker está em execução
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker não está em execução. Por favor, inicie o Docker primeiro.${NC}"
    exit 1
fi

# Cria diretórios de logs se não existirem
echo -e "${YELLOW}Criando diretórios de logs...${NC}"
mkdir -p frontend/logs
mkdir -p backend/logs

# Cria diretórios de provisionamento do Grafana se não existirem
echo -e "${YELLOW}Criando diretórios de provisionamento do Grafana...${NC}"
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/provisioning/dashboards

# Inicia os serviços de monitoramento
echo -e "${GREEN}Iniciando serviços de monitoramento...${NC}"
docker-compose -f docker-compose-monitoring.yml up -d

# Aguarda um momento para os serviços iniciarem
sleep 5

# Verifica se os serviços estão em execução
for service in loki promtail grafana; do
    if docker ps --filter "name=$service" --format "{{.Status}}" | grep -q "Up"; then
        echo -e "${GREEN}$service está em execução.${NC}"
    else
        echo -e "${RED}$service não está em execução. Verifique os logs com 'docker logs $service'.${NC}"
    fi
done

echo -e "\n${CYAN}=== Informações de Acesso ===${NC}"
echo -e "Grafana: http://localhost:3001"
echo -e "Usuário: admin"
echo -e "Senha: admin"
echo -e "\nLoki API: http://localhost:3100"

echo -e "\n${CYAN}=== Integrando com Aplicação ===${NC}"
echo -e "1. Frontend: Importe e use o logger em frontend/src/utils/logger.js"
echo -e "2. Backend: Use o decorator @log_request nos endpoints Flask e importe logger de backend/app/utils/logger.py"

echo -e "\n${GREEN}=== Stack de Monitoramento Iniciada! ===${NC}" 