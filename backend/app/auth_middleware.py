# backend/app/auth_middleware.py

from functools import wraps
from flask import request, jsonify
import requests
import jwt


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token ausente!'}), 401

        token = token.split(' ')[1]

        try:
            # Obtém a chave pública do Keycloak
            keycloak_public_key = requests.get(
                'http://localhost:8080/realms/adamchat/protocol/openid-connect/certs'
            ).json()['keys'][0]['x5c'][0]

            # Formata a chave pública corretamente
            public_key = f"-----BEGIN CERTIFICATE-----\n{keycloak_public_key}\n-----END CERTIFICATE-----"

            # Decodifica o token
            decoded_token = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience='adamchat-frontend'
            )

        except Exception as e:
            return jsonify({'message': 'Token inválido!', 'error': str(e)}), 401

        return f(*args, **kwargs)
    return decorated
