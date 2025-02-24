FROM node:16-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
RUN chmod -R 755 node_modules/.bin
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
