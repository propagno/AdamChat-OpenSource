# Ambiente de Desenvolvimento com Hot Reload

Este ambiente de desenvolvimento foi configurado para permitir o hot reload tanto no frontend (React) quanto no backend (Flask), facilitando o desenvolvimento sem a necessidade de reconstruir os containers a cada alteração.

## Requisitos

- Docker
- Docker Compose
- PowerShell (Windows) ou Bash (Linux/Mac)

## Como iniciar o ambiente de desenvolvimento

### No Windows:

```powershell
.\dev-start.ps1
```

### No Linux/Mac:

```bash
chmod +x dev-start.sh
./dev-start.sh
```

## Funcionalidades

### Frontend (React)

- **Hot Reload Automático**: Todas as alterações nos arquivos do React serão automaticamente recarregadas no navegador.
- **Volume Mapeado**: O diretório `./frontend` está mapeado para `/app` no container, permitindo edições em tempo real.
- **Preservação de node_modules**: O diretório `node_modules` é mantido apenas dentro do container para evitar conflitos com o sistema host.

### Backend (Flask)

- **Hot Reload Automático**: O Gunicorn está configurado com a flag `--reload`, que detecta alterações nos arquivos Python e reinicia automaticamente o servidor.
- **Volume Mapeado**: O diretório `./backend` está mapeado para `/app` no container, permitindo edições em tempo real.
- **Modo Debug**: O Flask está em modo de desenvolvimento com debug ativado.

## Acessando as aplicações

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB**: mongodb://localhost:27017
- **RabbitMQ Admin**: http://localhost:15672 (usuário: guest, senha: guest)
- **Redis**: redis://localhost:6379

## Estrutura do ambiente

```
docker-compose.dev.yml      # Configuração do ambiente de desenvolvimento
frontend/Dockerfile.dev     # Dockerfile específico para desenvolvimento do frontend
dev-start.ps1               # Script para iniciar o ambiente no Windows
dev-start.sh                # Script para iniciar o ambiente no Linux/Mac
```

## Notas importantes

1. **Primeira execução**: A primeira execução pode demorar mais, pois é necessário baixar as imagens e instalar as dependências.
2. **Node Modules**: As dependências do Node são instaladas dentro do container, não no sistema host.
3. **Logs**: Os logs de todos os serviços aparecerão no console, facilitando o debug.
4. **Parando o ambiente**: Pressione `Ctrl+C` no terminal onde os containers estão rodando para parar todos os serviços.

## Troubleshooting

### O hot reload não está funcionando

- **Frontend**: Verifique se a variável `CHOKIDAR_USEPOLLING` está definida como `true` no container do frontend.
- **Backend**: Verifique se o Gunicorn está sendo executado com a flag `--reload`.

### Erro de permissão ao acessar os arquivos

- No Linux/Mac, pode ser necessário ajustar as permissões dos diretórios:
  ```bash
  sudo chown -R $USER:$USER ./frontend ./backend
  ``` 