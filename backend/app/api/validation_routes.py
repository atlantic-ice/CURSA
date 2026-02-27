"""
API маршруты для валидации документов.
"""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
import logging
from pathlib import Path

from app.services.validation_engine import ValidationEngine
from app.services.document_processor import DocumentProcessor


logger = logging.getLogger(__name__)

validation_bp = Blueprint('validation', __name__, url_prefix='/api/validation')


@validation_bp.route('/check', methods=['POST'])
def validate_document():
    """
    Проверяет документ на соответствие требованиям нормоконтроля.

    Request:
        - file: DOCX файл
        - profile_id (optional): ID профиля требований

    Returns:
        JSON с результатами валидации
    """
    try:
        # Проверка наличия файла
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'Файл не предоставлен'
            }), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'Файл не выбран'
            }), 400

        # Проверка расширения файла
        if not file.filename.lower().endswith('.docx'):
            return jsonify({
                'status': 'error',
                'message': 'Поддерживаются только DOCX файлы'
            }), 400

        # Получаем профиль (опционально)
        profile_id = request.form.get('profile_id', 'gost_7_32_2017')

        # Сохраняем файл во временную директорию
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_file:
            file.save(tmp_file.name)
            temp_path = tmp_file.name

        try:
            # Загружаем профиль
            profile = load_profile(profile_id)

            # Создаем движок валидации
            engine = ValidationEngine(profile=profile)

            # Обрабатываем документ
            processor = DocumentProcessor(temp_path)
            document_data = processor.extract_data()

            # Выполняем валидацию
            report = engine.validate_document(temp_path, document_data)

            logger.info(
                f"Валидация завершена: {report['summary']['total_issues']} проблем, "
                f"статус: {report['status']}"
            )

            return jsonify(report), 200

        finally:
            # Удаляем временный файл
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Не удалось удалить временный файл {temp_path}: {e}")

    except Exception as e:
        logger.error(f"Ошибка при валидации документа: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Ошибка при обработке документа: {str(e)}'
        }), 500


@validation_bp.route('/quick-check', methods=['POST'])
def quick_validate():
    """
    Быстрая проверка документа (только критические ошибки).

    Request:
        - file: DOCX файл

    Returns:
        JSON с основными метриками
    """
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'Файл не предоставлен'}), 400

        file = request.files['file']

        if not file.filename.lower().endswith('.docx'):
            return jsonify({'status': 'error', 'message': 'Только DOCX файлы'}), 400

        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_file:
            file.save(tmp_file.name)
            temp_path = tmp_file.name

        try:
            # Обрабатываем документ
            result = DocumentProcessor.process_document(temp_path)

            if result['status'] == 'error':
                return jsonify(result), 500

            # Быстрая проверка основных метрик
            quick_report = {
                'status': 'success',
                'filename': result['filename'],
                'basic_checks': {
                    'has_content': result['structure']['paragraphs_count'] > 0,
                    'has_sections': len(result['structure']['sections']) > 0,
                    'has_tables': result['structure']['tables_count'] > 0,
                    'has_images': result['structure']['images_count'] > 0
                },
                'formatting': result['formatting'],
                'statistics': result['structure']
            }

            return jsonify(quick_report), 200

        finally:
            try:
                os.unlink(temp_path)
            except Exception:
                pass

    except Exception as e:
        logger.error(f"Ошибка при быстрой проверке: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@validation_bp.route('/validators', methods=['GET'])
def get_validators():
    """
    Возвращает список доступных валидаторов.

    Returns:
        JSON со списком валидаторов
    """
    try:
        engine = ValidationEngine()
        validators = engine.get_available_validators()

        return jsonify({
            'status': 'success',
            'validators': validators,
            'count': len(validators)
        }), 200

    except Exception as e:
        logger.error(f"Ошибка при получении списка валидаторов: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@validation_bp.route('/profiles', methods=['GET'])
def get_profiles():
    """
    Возвращает список доступных профилей требований.

    Returns:
        JSON со списком профилей
    """
    try:
        profiles_dir = Path(__file__).parent.parent.parent.parent / 'profiles'

        profiles = []

        if profiles_dir.exists():
            for profile_file in profiles_dir.glob('*.json'):
                try:
                    import json
                    with open(profile_file, 'r', encoding='utf-8') as f:
                        profile_data = json.load(f)

                        profiles.append({
                            'id': profile_file.stem,
                            'name': profile_data.get('name', profile_file.stem),
                            'description': profile_data.get('description', ''),
                            'version': profile_data.get('version', ''),
                            'category': profile_data.get('category', 'custom')
                        })
                except Exception as e:
                    logger.warning(f"Не удалось загрузить профиль {profile_file}: {e}")

        return jsonify({
            'status': 'success',
            'profiles': profiles,
            'count': len(profiles)
        }), 200

    except Exception as e:
        logger.error(f"Ошибка при получении профилей: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


def load_profile(profile_id: str) -> dict:
    """
    Загружает профиль требований по ID.

    Args:
        profile_id: ID профиля (имя файла без расширения)

    Returns:
        Словарь с данными профиля
    """
    profiles_dir = Path(__file__).parent.parent.parent.parent / 'profiles'
    profile_path = profiles_dir / f'{profile_id}.json'

    if not profile_path.exists():
        # Fallback на default профиль
        profile_path = profiles_dir / 'gost_7_32_2017.json'

    import json
    with open(profile_path, 'r', encoding='utf-8') as f:
        return json.load(f)
