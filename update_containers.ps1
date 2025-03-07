#!/usr/bin/env pwsh
# Script para atualizar os contêineres com os arquivos modificados

# Função para mostrar mensagens coloridas
function Write-ColorMessage {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [string]$ForegroundColor = "White"
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
}

# Iniciar
Write-ColorMessage "=== Atualizando contêineres com arquivos modificados ===" -ForegroundColor Cyan

# Copiar arquivos do frontend
Write-ColorMessage "`n>> Copiando arquivos do Frontend..." -ForegroundColor Yellow
Write-ColorMessage "Copiando App.js..." -ForegroundColor Gray
docker cp frontend/src/App.js frontend-dev:/app/src/
if ($LASTEXITCODE -eq 0) { Write-ColorMessage "   ✓ App.js copiado com sucesso" -ForegroundColor Green }
else { Write-ColorMessage "   ✗ Erro ao copiar App.js" -ForegroundColor Red }

Write-ColorMessage "Copiando OAuthTestPage.js..." -ForegroundColor Gray
docker cp frontend/src/pages/OAuthTestPage.js frontend-dev:/app/src/pages/
if ($LASTEXITCODE -eq 0) { Write-ColorMessage "   ✓ OAuthTestPage.js copiado com sucesso" -ForegroundColor Green }
else { Write-ColorMessage "   ✗ Erro ao copiar OAuthTestPage.js" -ForegroundColor Red }

Write-ColorMessage "Copiando OAuthStandaloneCallback.js..." -ForegroundColor Gray
docker cp frontend/src/components/OAuthStandaloneCallback.js frontend-dev:/app/src/components/
if ($LASTEXITCODE -eq 0) { Write-ColorMessage "   ✓ OAuthStandaloneCallback.js copiado com sucesso" -ForegroundColor Green }
else { Write-ColorMessage "   ✗ Erro ao copiar OAuthStandaloneCallback.js" -ForegroundColor Red }

# Copiar arquivos do backend
Write-ColorMessage "`n>> Copiando arquivos do Backend..." -ForegroundColor Yellow
Write-ColorMessage "Copiando oauth_standalone.py..." -ForegroundColor Gray
docker cp backend/oauth_standalone.py backend-dev:/app/
if ($LASTEXITCODE -eq 0) { Write-ColorMessage "   ✓ oauth_standalone.py copiado com sucesso" -ForegroundColor Green }
else { Write-ColorMessage "   ✗ Erro ao copiar oauth_standalone.py" -ForegroundColor Red }

# Reiniciar contêineres
Write-ColorMessage "`n>> Reiniciando contêineres..." -ForegroundColor Yellow
docker restart frontend-dev backend-dev
if ($LASTEXITCODE -eq 0) { Write-ColorMessage "   ✓ Contêineres reiniciados com sucesso" -ForegroundColor Green }
else { Write-ColorMessage "   ✗ Erro ao reiniciar contêineres" -ForegroundColor Red }

# Instruções para o usuário
Write-ColorMessage "`n=== Próximos passos ===" -ForegroundColor Cyan
Write-ColorMessage "1. Execute a aplicação OAuth standalone com o comando:" -ForegroundColor White
Write-ColorMessage "   docker exec -it backend-dev python oauth_standalone.py" -ForegroundColor DarkYellow
Write-ColorMessage "2. Acesse a página de testes em:" -ForegroundColor White
Write-ColorMessage "   http://localhost:3000/oauth-test" -ForegroundColor DarkYellow
Write-ColorMessage "3. Certifique-se de configurar as variáveis de ambiente com as credenciais dos provedores OAuth:" -ForegroundColor White
Write-ColorMessage "   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET" -ForegroundColor DarkYellow
Write-ColorMessage "   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET" -ForegroundColor DarkYellow
Write-ColorMessage "   FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET" -ForegroundColor DarkYellow
Write-ColorMessage "`nBom teste!" -ForegroundColor Green 