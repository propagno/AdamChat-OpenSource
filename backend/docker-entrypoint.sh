#!/bin/bash
set -e

echo "Iniciando AdamChat Backend..."

# Criar arquivo de compatibilidade para db.py se não existir
if [ ! -f "/app/app/db.py" ] || [ ! -s "/app/app/db.py" ]; then
    echo "Criando arquivo de compatibilidade app/db.py..."
    cat > /app/app/db.py << EOF
# Compatibilidade para importações legadas
from app.config.database import get_db
EOF
    echo "Arquivo db.py criado com sucesso."
fi

# Verificar arquivos importantes
echo "Verificando configuração do banco de dados..."
if [ -f "/app/app/config/database.py" ]; then
    echo "✅ Arquivo database.py encontrado."
else
    echo "❌ ERRO: Arquivo database.py não encontrado!"
    exit 1
fi

echo "Verificando middleware de autenticação..."
if [ -f "/app/app/auth_middleware.py" ]; then
    echo "✅ Arquivo auth_middleware.py encontrado."
else
    echo "❌ ERRO: Arquivo auth_middleware.py não encontrado!"
    exit 1
fi

echo "Configuração concluída. Iniciando a aplicação..."

# Executa o comando passado para o script
exec "$@" 