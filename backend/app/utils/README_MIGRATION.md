# Migração da API de Chat Legacy para a Nova API

Este guia fornece instruções para migrar da API de Chat Legacy (endpoint `/api/chat`) para a nova API de Conversas RESTful.

## Visão Geral da Migração

A API Legacy foi removida e substituída por uma API RESTful mais completa que oferece:

- Gerenciamento de conversas (CRUD completo)
- Gerenciamento de mensagens dentro das conversas  
- Configurações de usuário personalizáveis
- Suporte a uploads de arquivos e imagens
- Streaming de respostas com Server-Sent Events (SSE)
- Paginação para listagens
- Melhor tratamento de erros e validação de dados

## Executando o Script de Migração

Para migrar os dados existentes para o novo formato:

1. **Faça backup do MongoDB**:
   ```
   mongodump --uri="mongodb://localhost:27017/adamchat" --out=backup_folder
   ```

2. **Execute o script de migração**:
   ```
   cd backend
   python -m app.utils.migrate_legacy_chats
   ```

3. **Verifique o log de migração**:
   ```
   cat migration.log
   ```

## Alterações na API para Clientes

### Antes (API Legacy)

```javascript
// Enviar mensagem
const response = await axios.post('/api/chat', {
  user_id: '123',
  message: 'Olá, como vai?',
  gptProvider: 'chatgpt',
  providerVersion: 'v4'
});

// Acessar histórico completo
const history = response.data.history;
```

### Agora (Nova API)

```javascript
// 1. Criar uma conversa (ou usar uma existente)
const conversationResponse = await axios.post('/api/conversations', {
  user_id: '123',
  title: 'Nova conversa'
});
const conversationId = conversationResponse.data.id;

// 2. Enviar mensagem
const messageResponse = await axios.post(`/api/conversations/${conversationId}/messages`, {
  user_id: '123',
  message: 'Olá, como vai?',
  gptProvider: 'chatgpt',
  providerVersion: 'v4'
});

// 3. Acessar a resposta específica
const userMessage = messageResponse.data.user_message;
const aiResponse = messageResponse.data.ai_response;

// 4. Obter histórico completo de mensagens (opcional)
const historyResponse = await axios.get(`/api/conversations/${conversationId}/messages`);
const allMessages = historyResponse.data.messages;
```

## Próximos Passos

1. Atualize todas as chamadas no cliente para usar a nova API
2. Implemente uma lógica para gerenciar conversas
3. Utilize os recursos avançados como upload de arquivos e streaming

## Suporte

Se encontrar problemas durante a migração, consulte a documentação completa em `/apidocs` ou entre em contato com a equipe de desenvolvimento. 