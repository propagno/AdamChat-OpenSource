# backend/app/routes/dashboard_routes.py

from flask import Blueprint, jsonify
from app.auth_middleware import token_required  # Importe o middleware

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard():
    return jsonify({'message': 'Bem-vindo ao Dashboard!'})
