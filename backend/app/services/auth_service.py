import requests
from decouple import config

AUTH_SERVICE_URL = config('AUTH_SERVICE_URL', default='http://authelia:9091')

def validate_user(username, password):
    try:
        response = requests.post(f"{AUTH_SERVICE_URL}/validate", json={
            "username": username,
            "password": password
        })
        if response.status_code == 200:
            return True
    except Exception as e:
        print(f"Erro na validação: {e}")
    return False
