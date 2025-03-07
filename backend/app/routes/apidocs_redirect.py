from flask import Blueprint, redirect

# Criar um blueprint para o redirecionamento
apidocs_bp = Blueprint('apidocs', __name__)


@apidocs_bp.route('/apidocs')
def redirect_to_apidocs():
    """
    Redireciona /apidocs para /api/docs
    """
    return redirect('/api/docs')
