"""Authentication Blueprint for NyayaMitra"""
from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt
)
from models import db, User, RefreshToken, ActivityLog, BlacklistedToken
from authlib.integrations.flask_client import OAuth
from datetime import datetime, timedelta
from email_validator import validate_email, EmailNotValidError
import os

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize OAuth
oauth = OAuth()

def init_oauth(app):
    oauth.init_app(app)
    google = oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        server_metadata_url=os.getenv('GOOGLE_DISCOVERY_URL'),
        client_kwargs={'scope': 'openid email profile'}
    )
    return google

# Helper Functions
def get_client_info():
    return {
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'device_info': request.headers.get('User-Agent', '')[:200]
    }

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        
        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        try:
            valid = validate_email(email)
            email = valid.email
        except EmailNotValidError as e:
            return jsonify({'error': str(e)}), 400
        
        # Check if user exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(email=email, full_name=full_name)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Log activity
        client_info = get_client_info()
        ActivityLog.log_activity(
            user_id=user.id, action_type='register',
            action_description='User registration',
            **client_info
        )
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token_str = RefreshToken.create_token(user.id, **client_info)
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token_str
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Update last login
        user.update_last_login()
        
        # Log activity
        client_info = get_client_info()
        ActivityLog.log_activity(
            user_id=user.id, action_type='login',
            action_description='User login',
            **client_info
        )
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token_str = RefreshToken.create_token(user.id, **client_info)
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token_str
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        jti = get_jwt()['jti']
        user_id = get_jwt_identity()
        expires = get_jwt()['exp']
        expires_at = datetime.fromtimestamp(expires)
        
        # Blacklist the token
        BlacklistedToken.add_to_blacklist(jti, 'access', expires_at, user_id)
        
        # Log activity
        client_info = get_client_info()
        ActivityLog.log_activity(
            user_id=user_id, action_type='logout',
            action_description='User logout',
            **client_info
        )
        
        return jsonify({'message': 'Successfully logged out'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    try:
        data = request.get_json()
        refresh_token_str = data.get('refresh_token')
        
        if not refresh_token_str:
            return jsonify({'error': 'Refresh token required'}), 400
        
        # Verify refresh token
        refresh_token = RefreshToken.query.filter_by(token=refresh_token_str).first()
        
        if not refresh_token or not refresh_token.is_valid():
            return jsonify({'error': 'Invalid or expired refresh token'}), 401
        
        # Create new access token
        access_token = create_access_token(identity=refresh_token.user_id)
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'full_name' in data:
            user.full_name = data['full_name'].strip()
        if 'phone' in data:
            user.phone = data['phone'].strip()
        if 'organization' in data:
            user.organization = data['organization'].strip()
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        
        if not old_password or not new_password:
            return jsonify({'error': 'Both old and new passwords are required'}), 400
        
        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters'}), 400
        
        if not user.check_password(old_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        user.set_password(new_password)
        db.session.commit()
        
        # Log activity
        client_info = get_client_info()
        ActivityLog.log_activity(
            user_id=user.id, action_type='password_change',
            action_description='Password changed',
            **client_info
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Google OAuth Routes
@auth_bp.route('/google')
def google_login():
    redirect_uri = url_for('auth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/google/callback')
def google_callback():
    try:
        token = oauth.google.authorize_access_token()
        user_info = oauth.google.parse_id_token(token)
        
        # Find or create user
        user = User.query.filter_by(google_id=user_info['sub']).first()
        
        if not user:
            user = User.query.filter_by(email=user_info['email']).first()
            if user:
                user.google_id = user_info['sub']
                user.oauth_provider = 'google'
            else:
                user = User(
                    email=user_info['email'],
                    google_id=user_info['sub'],
                    full_name=user_info.get('name', ''),
                    profile_picture=user_info.get('picture', ''),
                    oauth_provider='google',
                    is_verified=True
                )
                db.session.add(user)
        
        user.update_last_login()
        db.session.commit()
        
        # Log activity
        client_info = get_client_info()
        ActivityLog.log_activity(
            user_id=user.id, action_type='google_login',
            action_description='Google OAuth login',
            **client_info
        )
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token_str = RefreshToken.create_token(user.id, **client_info)
        
        # Redirect to frontend with tokens
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5000')
        return redirect(f'{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token_str}')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
