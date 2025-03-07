from sqlalchemy.sql import func
from app.extensions import db
from datetime import datetime


class StorageItem(db.Model):
    """
    Modelo para armazenar informações sobre arquivos físicos

    Cada StorageItem representa um arquivo carregado no sistema,
    armazenando metadados e o caminho para o arquivo real,
    seja em armazenamento local ou no S3.
    """
    __tablename__ = 'storage_items'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    # Caminho no S3 ou local
    storage_path = db.Column(db.String(1024), nullable=False)
    # URL para acesso público
    public_url = db.Column(db.String(1024), nullable=True)
    # 'image', 'video', etc
    content_type = db.Column(db.String(50), nullable=False)
    # Tamanho em bytes
    size_bytes = db.Column(db.BigInteger, nullable=False)
    # Metadados adicionais
    file_metadata = db.Column(db.JSON, nullable=True)

    # Campos de status
    # Arquivos temporários podem ser limpos automaticamente
    is_temporary = db.Column(db.Boolean, default=False)
    # Data de expiração para arquivos temporários
    expires_at = db.Column(db.DateTime, nullable=True)
    # Exclusão lógica
    deleted = db.Column(db.Boolean, default=False)
    # Data da exclusão lógica
    deleted_at = db.Column(db.DateTime, nullable=True)

    # Referência ao usuário proprietário
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship(
        'User', backref=db.backref('storage_items', lazy=True))

    # Campos de auditoria
    created_at = db.Column(db.DateTime, nullable=False,
                           default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def __init__(self, filename, storage_path, content_type, size_bytes, user_id,
                 public_url=None, file_metadata=None, is_temporary=False, expires_at=None):
        self.filename = filename
        self.storage_path = storage_path
        self.public_url = public_url
        self.content_type = content_type
        self.size_bytes = size_bytes
        self.file_metadata = file_metadata
        self.is_temporary = is_temporary
        self.expires_at = expires_at
        self.user_id = user_id

    def __repr__(self):
        return f'<StorageItem {self.id}: {self.filename} ({self.content_type})>'

    def to_dict(self):
        """Converte o objeto para um dicionário"""
        return {
            'id': self.id,
            'filename': self.filename,
            'public_url': self.public_url,
            'content_type': self.content_type,
            'size_bytes': self.size_bytes,
            'file_metadata': self.file_metadata,
            'is_temporary': self.is_temporary,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
