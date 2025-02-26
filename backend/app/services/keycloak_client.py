# backend/app/services/keycloak_client.py

from authlib.integrations.flask_client import OAuth


def init_keycloak(app):
    oauth = OAuth(app)
    keycloak = oauth.register(
        name='keycloak',
        client_id='adamchat-frontend',
        client_secret='L7PfkeTGR5AuehmmKrcUQnS1rrMKZZ3o',
        # Corrija o nome do realm para "AdamChat"
        server_metadata_url='http://localhost:8080/realms/AdamChat/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
    return keycloak
