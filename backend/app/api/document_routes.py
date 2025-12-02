from flask import Blueprint, request, jsonify, send_file, redirect, current_app
import os
import json
import tempfile
import traceback
from werkzeug.utils import secure_filename
import shutil
import sys
import uuid
import datetime
import hashlib
import re
import random
import urllib.request
from lxml import etree

from app.services.document_processor import DocumentProcessor
from app.services.norm_control_checker import NormControlChecker
from app.services.document_corrector import DocumentCorrector, CorrectionReport
from app.config.security import (
    RATE_LIMITS,
    is_allowed_file,
    is_safe_filename,
    sanitize_filename,
    MIN_FILE_SIZE,
)
# ИИ функциональность удалена для упрощения приложения

bp = Blueprint('document', __name__, url_prefix='/api/document')

ALLOWED_EXTENSIONS = {'docx'}
# Директория для хранения постоянных корректированных файлов
CORRECTIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'corrections')

# Создаем директорию, если она не существует
os.makedirs(CORRECTIONS_DIR, exist_ok=True)


def _get_limiter():
    """Получает limiter из приложения (если установлен)"""
    return getattr(current_app, 'limiter', None)


def apply_rate_limit(limit_key: str):
    """Декоратор для применения rate limit"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            limiter = _get_limiter()
            if limiter:
                # Rate limit применяется автоматически через flask-limiter
                pass
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _extract_items_from_rss(xml_bytes: bytes):
    """Парсит RSS (Pinterest board) и достает элементы с картинками.
    Возвращает список словарей: { 'title', 'link', 'images': [urls...] }
    """
    items = []
    try:
        root = etree.fromstring(xml_bytes)
        # обычная структура: rss/channel/item
        channel = root.find('channel')
        if channel is None:
            # иногда namespace, попробуем через XPath на всякий случай
            channel = root.find('.//channel')
        if channel is None:
            return items
        for it in channel.findall('item'):
            title = (it.findtext('title') or '').strip()
            link = (it.findtext('link') or '').strip()
            # content:encoded с namespace
            content = it.findtext('{http://purl.org/rss/1.0/modules/content/}encoded')
            if not content:
                content = it.findtext('description')
            content = content or ''
            # вытаскиваем все src из тегов img
            image_urls = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content, flags=re.IGNORECASE)
            # фильтруем базовые неподходящие
            image_urls = [u for u in image_urls if u.startswith('http')]
            if image_urls:
                items.append({'title': title, 'link': link, 'images': image_urls})
    except Exception:
        # если XML парсинг упал, попробуем простым регексом выдрать картинки из всего текста
        try:
            text = xml_bytes.decode('utf-8', errors='ignore')
            image_urls = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', text, flags=re.IGNORECASE)
            image_urls = [u for u in image_urls if u.startswith('http')]
            if image_urls:
                # эмулируем один item без title/link
                items.append({'title': '', 'link': '', 'images': image_urls})
        except Exception:
            pass
    return items


@bp.route('/memes/random', methods=['GET'])
def random_pinterest_meme():
    """Возвращает случайный мем из RSS публичной доски Pinterest.

    Источник RSS берется из query-параметра `rss` либо из переменной окружения PINTEREST_RSS_URL.
    Формат ответа: { url, title, postLink, author, source }
    """
    rss_url = (request.args.get('rss') or os.environ.get('PINTEREST_RSS_URL') or '').strip()
    if not rss_url:
        return jsonify({'error': 'Не задан RSS URL (параметр rss или переменная окружения PINTEREST_RSS_URL)'}), 400
    try:
        req = urllib.request.Request(rss_url, headers={'User-Agent': 'Mozilla/5.0 (compatible; CURSA/1.0)'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            xml_bytes = resp.read()
        items = _extract_items_from_rss(xml_bytes)
        # отберем те, у которых есть картинки
        valid = [it for it in items if it.get('images')]
        if not valid:
            return jsonify({'error': 'В RSS не найдено изображений'}), 404
        chosen_item = random.choice(valid)
        chosen_img = random.choice(chosen_item['images'])
        title = chosen_item.get('title') or 'мем'
        link = chosen_item.get('link') or rss_url
        return jsonify({
            'url': chosen_img,
            'title': title,
            'postLink': link,
            'author': '',
            'source': 'Pinterest RSS'
        }), 200
    except Exception as e:
        current_app.logger.warning(f"Не удалось получить RSS Pinterest: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Не удалось загрузить RSS Pinterest'}), 502


@bp.route('/upload', methods=['POST'])
def upload_document():
    """
    Загрузка документа и его проверка
    """
    # Проверяем, есть ли файл в запросе
    if 'file' not in request.files:
        return jsonify({'error': 'Файл не найден в запросе'}), 400
    
    file = request.files['file']
    
    # Проверяем, что имя файла не пустое
    if file.filename == '':
        return jsonify({'error': 'Не выбран файл'}), 400
    
    # Проверяем допустимое расширение
    if not allowed_file(file.filename):
        return jsonify({'error': 'Недопустимый формат файла. Разрешены только файлы DOCX.'}), 400
    
    try:
        # Создаём временную директорию и сохраняем файл с корректным именем
        temp_dir = tempfile.mkdtemp()
        filename = secure_filename(file.filename)
        
        # Убедимся, что имя файла имеет расширение .docx
        if not filename.lower().endswith('.docx'):
            filename = os.path.splitext(filename)[0] + '.docx'
            
        file_path = os.path.join(temp_dir, filename)
        
        # Сохраняем с явным закрытием файла
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file.stream, f)
        
        # Проверяем, что файл успешно сохранен
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            return jsonify({'error': 'Ошибка при сохранении файла'}), 500
        
        current_app.logger.info(f"Файл сохранен по пути {file_path}, размер: {os.path.getsize(file_path)} байт")
        
        try:
            # Обрабатываем документ
            current_app.logger.info("Шаг 1: Создание DocumentProcessor")
            doc_processor = DocumentProcessor(file_path)
            
            current_app.logger.info("Шаг 2: Извлечение данных")
            document_data = doc_processor.extract_data()
            
            # Проверяем результат извлечения данных
            current_app.logger.info(f"Результат извлечения данных: {type(document_data)}")
            if not document_data:
                return jsonify({'error': 'Не удалось извлечь данные из документа'}), 500
                
            # Выводим ключи для отладки
            current_app.logger.info(f"Ключи документа: {document_data.keys()}")
            
            current_app.logger.info("Шаг 3: Создание NormControlChecker")
            
            # Получаем ID профиля из запроса
            profile_id = request.form.get('profile_id')
            current_app.logger.info(f"Используемый профиль: {profile_id or 'default_gost'}")
            
            # Создаем checker с указанным профилем
            checker = NormControlChecker(profile_id=profile_id)
            
            current_app.logger.info("Шаг 4: Выполнение проверки")
            check_results = checker.check_document(document_data)
            
            current_app.logger.info("Шаг 5: Проверка завершена успешно")

            # Дополнительно: Автоисправление для достижения безупречного результата
            correction_success = False
            corrected_filename = None
            corrected_file_path = None
            corrected_check_results = None
            try:
                current_app.logger.info("Шаг 6: Автоисправление документа для соответствия нормам")
                
                # Загружаем профиль (по умолчанию или выбранный)
                profile_id = request.form.get('profile_id')
                profile_filename = f"{profile_id}.json" if profile_id else 'default_gost.json'
                
                profile_data = None
                try:
                    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    profile_path = os.path.join(base_dir, 'profiles', profile_filename)
                    
                    # Fallback to default if specific profile not found
                    if not os.path.exists(profile_path):
                        current_app.logger.warning(f"Профиль {profile_filename} не найден, используем default_gost.json")
                        profile_path = os.path.join(base_dir, 'profiles', 'default_gost.json')

                    if os.path.exists(profile_path):
                        with open(profile_path, 'r', encoding='utf-8') as f:
                            profile_data = json.load(f)
                        current_app.logger.info(f"Загружен профиль: {profile_path}")
                except Exception as e:
                    current_app.logger.warning(f"Не удалось загрузить профиль: {e}")

                corrector = DocumentCorrector(profile_data=profile_data)

                # Генерируем безопасное имя исправленного файла на основе оригинала и времени
                base_name, _ = os.path.splitext(filename)
                safe_base = secure_filename(base_name) or "document"
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                corrected_filename = f"{safe_base}_corrected_{timestamp}.docx"
                permanent_path = os.path.join(CORRECTIONS_DIR, corrected_filename)

                # Применяем все доступные исправления и сохраняем в постоянную директорию
                corrected_file_path = corrector.correct_document(file_path, None, out_path=permanent_path)
                correction_success = os.path.exists(corrected_file_path)
                current_app.logger.info(f"Автоисправление завершено: {correction_success}, путь: {corrected_file_path}")

                # Повторная проверка отключена по запросу
                corrected_check_results = None

            except Exception as auto_fix_err:
                current_app.logger.warning(f"Автоисправление не выполнено: {type(auto_fix_err).__name__}: {str(auto_fix_err)}")
                corrected_filename = None
                corrected_file_path = None
                corrected_check_results = None

            # Генерируем DOCX-отчёт о проверке
            report_path = None
            try:
                current_app.logger.info("Шаг 8: Генерация отчёта о проверке")
                report_path = doc_processor.generate_report_document(check_results, filename)
                current_app.logger.info(f"Отчёт сгенерирован: {report_path}")
            except Exception as report_err:
                current_app.logger.warning(f"Не удалось сгенерировать отчёт: {type(report_err).__name__}: {str(report_err)}")
                report_path = None

            # Возвращаем результаты проверки (+ сведения об автоисправлении, если успешно)
            return jsonify({
                'success': True,
                'filename': filename,
                'temp_path': file_path,
                'check_results': check_results,
                'correction_success': correction_success,
                'corrected_file_path': corrected_filename if correction_success else None,
                'corrected_check_results': corrected_check_results,
                'report_path': report_path
            }), 200
            
        except Exception as inner_e:
            current_app.logger.error(f"Внутренняя ошибка: {type(inner_e).__name__}: {str(inner_e)}")
            traceback.print_exc(file=sys.stdout)
            return jsonify({
                'error': f'Внутренняя ошибка при обработке: {str(inner_e)}',
                'error_type': str(type(inner_e).__name__)
            }), 500
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при обработке файла: {type(e).__name__}: {str(e)}")
        current_app.logger.error("Трассировка:")
        traceback.print_exc(file=sys.stdout)
        return jsonify({
            'error': f'Ошибка при обработке файла: {str(e)}',
            'error_type': str(type(e).__name__)        }), 500


@bp.route('/analyze', methods=['POST'])
def analyze_document():
    """
    Анализ документа без сохранения (алиас для /upload для совместимости)
    """
    # Проверяем, есть ли файл в запросе
    if 'file' not in request.files:
        return jsonify({'error': 'Файл не найден в запросе'}), 400
    
    file = request.files['file']
    
    # Проверяем, что имя файла не пустое
    if file.filename == '':
        return jsonify({'error': 'Не выбран файл'}), 400
    
    # Проверяем допустимое расширение
    if not allowed_file(file.filename):
        return jsonify({'error': 'Недопустимый формат файла. Разрешены только файлы DOCX.'}), 400
    
    # Возвращаем результаты анализа
    return jsonify({
        'message': 'Анализ выполнен успешно',
        'status': 'analyzed'
    }), 200


@bp.route('/correct', methods=['POST'])
def correct_document():
    """
    Исправление ошибок в документе
    """
    data = request.json
    current_app.logger.info(f"Получен запрос на исправление документа: {data}")
    
    if not data or ('file_path' not in data and 'path' not in data):
        current_app.logger.error("Необходимо указать путь к файлу")
        return jsonify({'error': 'Необходимо указать путь к файлу'}), 400
    
    # Поддержка как 'file_path', так и 'path' для обратной совместимости
    file_path = data.get('file_path') or data.get('path')
    original_filename = data.get('original_filename', '') or data.get('filename', '')
    current_app.logger.info(f"Путь к файлу для исправления: {file_path}")
    current_app.logger.info(f"Оригинальное имя файла: {original_filename}")
    
    try:
        # Проверяем существование файла
        if not os.path.exists(file_path):
            current_app.logger.error(f"Файл не найден: {file_path}")
            
            # Пробуем добавить расширение .docx, если его нет
            if not file_path.lower().endswith('.docx'):
                new_file_path = file_path + '.docx'
                current_app.logger.info(f"Пробуем путь с расширением .docx: {new_file_path}")
                
                if os.path.exists(new_file_path):
                    file_path = new_file_path
                    current_app.logger.info(f"Файл найден по скорректированному пути: {file_path}")
                else:
                    return jsonify({'error': 'Файл не найден'}), 404
            else:
                return jsonify({'error': 'Файл не найден'}), 404
        
        current_app.logger.info(f"Файл существует, размер: {os.path.getsize(file_path)} байт")
        
        # Создаем уникальный ID для файла и постоянную директорию для него
        correction_id = str(uuid.uuid4())
        correction_date = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Загружаем профиль ГОСТ
        profile_data = None
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            profile_path = os.path.join(base_dir, 'profiles', 'default_gost.json')
            if os.path.exists(profile_path):
                with open(profile_path, 'r', encoding='utf-8') as f:
                    profile_data = json.load(f)
        except Exception as e:
            current_app.logger.warning(f"Не удалось загрузить профиль ГОСТ: {e}")

        # Исправляем ошибки
        corrector = DocumentCorrector(profile_data=profile_data)
        current_app.logger.info("Исправление ошибок...")
        
        # Используем дату и оригинальное имя для создания нового имени файла
        if original_filename:
            original_name, ext = os.path.splitext(original_filename)
            safe_original_name = secure_filename(original_name)
            permanent_filename = f"{safe_original_name}_corrected_{correction_date}.docx"
        else:
            permanent_filename = f"corrected_doc_{correction_date}.docx"
        
        # Создаем постоянный путь для исправленного файла
        permanent_path = os.path.join(CORRECTIONS_DIR, permanent_filename)
        current_app.logger.info(f"Путь для сохранения: {permanent_path}")
        
        # Применяем исправления и сохраняем в постоянную директорию
        # Поддерживаем оба ключа: 'errors' (новый) и 'errors_to_fix' (старый тестовый)
        errors_list = data.get('errors')
        if errors_list is None:
            errors_list = data.get('errors_to_fix')

        # Если список пустой или отсутствует — применяем все исправления
        apply_errors = errors_list if errors_list else None

        corrected_file_path = corrector.correct_document(file_path, apply_errors, out_path=permanent_path)
        
        current_app.logger.info(f"Документ успешно исправлен, новый путь: {corrected_file_path}")
        
        # Убедимся, что файл создан
        if not os.path.exists(corrected_file_path):
            current_app.logger.error(f"Предупреждение: исправленный файл не найден по пути: {corrected_file_path}")
            return jsonify({'error': 'Файл не был создан при исправлении'}), 500
            
        # Проверим размер файла
        file_size = os.path.getsize(corrected_file_path)
        current_app.logger.info(f"Размер исправленного файла: {file_size} байт")
            
        # Сохраняем только имя файла для фронтенда, чтобы оно было проще для обработки
        # Это упростит процесс скачивания
        return jsonify({
            'success': True,
            'corrected_file_path': permanent_filename,  # Возвращаем только имя файла
            'corrected_path': permanent_filename,  # Для обратной совместимости
            'filename': permanent_filename,
            'original_filename': original_filename,
            'correction_id': correction_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при исправлении документа: {type(e).__name__}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при исправлении документа: {str(e)}'}), 500


@bp.route('/correct-multipass', methods=['POST'])
def correct_document_multipass():
    """
    Многопроходное исправление ошибок в документе с верификацией.
    
    Этот метод выполняет до 3 проходов коррекции:
    1. Структурный анализ и стили
    2. Детальное форматирование
    3. Верификация и доработка
    
    Возвращает детальный отчёт о выполненных исправлениях.
    """
    data = request.json
    current_app.logger.info(f"Получен запрос на многопроходное исправление документа: {data}")
    
    if not data or ('file_path' not in data and 'path' not in data):
        current_app.logger.error("Необходимо указать путь к файлу")
        return jsonify({'error': 'Необходимо указать путь к файлу'}), 400
    
    file_path = data.get('file_path') or data.get('path')
    original_filename = data.get('original_filename', '') or data.get('filename', '')
    max_passes = data.get('max_passes', 3)
    verbose = data.get('verbose', False)
    
    current_app.logger.info(f"Путь к файлу для исправления: {file_path}")
    current_app.logger.info(f"Максимальное количество проходов: {max_passes}")
    
    try:
        # Проверяем существование файла
        if not os.path.exists(file_path):
            if not file_path.lower().endswith('.docx'):
                new_file_path = file_path + '.docx'
                if os.path.exists(new_file_path):
                    file_path = new_file_path
                else:
                    return jsonify({'error': 'Файл не найден'}), 404
            else:
                return jsonify({'error': 'Файл не найден'}), 404
        
        current_app.logger.info(f"Файл существует, размер: {os.path.getsize(file_path)} байт")
        
        # Создаем уникальный ID и путь
        correction_id = str(uuid.uuid4())
        correction_date = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Загружаем профиль ГОСТ
        profile_data = None
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            profile_path = os.path.join(base_dir, 'profiles', 'default_gost.json')
            if os.path.exists(profile_path):
                with open(profile_path, 'r', encoding='utf-8') as f:
                    profile_data = json.load(f)
        except Exception as e:
            current_app.logger.warning(f"Не удалось загрузить профиль ГОСТ: {e}")

        # Создаём корректор с многопроходным режимом
        corrector = DocumentCorrector(profile_data=profile_data)
        corrector.verbose_logging = verbose
        corrector.max_passes = max_passes
        
        current_app.logger.info("Запуск многопроходной коррекции...")
        
        # Создаем путь для сохранения
        if original_filename:
            original_name, ext = os.path.splitext(original_filename)
            safe_original_name = secure_filename(original_name)
            permanent_filename = f"{safe_original_name}_multipass_{correction_date}.docx"
        else:
            permanent_filename = f"corrected_multipass_{correction_date}.docx"
        
        permanent_path = os.path.join(CORRECTIONS_DIR, permanent_filename)
        current_app.logger.info(f"Путь для сохранения: {permanent_path}")
        
        # Выполняем многопроходную коррекцию
        corrected_file_path, report = corrector.correct_document_multipass(
            file_path, 
            out_path=permanent_path,
            max_passes=max_passes
        )
        
        current_app.logger.info(f"Документ успешно исправлен, новый путь: {corrected_file_path}")
        
        # Проверяем результат
        if not os.path.exists(corrected_file_path):
            current_app.logger.error(f"Исправленный файл не найден: {corrected_file_path}")
            return jsonify({'error': 'Файл не был создан при исправлении'}), 500
            
        file_size = os.path.getsize(corrected_file_path)
        current_app.logger.info(f"Размер исправленного файла: {file_size} байт")
        
        # Получаем сводку отчёта
        report_summary = report.get_summary()
        
        return jsonify({
            'success': True,
            'corrected_file_path': permanent_filename,
            'corrected_path': permanent_filename,
            'filename': permanent_filename,
            'original_filename': original_filename,
            'correction_id': correction_id,
            'multipass': True,
            'report': {
                'passes_completed': report_summary['passes_completed'],
                'total_issues_found': report_summary['total_issues_found'],
                'total_issues_fixed': report_summary['total_issues_fixed'],
                'remaining_issues': report_summary['remaining_issues'],
                'success_rate': report_summary['success_rate'],
                'duration_seconds': report_summary['duration_seconds'],
                'actions_by_phase': report_summary['actions_by_phase'],
                'verification_results': report.verification_results
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при многопроходном исправлении: {type(e).__name__}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при исправлении документа: {str(e)}'}), 500


@bp.route('/download', methods=['GET'])
def download_file():
    """
    Скачивание исправленного файла
    """
    path = request.args.get('path')
    custom_filename = request.args.get('filename')
    
    current_app.logger.info(f"Запрос на скачивание файла. Путь: {path}, Имя файла: {custom_filename}")
    
    if not path:
        current_app.logger.error("Ошибка: путь к файлу не указан")
        return jsonify({'error': 'Не указан путь к файлу'}), 400
        
    try:
        # Проверяем существование файла
        if not os.path.exists(path):
            current_app.logger.error(f"Ошибка: файл не найден по пути {path}")
            
            # Попробуем найти файл относительно директории сервера
            # Проверим, начинается ли путь с C:\ или другого корневого пути
            if not os.path.isabs(path):
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                adjusted_path = os.path.join(base_dir, path)
                current_app.logger.info(f"Пытаемся найти файл по скорректированному пути: {adjusted_path}")
                
                if os.path.exists(adjusted_path):
                    path = adjusted_path
                    current_app.logger.info(f"Файл найден по скорректированному пути")
                else:
                    current_app.logger.info(f"Файл не найден даже по скорректированному пути")
                    return jsonify({'error': 'Файл не найден'}), 404
            else:
                return jsonify({'error': f'Файл не найден по пути {path}'}), 404
            
        # Проверяем размер файла
        file_size = os.path.getsize(path)
        current_app.logger.info(f"Файл найден, размер: {file_size} байт")
        
        # Определяем имя файла для скачивания
        if custom_filename:
            download_name = secure_filename(custom_filename)
        else:
            download_name = os.path.basename(path)
        
        current_app.logger.info(f"Отправка файла с именем '{download_name}' пользователю")
        
        return send_file(
            path_or_file=path,
            as_attachment=True,
            download_name=download_name,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при скачивании файла: {type(e).__name__}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при скачивании файла: {str(e)}'}), 500


@bp.route('/download-corrected', methods=['GET'])
def download_corrected_file():
    """
    Скачивание исправленного файла по относительному пути или ID
    """
    path = request.args.get('path')
    custom_filename = request.args.get('filename')
    
    current_app.logger.info(f"Запрос на скачивание исправленного файла. Путь: {path}, Имя файла: {custom_filename}")
    
    if not path:
        current_app.logger.error("Ошибка: путь к файлу не указан")
        return jsonify({'error': 'Не указан путь к файлу'}), 400
        
    try:
        # Обработка пути к файлу
        full_path = None
        
        # Если путь выглядит как имя файла (без слэшей), то это, скорее всего, просто название файла
        if '/' not in path and '\\' not in path:
            current_app.logger.info(f"Получено имя файла без пути: {path}")
            
            # Убедимся, что файл имеет расширение .docx
            if not path.lower().endswith('.docx'):
                filename = path + '.docx'
            else:
                filename = path
                
            # Проверяем в директории исправленных файлов
            full_path = os.path.join(CORRECTIONS_DIR, filename)
            current_app.logger.info(f"Проверяем наличие файла: {full_path}")
            
            # Если файл не найден, но запрос был через относительный URL, перенаправляем на статическую директорию
            if not os.path.exists(full_path):
                redirect_url = f"/corrections/{filename}"
                current_app.logger.info(f"Файл не найден по пути {full_path}, перенаправление на {redirect_url}")
                
                # Перенаправляем на URL для статического файла с правильными заголовками
                response = redirect(redirect_url)
                response.headers['Content-Disposition'] = f'attachment; filename="{custom_filename or filename}"'
                return response
        else:
            # Сначала пробуем найти файл как есть
            if os.path.exists(path):
                full_path = path
                current_app.logger.info(f"Файл найден по указанному пути: {full_path}")
            else:
                # Проверяем с добавлением расширения .docx
                if not path.lower().endswith('.docx'):
                    path_with_ext = path + '.docx'
                    if os.path.exists(path_with_ext):
                        full_path = path_with_ext
                        current_app.logger.info(f"Файл найден с добавлением расширения: {full_path}")
                
                # Если не найден, проверяем в директории для исправленных файлов
                if not full_path:
                    filename = os.path.basename(path)
                    if not filename.lower().endswith('.docx'):
                        filename += '.docx'
                    
                    check_path = os.path.join(CORRECTIONS_DIR, filename)
                    if os.path.exists(check_path):
                        full_path = check_path
                        current_app.logger.info(f"Файл найден в директории исправлений: {full_path}")
                
                # Если все еще не найден, пробуем полный путь относительно базовой директории
                if not full_path:
                    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    check_path = os.path.join(base_dir, path)
                    if os.path.exists(check_path):
                        full_path = check_path
                        current_app.logger.info(f"Файл найден относительно базовой директории: {full_path}")
                    elif not path.lower().endswith('.docx'):
                        check_path_with_ext = check_path + '.docx'
                        if os.path.exists(check_path_with_ext):
                            full_path = check_path_with_ext
                            current_app.logger.info(f"Файл найден с расширением относительно базовой директории: {full_path}")
        
        # Если файл найден, отправляем на скачивание
        if full_path and os.path.exists(full_path):
            current_app.logger.info(f"Файл найден и будет отправлен: {full_path}")
            
            # Проверяем размер файла
            file_size = os.path.getsize(full_path)
            current_app.logger.info(f"Размер файла: {file_size} байт")
            
            # Определяем имя файла для скачивания
            if custom_filename:
                download_name = secure_filename(custom_filename)
                if not download_name.lower().endswith('.docx'):
                    download_name += '.docx'
            else:
                download_name = os.path.basename(full_path)
            
            current_app.logger.info(f"Отправка файла с именем '{download_name}' пользователю")
            
            return send_file(
                path_or_file=full_path,
                as_attachment=True,
                download_name=download_name,
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        else:
            current_app.logger.error(f"Файл не найден по всем проверенным путям")
            return jsonify({
                'error': 'Файл не найден',
                'searched_paths': [path, full_path],
            }), 404
            
    except Exception as e:
        current_app.logger.error(f"Ошибка при скачивании исправленного файла: {type(e).__name__}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при скачивании файла: {str(e)}'}), 500


@bp.route('/list-corrections', methods=['GET'])
def list_corrections():
    """
    Список исправленных файлов
    """
    try:
        files = []
        if os.path.exists(CORRECTIONS_DIR):
            files = [f for f in os.listdir(CORRECTIONS_DIR) if f.endswith('.docx')]
            
            # Собираем подробную информацию по каждому файлу
            files_info = []
            for file in files:
                file_path = os.path.join(CORRECTIONS_DIR, file)
                file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                file_date = datetime.datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S') if os.path.exists(file_path) else None
                
                files_info.append({
                    'name': file,
                    'size': file_size,
                    'size_formatted': f"{file_size / 1024:.2f} KB" if file_size else "0 KB",
                    'date': file_date,
                    'path': file_path
                })
        
        current_app.logger.info(f"Найдено {len(files)} исправленных файлов в {CORRECTIONS_DIR}")
        
        return jsonify({
            'success': True,
            'files': files_info,
            'corrections_dir': CORRECTIONS_DIR,
            'exists': os.path.exists(CORRECTIONS_DIR),
            'file_count': len(files)
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении списка файлов: {str(e)}")
        return jsonify({'error': f'Ошибка при получении списка файлов: {str(e)}'}), 500


@bp.route('/admin/files/<filename>', methods=['DELETE'])
def delete_correction_file(filename):
    """
    Удаление исправленного файла
    """
    try:
        file_path = os.path.join(CORRECTIONS_DIR, filename)
        current_app.logger.info(f"Запрос на удаление файла: {file_path}")
        
        if not os.path.exists(file_path):
            current_app.logger.error(f"Файл для удаления не найден: {file_path}")
            return jsonify({'error': 'Файл не найден'}), 404
            
        # Удаляем файл
        os.remove(file_path)
        current_app.logger.info(f"Файл успешно удален: {file_path}")
        
        return jsonify({
            'success': True,
            'message': f'Файл {filename} успешно удален'
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при удалении файла: {str(e)}")
        return jsonify({'error': f'Ошибка при удалении файла: {str(e)}'}), 500


@bp.route('/admin/logs', methods=['GET'])
def get_logs():
    """
    Получение логов приложения
    """
    try:
        log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs', 'app.log')
        
        # Проверяем существование файла логов
        if not os.path.exists(log_file):
            current_app.logger.error(f"Файл логов не найден: {log_file}")
            return jsonify({
                'success': False,
                'logs': [],
                'error': 'Файл логов не найден'
            }), 404
            
        # Получаем количество строк из параметра запроса
        lines_count = request.args.get('lines', 100, type=int)
        
        # Читаем последние N строк
        logs = []
        with open(log_file, 'r', encoding='utf-8') as f:
            # Используем collections.deque для эффективного хранения последних N строк
            from collections import deque
            last_lines = deque(maxlen=lines_count)
            
            for line in f:
                last_lines.append(line.strip())
            
            logs = list(last_lines)
        
        current_app.logger.info(f"Отправка {len(logs)} строк логов")
        
        return jsonify({
            'success': True,
            'logs': logs,
            'count': len(logs),
            'log_file': log_file
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении логов: {str(e)}")
        return jsonify({'error': f'Ошибка при получении логов: {str(e)}'}), 500


@bp.route('/admin/cleanup', methods=['POST'])
def cleanup_old_files():
    """
    Очистка старых исправленных файлов
    """
    try:
        # Получаем количество дней из запроса
        days = request.json.get('days', 30)
        current_app.logger.info(f"Запрос на очистку файлов старше {days} дней")
        
        # Текущее время
        now = datetime.datetime.now()
        cutoff_date = now - datetime.timedelta(days=days)
        
        # Счетчики удаленных и сохраненных файлов
        deleted_count = 0
        kept_count = 0
        deleted_files = []
        
        # Проверяем каждый файл в директории
        if os.path.exists(CORRECTIONS_DIR):
            for filename in os.listdir(CORRECTIONS_DIR):
                if filename.endswith('.docx'):
                    file_path = os.path.join(CORRECTIONS_DIR, filename)
                    file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
                    
                    # Если файл старше указанного периода, удаляем его
                    if file_mtime < cutoff_date:
                        try:
                            os.remove(file_path)
                            deleted_count += 1
                            deleted_files.append({
                                'name': filename,
                                'date': file_mtime.strftime('%Y-%m-%d %H:%M:%S')
                            })
                            current_app.logger.info(f"Удален старый файл: {file_path}")
                        except Exception as e:
                            current_app.logger.error(f"Ошибка при удалении файла {file_path}: {str(e)}")
                    else:
                        kept_count += 1
                        
        current_app.logger.info(f"Очистка завершена. Удалено: {deleted_count}, Сохранено: {kept_count}")
        
        return jsonify({
            'success': True,
            'deleted_count': deleted_count,
            'kept_count': kept_count,
            'deleted_files': deleted_files,
            'cutoff_date': cutoff_date.strftime('%Y-%m-%d %H:%M:%S')
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при очистке старых файлов: {str(e)}")
        return jsonify({'error': f'Ошибка при очистке старых файлов: {str(e)}'}), 500


@bp.route('/admin/backup/logs', methods=['POST'])
def backup_logs():
    """
    Создание резервной копии файла логов
    """
    try:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
        log_file = os.path.join(log_dir, 'app.log')
        
        # Проверяем существование файла логов
        if not os.path.exists(log_file):
            current_app.logger.error(f"Файл логов не найден: {log_file}")
            return jsonify({
                'success': False,
                'error': 'Файл логов не найден'
            }), 404
            
        # Создаем директорию для резервных копий
        backup_dir = os.path.join(log_dir, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        # Создаем имя файла резервной копии с текущей датой и временем
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(backup_dir, f'app_log_{timestamp}.bak')
        
        # Копируем файл логов
        import shutil
        shutil.copy2(log_file, backup_file)
        
        # Очищаем основной файл логов
        is_clear = request.json.get('clear_after_backup', False)
        if is_clear:
            # Открываем файл в режиме усечения (truncate)
            with open(log_file, 'w') as f:
                f.write(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] INFO: Файл логов очищен после создания резервной копии {os.path.basename(backup_file)}\n")
            
            current_app.logger.info(f"Файл логов очищен после создания резервной копии")
            
        current_app.logger.info(f"Создана резервная копия логов: {backup_file}")
        
        return jsonify({
            'success': True,
            'backup_file': backup_file,
            'timestamp': timestamp,
            'cleared': is_clear
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при создании резервной копии логов: {str(e)}")
        return jsonify({'error': f'Ошибка при создании резервной копии логов: {str(e)}'}), 500


@bp.route('/download-report', methods=['GET'])
def download_report():
    """
    Скачивание сгенерированного отчета
    """
    path = request.args.get('path')
    custom_filename = request.args.get('filename')
    
    current_app.logger.info(f"Запрос на скачивание отчета. Путь: {path}, Имя файла: {custom_filename}")
    
    if not path:
        current_app.logger.error("Ошибка: путь к отчету не указан")
        return jsonify({'error': 'Не указан путь к отчету'}), 400
        
    try:
        # Формируем полный путь к файлу отчета
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        full_path = os.path.join(base_dir, path.lstrip('/'))
        
        current_app.logger.info(f"Полный путь к отчету: {full_path}")
        
        # Проверяем существование файла
        if not os.path.exists(full_path):
            current_app.logger.error(f"Ошибка: отчет не найден по пути {full_path}")
            return jsonify({'error': 'Отчет не найден'}), 404
            
        # Проверяем размер файла
        file_size = os.path.getsize(full_path)
        current_app.logger.info(f"Отчет найден, размер: {file_size} байт")
        
        # Определяем имя файла для скачивания
        if custom_filename:
            download_name = secure_filename(custom_filename)
        else:
            download_name = os.path.basename(full_path)
        
        current_app.logger.info(f"Отправка отчета с именем '{download_name}' пользователю")
        
        return send_file(
            path_or_file=full_path,
            as_attachment=True,
            download_name=download_name,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при скачивании отчета: {type(e).__name__}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при скачивании отчета: {str(e)}'}), 500
