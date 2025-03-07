# frontend/Dockerfile

# Estágio de build
FROM node:18-alpine as build

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências com clean npm cache
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-optional

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar a build do estágio anterior
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 3000

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
