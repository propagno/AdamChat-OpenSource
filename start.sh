#!/bin/bash

# Script para iniciar a aplicação AdamChat com Docker Compose

echo "🚀 Iniciando a aplicação AdamChat..."

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker antes de continuar."
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar."
    exit 1
fi

# Verificar se o Docker está rodando
if ! docker info &> /dev/null; then
    echo "❌ O serviço Docker não está em execução. Inicie o Docker e tente novamente."
    exit 1
fi

# Criar diretório keycloak se não existir
if [ ! -d "keycloak" ]; then
    echo "📁 Criando diretório keycloak..."
    mkdir -p keycloak
fi

# Verificar se o arquivo realm-export.json existe
if [ ! -f "keycloak/realm-export.json" ]; then
    echo "⚠️ Arquivo keycloak/realm-export.json não encontrado."
    echo "📝 Certifique-se de que este arquivo existe antes de continuar."
    exit 1
fi

# Verificar arquivos .env do frontend e backend
if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.example" ]; then
    echo "📝 Criando arquivo .env do frontend a partir do .env.example..."
    cp frontend/.env.example frontend/.env
    echo "✅ Arquivo .env do frontend criado com sucesso!"
fi

if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
    echo "📝 Criando arquivo .env do backend a partir do .env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Arquivo .env do backend criado com sucesso!"
fi

# Parar containers existentes se estiverem rodando
echo "🛑 Parando containers existentes se estiverem rodando..."
docker-compose down

# Iniciar os serviços com Docker Compose
echo "🐳 Iniciando serviços com Docker Compose..."
docker-compose up -d

# Verificar se a inicialização foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "✅ Serviços iniciados com sucesso!"
    
    # Aguardar que os serviços estejam prontos
    echo "⏳ Aguardando que os serviços inicializem completamente..."
    sleep 10
    
    # Verificar status dos serviços principais
    echo -e "\n📊 Status dos serviços principais:"
    
    # Verificar MongoDB
    if docker ps | grep -q mongodb; then
        echo "✅ MongoDB: em execução"
    else
        echo "❌ MongoDB: não está rodando"
    fi
    
    # Verificar Keycloak
    if docker ps | grep -q keycloak; then
        echo "✅ Keycloak: em execução"
    else
        echo "❌ Keycloak: não está rodando"
    fi
    
    # Verificar Backend
    if docker ps | grep -q backend; then
        echo "✅ Backend: em execução"
    else
        echo "❌ Backend: não está rodando"
    fi
    
    # Verificar Frontend
    if docker ps | grep -q frontend; then
        echo "✅ Frontend: em execução"
    else
        echo "❌ Frontend: não está rodando"
    fi
    
    echo -e "\n📌 A aplicação está disponível em:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5000/api"
    echo "   - Keycloak: http://localhost:8180/auth"
    echo "   - MongoDB: mongodb://localhost:27017"
    echo "   - Grafana: http://localhost:3001 (usuário: admin, senha: admin)"
    echo -e "\n⚠️ Primeira inicialização: Aguarde alguns minutos para que todos os serviços estejam totalmente disponíveis."
    echo -e "\n📌 Comandos úteis:"
    echo "   - Para visualizar os logs: docker-compose logs -f"
    echo "   - Para visualizar os logs de um serviço específico: docker-compose logs -f [serviço]"
    echo "   - Para parar a aplicação: docker-compose down"
    echo "   - Para parar a aplicação e remover volumes: docker-compose down -v (⚠️ CUIDADO: isso apagará os dados)"
else
    echo "❌ Erro ao iniciar serviços."
    echo "📊 Verificando logs para identificar problemas..."
    docker-compose logs
    exit 1
fi 