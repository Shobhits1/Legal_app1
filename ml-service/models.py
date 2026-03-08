"""Database Models for NyayaMitra Authentication"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(150), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    organization = db.Column(db.String(200), nullable=True)
    role = db.Column(db.String(50), default='user')
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    profile_picture = db.Column(db.String(500), nullable=True)
    oauth_provider = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_premium = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    documents_classified = db.Column(db.Integer, default=0)
    fir_generated = db.Column(db.Integer, default=0)
    refresh_tokens = db.relationship('RefreshToken', backref='user', lazy=True, cascade='all, delete-orphan')
    activity_logs = db.relationship('ActivityLog', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def increment_usage(self, action_type):
        if action_type == 'classify':
            self.documents_classified += 1
        elif action_type == 'fir':
            self.fir_generated += 1
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id, 'email': self.email, 'username': self.username,
            'full_name': self.full_name, 'phone': self.phone, 'organization': self.organization,
            'role': self.role, 'profile_picture': self.profile_picture,
            'is_active': self.is_active, 'is_verified': self.is_verified, 'is_premium': self.is_premium,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'documents_classified': self.documents_classified, 'fir_generated': self.fir_generated,
            'oauth_provider': self.oauth_provider
        }

class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    device_info = db.Column(db.String(200), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_revoked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<RefreshToken {self.token[:20]}...>'
    
    @staticmethod
    def create_token(user_id, expires_delta=None, device_info=None, ip_address=None, user_agent=None):
        if expires_delta is None:
            expires_delta = timedelta(days=7)
        token = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + expires_delta
        refresh_token = RefreshToken(token=token, user_id=user_id, device_info=device_info,
                                     ip_address=ip_address, user_agent=user_agent, expires_at=expires_at)
        db.session.add(refresh_token)
        db.session.commit()
        return token
    
    def is_valid(self):
        return not self.is_revoked and self.expires_at > datetime.utcnow()
    
    def revoke(self):
        self.is_revoked = True
        db.session.commit()
    
    @staticmethod
    def cleanup_expired():
        expired = RefreshToken.query.filter(RefreshToken.expires_at < datetime.utcnow()).all()
        for token in expired:
            db.session.delete(token)
        db.session.commit()

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    action_description = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    endpoint = db.Column(db.String(200), nullable=True)
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f'<ActivityLog {self.action_type} by User {self.user_id}>'
    
    @staticmethod
    def log_activity(user_id, action_type, action_description=None, ip_address=None, 
                     user_agent=None, endpoint=None, success=True, error_message=None):
        log = ActivityLog(user_id=user_id, action_type=action_type, action_description=action_description,
                         ip_address=ip_address, user_agent=user_agent, endpoint=endpoint,
                         success=success, error_message=error_message)
        db.session.add(log)
        db.session.commit()
        return log

class BlacklistedToken(db.Model):
    __tablename__ = 'blacklisted_tokens'
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120), unique=True, nullable=False, index=True)
    token_type = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BlacklistedToken {self.jti}>'
    
    @staticmethod
    def is_blacklisted(jti):
        return BlacklistedToken.query.filter_by(jti=jti).first() is not None
    
    @staticmethod
    def add_to_blacklist(jti, token_type, expires_at, user_id=None):
        blacklisted = BlacklistedToken(jti=jti, token_type=token_type, expires_at=expires_at, user_id=user_id)
        db.session.add(blacklisted)
        db.session.commit()
    
    @staticmethod
    def cleanup_expired():
        expired = BlacklistedToken.query.filter(BlacklistedToken.expires_at < datetime.utcnow()).all()
        for token in expired:
            db.session.delete(token)
        db.session.commit()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        print("Database tables created!")
