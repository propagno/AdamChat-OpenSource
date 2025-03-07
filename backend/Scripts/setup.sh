#!/bin/bash

# Script para configurar o ambiente de desenvolvimento do backend

echo "🚀 Configurando o ambiente de desenvolvimento do backend..."

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale o Python 3 antes de continuar."
    exit 1
fi

# Verificar versão do Python
PYTHON_VERSION=$(python3 -c 'import sys; print(sys.version_info[0])')
if [ "$PYTHON_VERSION" -lt 3 ]; then
    echo "❌ Este script requer Python 3. A versão detectada é Python $PYTHON_VERSION."
    exit 1
fi

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "🔨 Criando ambiente virtual..."
    python3 -m venv venv
    echo "✅ Ambiente virtual criado com sucesso!"
else
    echo "📝 Ambiente virtual já existe."
fi

# Ativar ambiente virtual
echo "🔌 Ativando ambiente virtual..."
source venv/bin/activate || source venv/Scripts/activate

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env a partir do .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado com sucesso!"
    echo "⚠️ Lembre-se de editar o arquivo .env com suas configurações específicas."
else
    echo "📝 Arquivo .env já existe."
fi

# Instalar dependências
echo "📦 Instalando dependências do projeto..."
pip install -r requirements.txt

# Verificar se a instalação foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro ao instalar dependências."
    exit 1
fi

echo "🎉 Configuração do backend concluída com sucesso!"
echo "Para iniciar o servidor de desenvolvimento, execute: flask run" 