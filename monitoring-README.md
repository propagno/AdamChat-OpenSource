# Sistema de Monitoramento AdamChat

Este diretório contém a configuração para monitoramento da aplicação AdamChat usando Grafana, Loki e Promtail. Esta stack de observabilidade permite identificar erros e monitorar a latência dos serviços frontend e backend.

## Arquitetura

A arquitetura de monitoramento consiste em:

1. **Promtail**: Coletor de logs que captura logs do frontend e backend e os envia para o Loki
2. **Loki**: Armazenamento e indexação de logs, otimizado para operação em containers
3. **Grafana**: Interface visual para visualização de logs e métricas

## Instalação e Inicialização

### Requisitos
- Docker e Docker Compose
- Acesso à internet para baixar as imagens Docker

### Iniciar o sistema

#### No Windows
```powershell
.\scripts\start-monitoring.ps1
```

#### No Linux/Mac
```bash
chmod +x scripts/start-monitoring.sh
./scripts/start-monitoring.sh
```

## Acesso ao Grafana

Após iniciar a stack de monitoramento, acesse o Grafana em:

- URL: http://localhost:3000
- Usuário: admin
- Senha: admin

Na primeira vez que você fizer login, será solicitado que você altere a senha padrão.

## Dashboards Disponíveis

O sistema vem pré-configurado com um dashboard "AdamChat Monitoring" que exibe:

1. **Visão Geral**:
   - Contagem de erros por serviço
   - Latência média por serviço

2. **Frontend**:
   - Latência por rota
   - Lista de erros recentes

3. **Backend**:
   - Latência por rota
   - Lista de erros recentes

## Integrando Logs da Aplicação

### Frontend

1. Importe o módulo logger:

```javascript
import logger from '../utils/logger';

// Registrar erros
logger.error('Erro ao carregar dados', { route: '/dashboard', userId: '12345' });

// Registrar avisos
logger.warn('Aviso: Taxa de requisição alta');

// Registrar informações
logger.info('Usuário logado com sucesso', { userId: '12345' });

// Rastrear requisições HTTP (ideal para uso com interceptores Axios/Fetch)
const startTime = Date.now();
// ... fazer requisição ...
logger.httpRequest('/api/data', 'GET', 200, startTime, { userContext: 'dashboard' });
```

### Backend

1. Use o decorator de log em endpoints da API:

```python
from app.utils.logger import log_request, info, error

@app.route('/api/data')
@log_request  # Esse decorator registra automaticamente a requisição com tempo de execução
def get_data():
    # Seu código aqui
    info("Dados recuperados com sucesso", user_id="12345", records_count=100)
    return jsonify({"status": "success"})

@app.route('/api/process')
@log_request
def process_data():
    try:
        # Processamento
        result = some_processing()
        info("Processamento concluído", process_id="abc123")
        return jsonify({"result": result})
    except Exception as e:
        # O logger já registrará o erro da requisição, mas podemos adicionar detalhes
        error("Falha no processamento", process_id="abc123", error_details=str(e))
        return jsonify({"error": str(e)}), 500
```

## Explorando Logs no Grafana

1. Navegue até "Explore" no menu lateral do Grafana
2. Selecione a fonte de dados "Loki"
3. Use as expressões LogQL para consultar logs, por exemplo:
   - `{job="frontend", level="error"}`
   - `{job="backend"} |= "timeout"`
   - `{job="frontend"} | json | latency > 1000`

## Troubleshooting

Se você enfrentar problemas:

1. Verifique os logs dos serviços:
   ```
   docker logs loki
   docker logs promtail
   docker logs grafana
   ```

2. Assegure-se de que os diretórios de logs existem e têm permissões adequadas:
   ```
   frontend/logs
   backend/logs
   ```

3. Para reiniciar a stack:
   ```
   docker-compose -f docker-compose-monitoring.yml restart
   ```

4. Para redefinir a stack (isso apagará dados existentes):
   ```
   docker-compose -f docker-compose-monitoring.yml down -v
   ```

## Referências

- [Documentação do Grafana](https://grafana.com/docs/grafana/latest/)
- [Documentação do Loki](https://grafana.com/docs/loki/latest/)
- [Documentação do Promtail](https://grafana.com/docs/loki/latest/clients/promtail/)
- [Consultas LogQL](https://grafana.com/docs/loki/latest/logql/) 