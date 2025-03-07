# Testes de Autenticação da Aplicação AdamChat

Este diretório contém scripts para testar o sistema de autenticação da aplicação AdamChat. Os testes verificam o fluxo completo de autenticação, desde a criação de usuário até a proteção de rotas autenticadas.

## Requisitos Prévios

Antes de executar os testes, certifique-se de que:

1. A aplicação está em execução:
   - Frontend em `http://localhost:3000`
   - Backend em `http://localhost:5000`
2. O MongoDB está acessível (normalmente em `mongodb://localhost:27017`)

## Tipos de Testes Disponíveis

### 1. Teste de UI com Cypress

O arquivo `frontend/cypress-auth-test.js` contém testes end-to-end usando Cypress que verificam o fluxo de autenticação através da interface do usuário.

Para executar:

```bash
# Instale o Cypress (se não estiver instalado)
cd frontend
npm install cypress --save-dev

# Execute o teste
npx cypress open
# No Cypress GUI, selecione "E2E Testing" e execute cypress-auth-test.js
```

### 2. Teste de UI com Puppeteer

O arquivo `frontend/puppeteer-auth-test.js` contém testes similares usando Puppeteer para automação de navegador.

Para executar:

```bash
# Instale o Puppeteer (se não estiver instalado)
cd frontend
npm install puppeteer --save-dev

# Execute o teste
node puppeteer-auth-test.js
```

### 3. Teste Direto da API

O arquivo `backend/auth-api-test.js` testa diretamente as APIs de autenticação sem interação com o frontend.

Para executar:

```bash
# Instale o axios (se não estiver instalado)
cd backend
npm install axios --save-dev

# Execute o teste
node auth-api-test.js
```

## O que os Testes Verificam

Cada script de teste realiza as seguintes verificações:

1. **Acesso à Aplicação**: Verifica se a aplicação está acessível em localhost:3000
2. **Criação de Usuário**: Testa o registro de um novo usuário
3. **Login de Usuário**: Testa o login com o usuário recém-criado
4. **Verificação de Token**: Confirma se tokens e sessão são criados após o login
5. **Proteção de Rota**: Verifica se o dashboard só é acessível quando autenticado
6. **Redirecionamento**: Confirma se usuários não autenticados são redirecionados para a página de login

## Solução de Problemas

Se os testes falharem, verifique:

1. Se a aplicação está em execução (frontend e backend)
2. Se o MongoDB está acessível
3. Se as credenciais de teste estão corretas
4. Os logs do console para mensagens de erro específicas

## Personalização dos Testes

Você pode ajustar os dados de teste modificando o objeto `testUser` em cada script:

```javascript
const testUser = {
  name: 'Usuário Teste',
  email: `teste${Date.now()}@example.com`,
  password: 'Senha@123',
};
```

O timestamp no email garante que cada execução de teste crie um usuário único, evitando conflitos. 