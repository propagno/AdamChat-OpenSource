FROM node:16-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
# Conceda permissão de execução para o react-scripts
RUN chmod +x node_modules/.bin/react-scripts
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
