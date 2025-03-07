FROM tykio/tyk-gateway:latest

# Copia a configuração, as APIs e os templates para a imagem
COPY tyk.conf /opt/tyk-gateway/tyk.conf
COPY apis /opt/tyk-gateway/apis
COPY templates /opt/tyk-gateway/templates

# Copia especificamente o arquivo de erro para o diretório raiz, onde o glob "error*" pode encontrá-lo
COPY templates/error.html /opt/tyk-gateway/error.html

# Define o diretório de trabalho
WORKDIR /opt/tyk-gateway

# Expõe a porta do Tyk Gateway
EXPOSE 8081

# Comando para iniciar o Tyk Gateway
CMD ["tyk", "--conf=/opt/tyk-gateway/tyk.conf"]
