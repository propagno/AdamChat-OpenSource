# Dockerfile no diretório backend
FROM python:3.9-slim

WORKDIR /app

# Copia o requirements.txt e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante da aplicação
COPY . .

CMD ["flask", "run", "--host=0.0.0.0"]
