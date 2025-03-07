# Solução para Problemas de Acesso ao Localhost no WSL2

## Problema

Quando executamos containers Docker no WSL2, às vezes enfrentamos problemas para acessar os serviços usando `localhost` a partir do host Windows. Isso ocorre devido a limitações na forma como o WSL2 expõe os serviços para o host Windows.

## Solução

Para resolver esse problema, criamos dois scripts:

1. `update-wsl-hosts.ps1`: Este script obtém o endereço IP do WSL2 e adiciona uma entrada no arquivo hosts do Windows para que você possa acessar os serviços usando o nome `wsl` em vez do endereço IP.

2. `start-project.ps1`: Este script inicia o WSL2, inicia os containers e atualiza o arquivo hosts.

## Como usar

1. Execute o script `start-project.ps1` como administrador:
   ```
   powershell -File start-project.ps1
   ```

2. Acesse os serviços usando os seguintes URLs:
   - Frontend: http://wsl:3000
   - Backend: http://wsl:5000
   - API Health: http://wsl:5000/api/health

## Observações

- O script `update-wsl-hosts.ps1` precisa ser executado como administrador para poder modificar o arquivo hosts.
- O endereço IP do WSL2 pode mudar quando você reinicia o WSL2, então é recomendável executar o script `update-wsl-hosts.ps1` sempre que reiniciar o WSL2.
- Se você estiver enfrentando problemas para acessar os serviços, tente acessá-los usando o endereço IP diretamente. Você pode obter o endereço IP do WSL2 executando o seguinte comando:
  ```
  wsl -- ip -4 addr show eth0
  ```

## Solução Alternativa

Se os scripts não funcionarem para você, você pode tentar acessar os serviços usando o endereço IP do WSL2 diretamente:

1. Obtenha o endereço IP do WSL2:
   ```
   wsl -- ip -4 addr show eth0
   ```

2. Acesse os serviços usando o endereço IP:
   - Frontend: http://<IP-DO-WSL2>:3000
   - Backend: http://<IP-DO-WSL2>:5000
   - API Health: http://<IP-DO-WSL2>:5000/api/health 