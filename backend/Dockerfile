FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .

# Install numpy explicitly first
RUN pip install numpy==1.23.5
# Then install the rest of the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Instalar explicitamente o apispec para garantir sua disponibilidade
RUN pip install apispec==6.0.2

RUN pip install gunicorn
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY . .

# Tornar o script de entrada executável
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5000

# Usar o script de entrada
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--reload", "run:app"]
