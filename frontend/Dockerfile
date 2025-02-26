# Dockerfile do frontend

# Use uma imagem base do Node
FROM node:18-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos necessários
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código-fonte
COPY . .

# Construa a aplicação React
RUN npm run build

# Exponha a porta do React
EXPOSE 3000

# Inicie a aplicação
CMD ["npm", "start"]
