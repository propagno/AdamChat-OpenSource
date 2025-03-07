from app.extensions import db
from datetime import datetime


class Video(db.Model):
    """
    Modelo para armazenar informações sobre vídeos gerados

    Cada vídeo está associado a um usuário e armazena detalhes sobre
    o prompt usado para geração, informações de estilo, duração e status.
    """
    __tablename__ = 'videos'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # Descrição do vídeo a ser gerado
    prompt = db.Column(db.Text, nullable=False)
    # Estilo do vídeo (cinematic, cartoon, etc.)
    style = db.Column(db.String(50), nullable=True)
    duration = db.Column(db.String(10), nullable=False,
                         default='10sec')  # Duração do vídeo

    # Detalhes de processamento
    # pending, processing, completed, failed, expired
    status = db.Column(db.String(20), nullable=False, default='pending')
    # ID na API externa (Stability AI)
    external_id = db.Column(db.String(100), nullable=True)
    # Mensagem de erro em caso de falha
    error_message = db.Column(db.Text, nullable=True)

    # Informações do vídeo gerado
    # URL do vídeo na API externa
    url = db.Column(db.String(1024), nullable=True)
    thumbnail_url = db.Column(
        db.String(1024), nullable=True)  # URL da thumbnail
    storage_id = db.Column(db.Integer, db.ForeignKey(
        'storage_items.id'), nullable=True)  # ID no sistema de armazenamento local

    # Metadados e auditoria
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    # Quando o vídeo foi concluído
    completed_at = db.Column(db.DateTime, nullable=True)
    # Quantos tokens foram consumidos
    tokens_consumed = db.Column(db.Integer, nullable=True)

    # Relacionamentos
    user = db.relationship('User', backref=db.backref('videos', lazy=True))
    storage = db.relationship('StorageItem', backref=db.backref(
        'video', uselist=False), lazy=True)

    def __init__(self, user_id, prompt, duration='10sec', style=None):
        self.user_id = user_id
        self.prompt = prompt
        self.duration = duration
        self.style = style
        self.status = 'pending'

    def __repr__(self):
        return f'<Video {self.id}: {self.prompt[:30]}... ({self.status})>'

    def to_dict(self):
        """Converte o objeto para um dicionário"""
        return {
            'id': self.id,
            'prompt': self.prompt,
            'style': self.style,
            'duration': self.duration,
            'status': self.status,
            'url': self.url,
            'thumbnail_url': self.thumbnail_url,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'tokens_consumed': self.tokens_consumed
        }
