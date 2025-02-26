# Use a imagem oficial do Python
FROM python:3.9

# Defina o diretório de trabalho
WORKDIR /app

# Copie o arquivo de dependências
COPY requirements.txt .

# Instale as dependências
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copie todo o código do backend para o container
COPY . .

# Exponha a porta da aplicação
EXPOSE 5000

# Comando para rodar o backend
CMD ["python", "run.py"]
