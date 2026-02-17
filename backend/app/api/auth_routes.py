"""
Authentication API routes

Endpoints:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user  
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from datetime import datetime, timezone
from email_validator import validate_email, EmailNotValidError

from app.extensions import db
from app.models import User, UserRole

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: SecurePassword123
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            organization:
              type: string
              example: University
    responses:
      201:
        description: User registered successfully
      400:
        description: Invalid input
      409:
        description: User already exists
    """
    try:
        data = request.get_json()
        
        # Валидация входных данных
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email и password обязательны'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Валидация email
        try:
            valid = validate_email(email)
            email = valid.email
        except EmailNotValidError as e:
            return jsonify({'error': f'Некорректный email: {str(e)}'}), 400
        
        # Проверка длины пароля
        if len(password) < 8:
            return jsonify({'error': 'Пароль должен быть не менее 8 символов'}), 400
        
        # Проверка существования пользователя
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Пользователь с таким email уже существует'}), 409
        
        # Создание пользователя
        user = User(
            email=email,
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            organization=data.get('organization'),
            role=UserRole.USER,
            is_active=True,
            is_email_verified=False  # TODO: Email verification in v1.4.0
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Создание токенов
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Пользователь успешно зарегистрирован',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка регистрации: {str(e)}'}), 500


@bp.route('/login', methods=['POST'])
def login():
    """
    Login user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: SecurePassword123
    responses:
      200:
        description: Login successful
      400:
        description: Invalid input
      401:
        description: Invalid credentials
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email и password обязательны'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Поиск пользователя
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Неверный email или пароль'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Аккаунт деактивирован'}), 401
        
        # Обновление last_login_at
        user.last_login_at = datetime.now(timezone.utc)
        db.session.commit()
        
        # Создание токенов
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Успешный вход',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка входа: {str(e)}'}), 500


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Token refreshed successfully
      401:
        description: Invalid refresh token
    """
    try:
        current_user_id = get_jwt_identity()
        access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка обновления токена: {str(e)}'}), 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Logout successful
    """
    # TODO: Добавить JWT в blacklist (Redis) в будущих версиях
    return jsonify({'message': 'Успешный выход'}), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current user information
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: User information
      404:
        description: User not found
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Получить текущую подписку
        subscription = user.current_subscription
        subscription_data = subscription.to_dict() if subscription else None
        
        return jsonify({
            'user': user.to_dict(),
            'subscription': subscription_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения пользователя: {str(e)}'}), 500


@bp.route('/me', methods=['PATCH'])
@jwt_required()
def update_current_user():
    """
    Update current user information
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            first_name:
              type: string
            last_name:
              type: string
            organization:
              type: string
    responses:
      200:
        description: User updated successfully
      404:
        description: User not found
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        data = request.get_json()
        
        # Обновление полей
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'organization' in data:
            user.organization = data['organization']
        
        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            'message': 'Профиль обновлён',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обновления: {str(e)}'}), 500
