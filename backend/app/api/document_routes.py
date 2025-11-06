from flask import Blueprint, request, jsonify, send_file, redirect, current_app
import os
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
from app.services.document_corrector import DocumentCorrector
from app.services.ai_config import get_ai_status, save_api_key, clear_api_key
from app.services.ai_client import is_configured as ai_is_configured, suggest_for_check_results, complete_prompt

bp = Blueprint('document', __name__, url_prefix='/api/document')

ALLOWED_EXTENSIONS = {'docx'}
# Директория для хранения постоянных корректированных файлов
CORRECTIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'corrections')

# Создаем директорию, если она не существует
os.makedirs(CORRECTIONS_DIR, exist_ok=True)

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


@bp.route('/ai/status', methods=['GET'])
def ai_status():
    """Возвращает состояние настройки Gemini без раскрытия ключа."""
    try:
        status = get_ai_status()
        return jsonify({'success': True, 'status': status}), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении статуса ИИ: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Не удалось получить статус ИИ'}), 500


@bp.route('/ai/key', methods=['POST'])
def ai_save_key():
    """Сохраняет Gemini API ключ, переданный из интерфейса."""
    payload = request.get_json(silent=True) or {}
    api_key = (payload.get('api_key') or '').strip()

    if not api_key:
        return jsonify({'error': 'API ключ не может быть пустым'}), 400

    try:
        status = save_api_key(api_key)
        current_app.logger.info("Gemini API ключ сохранен через веб-интерфейс")
        return jsonify({'success': True, 'status': status}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        current_app.logger.error(f"Ошибка при сохранении ключа ИИ: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Не удалось сохранить ключ ИИ'}), 500


@bp.route('/ai/key', methods=['DELETE'])
def ai_clear_key():
    """Удаляет сохраненный Gemini API ключ."""
    try:
        status = clear_api_key()
        current_app.logger.info("Gemini API ключ удален через веб-интерфейс")
        return jsonify({'success': True, 'status': status}), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при удалении ключа ИИ: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Не удалось удалить ключ ИИ'}), 500


@bp.route('/ai/suggest', methods=['POST'])
def ai_suggest():
    """Возвращает краткие рекомендации по устранению проблем на основе результатов проверки.

    Ожидает JSON с ключом check_results и необязательным filename.
    """
    if not ai_is_configured():
        return jsonify({'error': 'ИИ не настроен. Добавьте ключ Gemini в настройках.'}), 400

    payload = request.get_json(silent=True) or {}
    check_results = payload.get('check_results')
    filename = payload.get('filename')
    if not check_results:
        return jsonify({'error': 'Не предоставлены результаты проверки (check_results).'}), 400

    try:
        text = suggest_for_check_results(check_results, filename)
        return jsonify({'success': True, 'suggestions': text}), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка AI suggest: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Не удалось получить рекомендации ИИ'}), 500


@bp.route('/ai/complete', methods=['POST'])
def ai_complete():
    """Простой прокси для свободной генерации текста ИИ (для внутренних нужд UI)."""
    if not ai_is_configured():
        return jsonify({'error': 'ИИ не настроен. Добавьте ключ Gemini в настройках.'}), 400

    payload = request.get_json(silent=True) or {}
    prompt = (payload.get('prompt') or '').strip()
    if not prompt:
        return jsonify({'error': 'Требуется prompt'}), 400

    try:
        text = complete_prompt(prompt)
        return jsonify({'success': True, 'text': text}), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка AI complete: {type(e).__name__}: {str(e)}")
        return jsonify({'error': 'Не удалось выполнить запрос к ИИ'}), 500

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
            checker = NormControlChecker()
            
            current_app.logger.info("Шаг 4: Выполнение проверки")
            check_results = checker.check_document(document_data)
            
            current_app.logger.info("Шаг 5: Проверка завершена успешно")

            # Дополнительно: Автоисправление для достижения безупречного результата
            correction_success = False
            corrected_filename = None
            corrected_file_path = None
            corrected_check_results = None
            ai_suggestions = {}
            ai_error = None
            ai_enabled = ai_is_configured()
            try:
                current_app.logger.info("Шаг 6: Автоисправление документа для соответствия нормам")
                corrector = DocumentCorrector()

                # Генерируем безопасное имя исправленного файла на основе оригинала и времени
                base_name, _ = os.path.splitext(filename)
                safe_base = secure_filename(base_name) or "document"
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                corrected_filename = f"{safe_base}_corrected_{timestamp}.docx"
                permanent_path = os.path.join(CORRECTIONS_DIR, corrected_filename)

                # Применяем все доступные исправления и сохраняем в постоянную директорию
                # None => применить все доступные исправления
                corrected_file_path = corrector.correct_document(file_path, None, out_path=permanent_path)
                correction_success = os.path.exists(corrected_file_path)
                current_app.logger.info(f"Автоисправление завершено: {correction_success}, путь: {corrected_file_path}")

                # Небольшой итеративный цикл автоисправлений: повторяем до стабилизации (макс. 3 прохода)
                def _file_hash(path: str) -> str:
                    try:
                        with open(path, 'rb') as fh:
                            return hashlib.sha256(fh.read()).hexdigest()
                    except Exception:
                        return ''

                if correction_success:
                    prev_hash = _file_hash(corrected_file_path)
                    max_iter = 2  # дополнительно до 2 повторных проходов (итого до 3 применений)
                    for i in range(max_iter):
                        iter_filename = f"{safe_base}_corrected_{timestamp}_v{i+2}.docx"
                        iter_path = os.path.join(CORRECTIONS_DIR, iter_filename)
                        current_app.logger.info(f"Итерация доп. автоисправления #{i+2}: {iter_path}")
                        iter_out = corrector.correct_document(corrected_file_path, None, out_path=iter_path)
                        new_hash = _file_hash(iter_out)
                        if not new_hash or new_hash == prev_hash:
                            # Изменений нет — удалим лишний файл, если он появился
                            try:
                                if os.path.exists(iter_out) and iter_out != corrected_file_path:
                                    os.remove(iter_out)
                            except Exception:
                                pass
                            current_app.logger.info("Доп. автоисправления: изменений не обнаружено, завершаем итерации")
                            break
                        # Приняли улучшенную версию
                        corrected_file_path = iter_out
                        corrected_filename = os.path.basename(iter_out)
                        prev_hash = new_hash

                # Повторная проверка уже финального исправленного документа
                if correction_success and corrected_file_path and os.path.exists(corrected_file_path):
                    current_app.logger.info("Шаг 7: Повторная проверка финального исправленного документа")
                    corrected_processor = DocumentProcessor(corrected_file_path)
                    corrected_data = corrected_processor.extract_data()
                    corrected_check_results = checker.check_document(corrected_data)

                # Формируем подсказки ИИ при наличии ключа
                if ai_enabled:
                    try:
                        ai_suggestions['before'] = suggest_for_check_results(check_results, filename)
                    except Exception as ai_exc:
                        current_app.logger.warning(f"AI suggest (до исправления) не удалось: {type(ai_exc).__name__}: {str(ai_exc)}")
                        ai_error = 'Не удалось получить рекомендации ИИ для исходной версии'
                    if corrected_check_results:
                        try:
                            ai_suggestions['after'] = suggest_for_check_results(corrected_check_results, corrected_filename or filename)
                        except Exception as ai_exc:
                            current_app.logger.warning(f"AI suggest (после исправления) не удалось: {type(ai_exc).__name__}: {str(ai_exc)}")
                            ai_error = ai_error or 'Не удалось получить рекомендации ИИ для исправленной версии'
            except Exception as auto_fix_err:
                current_app.logger.warning(f"Автоисправление не выполнено: {type(auto_fix_err).__name__}: {str(auto_fix_err)}")
                corrected_filename = None
                corrected_file_path = None
                corrected_check_results = None

            # Возвращаем результаты проверки (+ сведения об автоисправлении, если успешно)
            return jsonify({
                'success': True,
                'filename': filename,
                'temp_path': file_path,
                'check_results': check_results,
                'correction_success': correction_success,
                'corrected_file_path': corrected_filename if correction_success else None,
                'corrected_check_results': corrected_check_results,
                'ai_enabled': ai_enabled,
                'ai_suggestions': ai_suggestions if ai_suggestions else None,
                'ai_error': ai_error
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
        
        # Исправляем ошибки
        corrector = DocumentCorrector()
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
            'size': os.path.getsize(backup_file),
            'cleared': is_clear
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при создании резервной копии логов: {str(e)}")
        return jsonify({'error': f'Ошибка при создании резервной копии логов: {str(e)}'}), 500

@bp.route('/admin/backup/logs', methods=['GET'])
def list_log_backups():
    """
    Получение списка резервных копий логов
    """
    try:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
        backup_dir = os.path.join(log_dir, 'backups')
        
        # Проверяем существование директории
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir, exist_ok=True)
            
        # Получаем список файлов резервных копий
        backups = []
        if os.path.exists(backup_dir):
            for filename in os.listdir(backup_dir):
                if filename.startswith('app_log_') and filename.endswith('.bak'):
                    file_path = os.path.join(backup_dir, filename)
                    file_size = os.path.getsize(file_path)
                    file_date = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
                    
                    backups.append({
                        'name': filename,
                        'path': file_path,
                        'size': file_size,
                        'size_formatted': f"{file_size / 1024:.2f} KB",
                        'date': file_date.strftime('%Y-%m-%d %H:%M:%S')
                    })
        
        # Сортируем по дате (от новых к старым)
        backups.sort(key=lambda x: x['date'], reverse=True)
        
        current_app.logger.info(f"Получен список резервных копий логов: {len(backups)} файлов")
        
        return jsonify({
            'success': True,
            'backups': backups,
            'count': len(backups)
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении списка резервных копий логов: {str(e)}")
        return jsonify({'error': f'Ошибка при получении списка резервных копий логов: {str(e)}'}), 500

@bp.route('/admin/backup/logs/restore/<filename>', methods=['POST'])
def restore_log_backup(filename):
    """
    Восстановление логов из резервной копии
    """
    try:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
        backup_dir = os.path.join(log_dir, 'backups')
        backup_file = os.path.join(backup_dir, filename)
        
        # Проверяем существование файла резервной копии
        if not os.path.exists(backup_file):
            current_app.logger.error(f"Файл резервной копии не найден: {backup_file}")
            return jsonify({
                'success': False,
                'error': 'Файл резервной копии не найден'
            }), 404
            
        # Путь к основному файлу логов
        log_file = os.path.join(log_dir, 'app.log')
        
        # Опции восстановления
        restore_mode = request.json.get('mode', 'append')  # append или overwrite
        backup_current = request.json.get('backup_current', True)  # создавать ли резервную копию текущих логов
        
        # Создаем резервную копию текущего лога, если нужно
        if backup_current and os.path.exists(log_file) and os.path.getsize(log_file) > 0:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            auto_backup_file = os.path.join(backup_dir, f'app_log_before_restore_{timestamp}.bak')
            shutil.copy2(log_file, auto_backup_file)
            current_app.logger.info(f"Создана автоматическая резервная копия перед восстановлением: {auto_backup_file}")
        
        # Восстанавливаем логи
        if restore_mode == 'overwrite':
            # Полная замена текущего файла логов
            shutil.copy2(backup_file, log_file)
            current_app.logger.info(f"Логи полностью заменены из резервной копии: {filename}")
        else:
            # Добавление записей из резервной копии в конец текущего файла
            with open(backup_file, 'r', encoding='utf-8') as source:
                with open(log_file, 'a', encoding='utf-8') as dest:
                    dest.write(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] INFO: --- Начало восстановленных записей из {filename} ---\n")
                    dest.write(source.read())
                    dest.write(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] INFO: --- Конец восстановленных записей из {filename} ---\n")
            
            current_app.logger.info(f"Логи добавлены из резервной копии: {filename}")
        
        # Получаем информацию о восстановленном файле
        restore_info = {
            'backup_file': filename,
            'backup_size': os.path.getsize(backup_file),
            'backup_date': datetime.datetime.fromtimestamp(os.path.getmtime(backup_file)).strftime('%Y-%m-%d %H:%M:%S'),
            'current_log_size': os.path.getsize(log_file),
            'mode': restore_mode,
            'created_auto_backup': backup_current and os.path.exists(log_file)
        }
        
        return jsonify({
            'success': True,
            'message': f'Логи успешно восстановлены из резервной копии {filename}',
            'restore_info': restore_info
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при восстановлении логов из резервной копии: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при восстановлении логов: {str(e)}'}), 500

@bp.route('/admin/backup/logs/<filename>', methods=['DELETE'])
def delete_log_backup(filename):
    """
    Удаление резервной копии логов
    """
    try:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
        backup_dir = os.path.join(log_dir, 'backups')
        backup_file = os.path.join(backup_dir, filename)
        
        # Проверяем существование файла резервной копии
        if not os.path.exists(backup_file):
            current_app.logger.error(f"Файл резервной копии не найден: {backup_file}")
            return jsonify({
                'success': False,
                'error': 'Файл резервной копии не найден'
            }), 404
            
        # Удаляем файл
        os.remove(backup_file)
        current_app.logger.info(f"Резервная копия логов успешно удалена: {filename}")
        
        return jsonify({
            'success': True,
            'message': f'Резервная копия логов {filename} успешно удалена'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при удалении резервной копии логов: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при удалении резервной копии логов: {str(e)}'}), 500

@bp.route('/admin/backup/logs/download/<filename>', methods=['GET'])
def download_log_backup(filename):
    """
    Скачивание резервной копии логов
    """
    try:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
        backup_dir = os.path.join(log_dir, 'backups')
        backup_file = os.path.join(backup_dir, filename)
        
        # Проверяем существование файла резервной копии
        if not os.path.exists(backup_file):
            current_app.logger.error(f"Файл резервной копии не найден: {backup_file}")
            return jsonify({
                'success': False,
                'error': 'Файл резервной копии не найден'
            }), 404
        
        current_app.logger.info(f"Скачивание резервной копии логов: {filename}")
        
        # Возвращаем файл для скачивания
        return send_file(
            path_or_file=backup_file,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при скачивании резервной копии логов: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при скачивании резервной копии логов: {str(e)}'}), 500

@bp.route('/admin/system-info', methods=['GET'])
def get_system_info():
    """
    Получение информации о системе
    """
    try:
        import platform
        import psutil
        import datetime
        import sys
        import time
        
        # Базовая информация о системе
        system_info = {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'hostname': platform.node(),
            'processor': platform.processor(),
            'cpu_count': psutil.cpu_count(logical=True),
            'cpu_physical': psutil.cpu_count(logical=False),
            'memory_total': psutil.virtual_memory().total,
            'memory_available': psutil.virtual_memory().available,
            'memory_used': psutil.virtual_memory().used,
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': {},
            'server_uptime': {
                'start_time': time.time() - psutil.boot_time(),
                'formatted': str(datetime.timedelta(seconds=int(time.time() - psutil.boot_time())))
            }
        }
        
        # Информация о дисках
        for partition in psutil.disk_partitions():
            if partition.mountpoint:
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    system_info['disk_usage'][partition.mountpoint] = {
                        'total': usage.total,
                        'used': usage.used,
                        'free': usage.free,
                        'percent': usage.percent
                    }
                except Exception as e:
                    current_app.logger.warning(f"Не удалось получить информацию о диске {partition.mountpoint}: {str(e)}")
        
        # Информация о приложении
        app_info = {
            'corrections_dir': CORRECTIONS_DIR,
            'corrections_count': 0,
            'corrections_size': 0,
            'logs_dir': os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs'),
            'log_size': 0,
            'log_backups_count': 0,
            'log_backups_size': 0
        }
        
        # Информация о файлах исправлений
        if os.path.exists(CORRECTIONS_DIR):
            correction_files = [f for f in os.listdir(CORRECTIONS_DIR) if f.endswith('.docx')]
            app_info['corrections_count'] = len(correction_files)
            app_info['corrections_size'] = sum(os.path.getsize(os.path.join(CORRECTIONS_DIR, f)) for f in correction_files)
        
        # Информация о логах
        log_file = os.path.join(app_info['logs_dir'], 'app.log')
        if os.path.exists(log_file):
            app_info['log_size'] = os.path.getsize(log_file)
        
        # Информация о резервных копиях логов
        backup_dir = os.path.join(app_info['logs_dir'], 'backups')
        if os.path.exists(backup_dir):
            backup_files = [f for f in os.listdir(backup_dir) if f.endswith('.bak')]
            app_info['log_backups_count'] = len(backup_files)
            app_info['log_backups_size'] = sum(os.path.getsize(os.path.join(backup_dir, f)) for f in backup_files)
        
        return jsonify({
            'success': True,
            'system': system_info,
            'app': app_info,
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении информации о системе: {str(e)}")
        return jsonify({'error': f'Ошибка при получении информации о системе: {str(e)}'}), 500

@bp.route('/admin/system-info/export', methods=['GET'])
def export_system_info():
    """
    Экспорт информации о системе в текстовый файл
    """
    try:
        import platform
        import psutil
        import datetime
        import sys
        import time
        import csv
        import io
        
        # Получаем текущую дату и время для имени файла
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Определяем формат экспорта
        export_format = request.args.get('format', 'txt')
        
        # Базовая информация о системе
        system_info = {
            'platform': platform.platform(),
            'python_version': platform.python_version(),
            'hostname': platform.node(),
            'processor': platform.processor(),
            'cpu_count': psutil.cpu_count(logical=True),
            'cpu_physical': psutil.cpu_count(logical=False),
            'memory_total': psutil.virtual_memory().total,
            'memory_available': psutil.virtual_memory().available,
            'memory_used': psutil.virtual_memory().used,
            'memory_percent': psutil.virtual_memory().percent,
            'server_uptime': str(datetime.timedelta(seconds=int(time.time() - psutil.boot_time())))
        }
        
        # Информация о дисках
        disk_info = {}
        for partition in psutil.disk_partitions():
            if partition.mountpoint:
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disk_info[partition.mountpoint] = {
                        'total': usage.total,
                        'used': usage.used,
                        'free': usage.free,
                        'percent': usage.percent
                    }
                except Exception as e:
                    current_app.logger.warning(f"Не удалось получить информацию о диске {partition.mountpoint}: {str(e)}")
        
        # Информация о приложении
        app_info = {
            'corrections_dir': CORRECTIONS_DIR,
            'corrections_count': 0,
            'corrections_size': 0,
            'logs_dir': os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs'),
            'log_size': 0,
            'log_backups_count': 0,
            'log_backups_size': 0
        }
        
        # Информация о файлах исправлений
        if os.path.exists(CORRECTIONS_DIR):
            correction_files = [f for f in os.listdir(CORRECTIONS_DIR) if f.endswith('.docx')]
            app_info['corrections_count'] = len(correction_files)
            app_info['corrections_size'] = sum(os.path.getsize(os.path.join(CORRECTIONS_DIR, f)) for f in correction_files)
        
        # Информация о логах
        log_file = os.path.join(app_info['logs_dir'], 'app.log')
        if os.path.exists(log_file):
            app_info['log_size'] = os.path.getsize(log_file)
        
        # Информация о резервных копиях логов
        backup_dir = os.path.join(app_info['logs_dir'], 'backups')
        if os.path.exists(backup_dir):
            backup_files = [f for f in os.listdir(backup_dir) if f.endswith('.bak')]
            app_info['log_backups_count'] = len(backup_files)
            app_info['log_backups_size'] = sum(os.path.getsize(os.path.join(backup_dir, f)) for f in backup_files)
        
        if export_format == 'csv':
            # Создаем CSV файл
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Заголовок отчета
            writer.writerow(['Отчет о системной информации', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
            writer.writerow([])
            
            # Системная информация
            writer.writerow(['Системная информация'])
            for key, value in system_info.items():
                if key != 'disk_usage':
                    writer.writerow([key, value])
            
            writer.writerow([])
            
            # Использование дисков
            writer.writerow(['Использование дисков'])
            for mountpoint, usage in disk_info.items():
                writer.writerow([mountpoint, f"Всего: {usage['total']} байт", f"Использовано: {usage['used']} байт", 
                                f"Свободно: {usage['free']} байт", f"Заполнено: {usage['percent']}%"])
            
            writer.writerow([])
            
            # Информация о приложении
            writer.writerow(['Информация о приложении'])
            for key, value in app_info.items():
                if key not in ['corrections_dir', 'logs_dir']:
                    if 'size' in key:
                        writer.writerow([key, f"{value} байт ({value / 1024 / 1024:.2f} МБ)"])
                    else:
                        writer.writerow([key, value])
            
            # Получаем содержимое CSV
            csv_content = output.getvalue()
            output.close()
            
            # Отправляем файл на скачивание
            response = current_app.response_class(
                csv_content,
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=system_info_{timestamp}.csv'
                }
            )
            return response
        else:
            # Текстовый формат по умолчанию
            output = io.StringIO()
            
            # Заголовок отчета
            output.write(f"ОТЧЕТ О СИСТЕМНОЙ ИНФОРМАЦИИ\n")
            output.write(f"Дата создания: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            output.write("="*50 + "\n\n")
            
            # Системная информация
            output.write("СИСТЕМНАЯ ИНФОРМАЦИЯ\n")
            output.write("-"*30 + "\n")
            for key, value in system_info.items():
                if key != 'disk_usage':
                    output.write(f"{key}: {value}\n")
            
            output.write("\n")
            
            # Использование дисков
            output.write("ИСПОЛЬЗОВАНИЕ ДИСКОВ\n")
            output.write("-"*30 + "\n")
            for mountpoint, usage in disk_info.items():
                output.write(f"Диск: {mountpoint}\n")
                output.write(f"  Всего: {usage['total']} байт ({usage['total'] / 1024 / 1024 / 1024:.2f} ГБ)\n")
                output.write(f"  Использовано: {usage['used']} байт ({usage['used'] / 1024 / 1024 / 1024:.2f} ГБ)\n")
                output.write(f"  Свободно: {usage['free']} байт ({usage['free'] / 1024 / 1024 / 1024:.2f} ГБ)\n")
                output.write(f"  Заполнено: {usage['percent']}%\n")
                output.write("\n")
            
            # Информация о приложении
            output.write("ИНФОРМАЦИЯ О ПРИЛОЖЕНИИ\n")
            output.write("-"*30 + "\n")
            output.write(f"Директория исправлений: {app_info['corrections_dir']}\n")
            output.write(f"Количество файлов исправлений: {app_info['corrections_count']}\n")
            output.write(f"Размер файлов исправлений: {app_info['corrections_size']} байт ({app_info['corrections_size'] / 1024 / 1024:.2f} МБ)\n")
            output.write(f"Директория логов: {app_info['logs_dir']}\n")
            output.write(f"Размер файла логов: {app_info['log_size']} байт ({app_info['log_size'] / 1024 / 1024:.2f} МБ)\n")
            output.write(f"Количество резервных копий логов: {app_info['log_backups_count']}\n")
            output.write(f"Размер резервных копий логов: {app_info['log_backups_size']} байт ({app_info['log_backups_size'] / 1024 / 1024:.2f} МБ)\n")
            
            # Получаем содержимое текстового файла
            text_content = output.getvalue()
            output.close()
            
            # Отправляем файл на скачивание
            response = current_app.response_class(
                text_content,
                mimetype='text/plain',
                headers={
                    'Content-Disposition': f'attachment; filename=system_info_{timestamp}.txt'
                }
            )
            return response
            
    except Exception as e:
        current_app.logger.error(f"Ошибка при экспорте информации о системе: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при экспорте информации о системе: {str(e)}'}), 500

@bp.route('/admin/statistics', methods=['GET'])
def get_statistics():
    """
    Получение статистики использования системы
    """
    try:
        import datetime
        import re
        import os
        
        # Период для статистики (по умолчанию последние 30 дней)
        days = request.args.get('days', 30, type=int)
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days)
        
        # Статистика по файлам
        file_stats = {
            'total_count': 0,
            'total_size': 0,
            'avg_size': 0,
            'by_date': {},
            'file_types': {}
        }
        
        # Анализ файлов исправлений
        if os.path.exists(CORRECTIONS_DIR):
            files = []
            for filename in os.listdir(CORRECTIONS_DIR):
                if filename.endswith('.docx'):
                    file_path = os.path.join(CORRECTIONS_DIR, filename)
                    file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
                    file_size = os.path.getsize(file_path)
                    
                    # Фильтрация по дате
                    if file_mtime >= cutoff_date:
                        date_key = file_mtime.strftime('%Y-%m-%d')
                        
                        files.append({
                            'name': filename,
                            'date': date_key,
                            'size': file_size
                        })
                        
                        # Подсчет по дате
                        if date_key not in file_stats['by_date']:
                            file_stats['by_date'][date_key] = {
                                'count': 0,
                                'size': 0
                            }
                        
                        file_stats['by_date'][date_key]['count'] += 1
                        file_stats['by_date'][date_key]['size'] += file_size
                        
                        # Определение типа файла по имени
                        file_type = 'другое'
                        if 'corrections' in filename.lower():
                            file_type = 'исправления'
                        elif 'corrected' in filename.lower():
                            file_type = 'исправленный'
                        
                        if file_type not in file_stats['file_types']:
                            file_stats['file_types'][file_type] = {
                                'count': 0,
                                'size': 0
                            }
                        
                        file_stats['file_types'][file_type]['count'] += 1
                        file_stats['file_types'][file_type]['size'] += file_size
                        
            # Общая статистика
            file_stats['total_count'] = len(files)
            file_stats['total_size'] = sum(f['size'] for f in files)
            file_stats['avg_size'] = file_stats['total_size'] / len(files) if files else 0
        
        # Статистика по логам
        log_stats = {
            'total_entries': 0,
            'error_count': 0,
            'warning_count': 0,
            'info_count': 0,
            'by_date': {}
        }
        
        # Анализ лог-файла
        log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs', 'app.log')
        if os.path.exists(log_file):
            # Шаблон для разбора строк лога
            log_pattern = re.compile(r'\[(.*?)\]\s+(\w+):')
            
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    match = log_pattern.search(line)
                    if match:
                        try:
                            # Извлекаем дату и уровень лога
                            log_date_str = match.group(1)
                            log_level = match.group(2).lower()
                            
                            # Преобразуем строку даты в объект datetime
                            log_date = datetime.datetime.strptime(log_date_str, '%Y-%m-%d %H:%M:%S')
                            
                            # Фильтрация по дате
                            if log_date >= cutoff_date:
                                date_key = log_date.strftime('%Y-%m-%d')
                                
                                # Подсчет по уровню лога
                                if log_level == 'error':
                                    log_stats['error_count'] += 1
                                elif log_level == 'warning':
                                    log_stats['warning_count'] += 1
                                elif log_level == 'info':
                                    log_stats['info_count'] += 1
                                
                                # Подсчет по дате
                                if date_key not in log_stats['by_date']:
                                    log_stats['by_date'][date_key] = {
                                        'total': 0,
                                        'error': 0,
                                        'warning': 0,
                                        'info': 0
                                    }
                                
                                log_stats['by_date'][date_key]['total'] += 1
                                log_stats['by_date'][date_key][log_level] += 1
                                
                                # Общий счетчик
                                log_stats['total_entries'] += 1
                        except Exception as e:
                            current_app.logger.warning(f"Ошибка при обработке строки лога: {str(e)}")
        
        # Собираем статистику по дням недели
        weekday_stats = {
            'files_by_weekday': {
                'Monday': 0,
                'Tuesday': 0,
                'Wednesday': 0,
                'Thursday': 0,
                'Friday': 0,
                'Saturday': 0,
                'Sunday': 0
            },
            'logs_by_weekday': {
                'Monday': 0,
                'Tuesday': 0,
                'Wednesday': 0,
                'Thursday': 0,
                'Friday': 0,
                'Saturday': 0,
                'Sunday': 0
            }
        }
        
        # Заполняем статистику по дням недели для файлов
        for date_key, data in file_stats['by_date'].items():
            date_obj = datetime.datetime.strptime(date_key, '%Y-%m-%d')
            weekday = date_obj.strftime('%A')
            weekday_stats['files_by_weekday'][weekday] += data['count']
        
        # Заполняем статистику по дням недели для логов
        for date_key, data in log_stats['by_date'].items():
            date_obj = datetime.datetime.strptime(date_key, '%Y-%m-%d')
            weekday = date_obj.strftime('%A')
            weekday_stats['logs_by_weekday'][weekday] += data['total']
        
        # Формируем итоговую статистику
        statistics = {
            'period': {
                'days': days,
                'start_date': cutoff_date.strftime('%Y-%m-%d'),
                'end_date': datetime.datetime.now().strftime('%Y-%m-%d')
            },
            'files': file_stats,
            'logs': log_stats,
            'weekday_stats': weekday_stats
        }
        
        return jsonify({
            'success': True,
            'statistics': statistics
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении статистики: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при получении статистики: {str(e)}'}), 500

@bp.route('/admin/statistics/export', methods=['GET'])
def export_statistics():
    """
    Экспорт статистики использования системы в файл
    """
    try:
        import datetime
        import re
        import os
        import csv
        import io
        
        # Период для статистики (по умолчанию последние 30 дней)
        days = request.args.get('days', 30, type=int)
        export_format = request.args.get('format', 'txt')
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Получаем статистику
        # (Повторяется код из get_statistics() для независимости работы метода)
        
        # Статистика по файлам
        file_stats = {
            'total_count': 0,
            'total_size': 0,
            'avg_size': 0,
            'by_date': {},
            'file_types': {}
        }
        
        # Анализ файлов исправлений
        if os.path.exists(CORRECTIONS_DIR):
            files = []
            for filename in os.listdir(CORRECTIONS_DIR):
                if filename.endswith('.docx'):
                    file_path = os.path.join(CORRECTIONS_DIR, filename)
                    file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
                    file_size = os.path.getsize(file_path)
                    
                    # Фильтрация по дате
                    if file_mtime >= cutoff_date:
                        date_key = file_mtime.strftime('%Y-%m-%d')
                        
                        files.append({
                            'name': filename,
                            'date': date_key,
                            'size': file_size
                        })
                        
                        # Подсчет по дате
                        if date_key not in file_stats['by_date']:
                            file_stats['by_date'][date_key] = {
                                'count': 0,
                                'size': 0
                            }
                        
                        file_stats['by_date'][date_key]['count'] += 1
                        file_stats['by_date'][date_key]['size'] += file_size
                        
                        # Определение типа файла по имени
                        file_type = 'другое'
                        if 'corrections' in filename.lower():
                            file_type = 'исправления'
                        elif 'corrected' in filename.lower():
                            file_type = 'исправленный'
                        
                        if file_type not in file_stats['file_types']:
                            file_stats['file_types'][file_type] = {
                                'count': 0,
                                'size': 0
                            }
                        
                        file_stats['file_types'][file_type]['count'] += 1
                        file_stats['file_types'][file_type]['size'] += file_size
                        
            # Общая статистика
            file_stats['total_count'] = len(files)
            file_stats['total_size'] = sum(f['size'] for f in files)
            file_stats['avg_size'] = file_stats['total_size'] / len(files) if files else 0
        
        # Статистика по логам
        log_stats = {
            'total_entries': 0,
            'error_count': 0,
            'warning_count': 0,
            'info_count': 0,
            'by_date': {}
        }
        
        # Анализ лог-файла
        log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs', 'app.log')
        if os.path.exists(log_file):
            # Шаблон для разбора строк лога
            log_pattern = re.compile(r'\[(.*?)\]\s+(\w+):')
            
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    match = log_pattern.search(line)
                    if match:
                        try:
                            # Извлекаем дату и уровень лога
                            log_date_str = match.group(1)
                            log_level = match.group(2).lower()
                            
                            # Преобразуем строку даты в объект datetime
                            log_date = datetime.datetime.strptime(log_date_str, '%Y-%m-%d %H:%M:%S')
                            
                            # Фильтрация по дате
                            if log_date >= cutoff_date:
                                date_key = log_date.strftime('%Y-%m-%d')
                                
                                # Подсчет по уровню лога
                                if log_level == 'error':
                                    log_stats['error_count'] += 1
                                elif log_level == 'warning':
                                    log_stats['warning_count'] += 1
                                elif log_level == 'info':
                                    log_stats['info_count'] += 1
                                
                                # Подсчет по дате
                                if date_key not in log_stats['by_date']:
                                    log_stats['by_date'][date_key] = {
                                        'total': 0,
                                        'error': 0,
                                        'warning': 0,
                                        'info': 0
                                    }
                                
                                log_stats['by_date'][date_key]['total'] += 1
                                log_stats['by_date'][date_key][log_level] += 1
                                
                                # Общий счетчик
                                log_stats['total_entries'] += 1
                        except Exception as e:
                            current_app.logger.warning(f"Ошибка при обработке строки лога: {str(e)}")
        
        # Статистика по дням недели
        weekday_stats = {
            'files_by_weekday': {
                'Monday': 0,
                'Tuesday': 0,
                'Wednesday': 0,
                'Thursday': 0,
                'Friday': 0,
                'Saturday': 0,
                'Sunday': 0
            },
            'logs_by_weekday': {
                'Monday': 0,
                'Tuesday': 0,
                'Wednesday': 0,
                'Thursday': 0,
                'Friday': 0,
                'Saturday': 0,
                'Sunday': 0
            }
        }
        
        # Заполняем статистику по дням недели для файлов
        for date_key, data in file_stats['by_date'].items():
            date_obj = datetime.datetime.strptime(date_key, '%Y-%m-%d')
            weekday = date_obj.strftime('%A')
            weekday_stats['files_by_weekday'][weekday] += data['count']
        
        # Заполняем статистику по дням недели для логов
        for date_key, data in log_stats['by_date'].items():
            date_obj = datetime.datetime.strptime(date_key, '%Y-%m-%d')
            weekday = date_obj.strftime('%A')
            weekday_stats['logs_by_weekday'][weekday] += data['total']
        
        # Создаем экспорт в выбранном формате
        if export_format == 'csv':
            # CSV формат
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Заголовок отчета
            writer.writerow(['Статистика использования системы', f'Период: последние {days} дней'])
            writer.writerow([f'С {cutoff_date.strftime("%Y-%m-%d")} по {datetime.datetime.now().strftime("%Y-%m-%d")}'])
            writer.writerow([])
            
            # Статистика по файлам
            writer.writerow(['СТАТИСТИКА ПО ФАЙЛАМ'])
            writer.writerow(['Общее количество файлов', file_stats['total_count']])
            writer.writerow(['Общий размер файлов', f"{file_stats['total_size']} байт ({file_stats['total_size'] / 1024 / 1024:.2f} МБ)"])
            writer.writerow(['Средний размер файла', f"{file_stats['avg_size']} байт ({file_stats['avg_size'] / 1024 / 1024:.2f} МБ)"])
            writer.writerow([])
            
            # Распределение по типам файлов
            writer.writerow(['Распределение по типам файлов'])
            for file_type, data in file_stats['file_types'].items():
                writer.writerow([file_type, data['count'], f"{data['size']} байт ({data['size'] / 1024 / 1024:.2f} МБ)"])
            writer.writerow([])
            
            # Распределение по датам
            writer.writerow(['Распределение файлов по датам'])
            writer.writerow(['Дата', 'Количество', 'Размер (байт)', 'Размер (МБ)'])
            for date_key, data in sorted(file_stats['by_date'].items()):
                writer.writerow([date_key, data['count'], data['size'], f"{data['size'] / 1024 / 1024:.2f}"])
            writer.writerow([])
            
            # Статистика по логам
            writer.writerow(['СТАТИСТИКА ПО ЛОГАМ'])
            writer.writerow(['Общее количество записей', log_stats['total_entries']])
            writer.writerow(['Количество ошибок', log_stats['error_count']])
            writer.writerow(['Количество предупреждений', log_stats['warning_count']])
            writer.writerow(['Количество информационных сообщений', log_stats['info_count']])
            writer.writerow([])
            
            # Распределение логов по датам
            writer.writerow(['Распределение логов по датам'])
            writer.writerow(['Дата', 'Всего', 'Ошибки', 'Предупреждения', 'Информация'])
            for date_key, data in sorted(log_stats['by_date'].items()):
                writer.writerow([date_key, data['total'], data['error'], data['warning'], data['info']])
            writer.writerow([])
            
            # Статистика по дням недели
            writer.writerow(['Распределение файлов по дням недели'])
            for day, count in weekday_stats['files_by_weekday'].items():
                writer.writerow([day, count])
            writer.writerow([])
            
            writer.writerow(['Распределение логов по дням недели'])
            for day, count in weekday_stats['logs_by_weekday'].items():
                writer.writerow([day, count])
            
            # Получаем содержимое CSV файла
            csv_content = output.getvalue()
            output.close()
            
            # Отправляем файл на скачивание
            response = current_app.response_class(
                csv_content,
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=statistics_{timestamp}.csv'
                }
            )
            return response
        else:
            # Текстовый формат по умолчанию
            output = io.StringIO()
            
            # Заголовок отчета
            output.write(f"СТАТИСТИКА ИСПОЛЬЗОВАНИЯ СИСТЕМЫ\n")
            output.write(f"Период: последние {days} дней ({cutoff_date.strftime('%Y-%m-%d')} - {datetime.datetime.now().strftime('%Y-%m-%d')})\n")
            output.write("="*50 + "\n\n")
            
            # Статистика по файлам
            output.write("СТАТИСТИКА ПО ФАЙЛАМ\n")
            output.write("-"*30 + "\n")
            output.write(f"Общее количество файлов: {file_stats['total_count']}\n")
            output.write(f"Общий размер файлов: {file_stats['total_size']} байт ({file_stats['total_size'] / 1024 / 1024:.2f} МБ)\n")
            output.write(f"Средний размер файла: {file_stats['avg_size']:.2f} байт ({file_stats['avg_size'] / 1024 / 1024:.2f} МБ)\n\n")
            
            # Распределение по типам файлов
            output.write("Распределение по типам файлов:\n")
            for file_type, data in file_stats['file_types'].items():
                output.write(f"  {file_type}: {data['count']} файлов, {data['size']} байт ({data['size'] / 1024 / 1024:.2f} МБ)\n")
            output.write("\n")
            
            # Распределение по датам
            output.write("Распределение файлов по датам:\n")
            for date_key, data in sorted(file_stats['by_date'].items()):
                output.write(f"  {date_key}: {data['count']} файлов, {data['size']} байт ({data['size'] / 1024 / 1024:.2f} МБ)\n")
            output.write("\n")
            
            # Статистика по логам
            output.write("СТАТИСТИКА ПО ЛОГАМ\n")
            output.write("-"*30 + "\n")
            output.write(f"Общее количество записей: {log_stats['total_entries']}\n")
            output.write(f"Количество ошибок: {log_stats['error_count']}\n")
            output.write(f"Количество предупреждений: {log_stats['warning_count']}\n")
            output.write(f"Количество информационных сообщений: {log_stats['info_count']}\n\n")
            
            # Распределение логов по датам
            output.write("Распределение логов по датам:\n")
            for date_key, data in sorted(log_stats['by_date'].items()):
                output.write(f"  {date_key}: Всего: {data['total']}, Ошибки: {data['error']}, Предупреждения: {data['warning']}, Информация: {data['info']}\n")
            output.write("\n")
            
            # Статистика по дням недели
            output.write("РАСПРЕДЕЛЕНИЕ ПО ДНЯМ НЕДЕЛИ\n")
            output.write("-"*30 + "\n")
            
            output.write("Файлы по дням недели:\n")
            for day, count in weekday_stats['files_by_weekday'].items():
                output.write(f"  {day}: {count} файлов\n")
            output.write("\n")
            
            output.write("Логи по дням недели:\n")
            for day, count in weekday_stats['logs_by_weekday'].items():
                output.write(f"  {day}: {count} записей\n")
            
            # Получаем содержимое текстового файла
            text_content = output.getvalue()
            output.close()
            
            # Отправляем файл на скачивание
            response = current_app.response_class(
                text_content,
                mimetype='text/plain',
                headers={
                    'Content-Disposition': f'attachment; filename=statistics_{timestamp}.txt'
                }
            )
            return response
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при экспорте статистики: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при экспорте статистики: {str(e)}'}), 500

# Константы для системы оповещений
ALERTS_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config', 'alerts.json')

# Структура данных по умолчанию для конфигурации оповещений
DEFAULT_ALERTS_CONFIG = {
    "disk_space": {
        "enabled": True,
        "warning_threshold": 80,  # Порог предупреждения в процентах заполнения диска
        "critical_threshold": 90,  # Критический порог в процентах заполнения диска
        "check_interval": 3600     # Интервал проверки в секундах (1 час)
    },
    "error_rate": {
        "enabled": True,
        "threshold": 10,           # Порог количества ошибок в час
        "window": 3600             # Окно для подсчета ошибок в секундах (1 час)
    },
    "system_load": {
        "enabled": False,
        "threshold": 80,           # Порог нагрузки ЦП в процентах
        "check_interval": 300      # Интервал проверки в секундах (5 минут)
    },
    "memory_usage": {
        "enabled": True,
        "warning_threshold": 80,   # Порог предупреждения в процентах использования памяти
        "critical_threshold": 90,  # Критический порог в процентах использования памяти
        "check_interval": 1800     # Интервал проверки в секундах (30 минут)
    },
    "notifications": {
        "email": {
            "enabled": False,
            "recipients": [],
            "smtp_server": "",
            "smtp_port": 587,
            "smtp_user": "",
            "smtp_password": "",
            "sender": "noreply@example.com"
        },
        "web": {
            "enabled": True,
            "max_notifications": 50  # Максимальное количество хранимых уведомлений
        }
    },
    "last_updated": None,
    "notifications_history": []
}

def get_alerts_config():
    """
    Получение конфигурации оповещений
    """
    import json
    import os
    
    # Создаем директорию config, если она не существует
    config_dir = os.path.dirname(ALERTS_CONFIG_FILE)
    os.makedirs(config_dir, exist_ok=True)
    
    # Если файл конфигурации не существует, создаем его с настройками по умолчанию
    if not os.path.exists(ALERTS_CONFIG_FILE):
        with open(ALERTS_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_ALERTS_CONFIG, f, indent=4)
        return DEFAULT_ALERTS_CONFIG
    
    # Читаем существующую конфигурацию
    try:
        with open(ALERTS_CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        # Проверяем, все ли необходимые настройки присутствуют
        # При необходимости добавляем новые параметры из DEFAULT_ALERTS_CONFIG
        updated = False
        for category, settings in DEFAULT_ALERTS_CONFIG.items():
            if category not in config:
                config[category] = settings
                updated = True
            elif isinstance(settings, dict):
                for key, value in settings.items():
                    if category in config and key not in config[category]:
                        config[category][key] = value
                        updated = True
        
        # Если были добавлены новые параметры, сохраняем обновленную конфигурацию
        if updated:
            with open(ALERTS_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4)
                
        return config
    except Exception as e:
        current_app.logger.error(f"Ошибка при чтении конфигурации оповещений: {str(e)}")
        # Если произошла ошибка, возвращаем настройки по умолчанию
        return DEFAULT_ALERTS_CONFIG

def save_alerts_config(config):
    """
    Сохранение конфигурации оповещений
    """
    import json
    import datetime
    
    # Обновляем дату последнего изменения
    config['last_updated'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Сохраняем конфигурацию
    try:
        with open(ALERTS_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4)
        return True
    except Exception as e:
        current_app.logger.error(f"Ошибка при сохранении конфигурации оповещений: {str(e)}")
        return False

def add_notification(message, level='info', source=None):
    """
    Добавление уведомления в историю
    """
    import datetime
    import json
    
    # Получаем текущую конфигурацию
    config = get_alerts_config()
    
    # Создаем новое уведомление
    notification = {
        'id': str(uuid.uuid4()),
        'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'message': message,
        'level': level,
        'source': source,
        'read': False
    }
    
    # Добавляем уведомление в начало списка
    config['notifications_history'].insert(0, notification)
    
    # Ограничиваем количество хранимых уведомлений
    max_notifications = config['notifications']['web']['max_notifications']
    if len(config['notifications_history']) > max_notifications:
        config['notifications_history'] = config['notifications_history'][:max_notifications]
    
    # Сохраняем обновленную конфигурацию
    save_alerts_config(config)
    
    return notification

@bp.route('/admin/alerts/config', methods=['GET'])
def get_alerts_config_route():
    """
    Получение конфигурации оповещений
    """
    try:
        config = get_alerts_config()
        
        # Скрываем пароль SMTP для безопасности
        if 'notifications' in config and 'email' in config['notifications'] and 'smtp_password' in config['notifications']['email']:
            config_copy = config.copy()
            if config_copy['notifications']['email']['smtp_password']:
                config_copy['notifications']['email']['smtp_password'] = '********'
            else:
                config_copy['notifications']['email']['smtp_password'] = ''
        else:
            config_copy = config
            
        return jsonify({
            'success': True,
            'config': config_copy
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении конфигурации оповещений: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при получении конфигурации оповещений: {str(e)}'}), 500

@bp.route('/admin/alerts/config', methods=['POST'])
def update_alerts_config():
    """
    Обновление конфигурации оповещений
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'Не предоставлены данные для обновления'}), 400
        
        # Получаем текущую конфигурацию
        current_config = get_alerts_config()
        
        # Обновляем конфигурацию
        if 'disk_space' in data:
            current_config['disk_space'].update(data['disk_space'])
            
        if 'error_rate' in data:
            current_config['error_rate'].update(data['error_rate'])
            
        if 'system_load' in data:
            current_config['system_load'].update(data['system_load'])
            
        if 'memory_usage' in data:
            current_config['memory_usage'].update(data['memory_usage'])
            
        if 'notifications' in data:
            if 'email' in data['notifications']:
                # Сохраняем текущий пароль, если новый не предоставлен
                if 'smtp_password' in data['notifications']['email'] and data['notifications']['email']['smtp_password'] == '********':
                    data['notifications']['email']['smtp_password'] = current_config['notifications']['email']['smtp_password']
                
                current_config['notifications']['email'].update(data['notifications']['email'])
                
            if 'web' in data['notifications']:
                current_config['notifications']['web'].update(data['notifications']['web'])
        
        # Сохраняем обновленную конфигурацию
        if save_alerts_config(current_config):
            # Добавляем уведомление об изменении настроек
            add_notification(
                message="Настройки оповещений были обновлены",
                level="info",
                source="system"
            )
            
            return jsonify({
                'success': True,
                'message': 'Конфигурация оповещений успешно обновлена'
            }), 200
        else:
            return jsonify({'error': 'Ошибка при сохранении конфигурации'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Ошибка при обновлении конфигурации оповещений: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при обновлении конфигурации оповещений: {str(e)}'}), 500

@bp.route('/admin/alerts/notifications', methods=['GET'])
def get_notifications():
    """
    Получение списка уведомлений
    """
    try:
        # Получаем параметры запроса
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Получаем конфигурацию с уведомлениями
        config = get_alerts_config()
        notifications = config.get('notifications_history', [])
        
        # Фильтруем уведомления
        if unread_only:
            notifications = [n for n in notifications if not n.get('read', False)]
        
        # Получаем общее количество уведомлений
        total_count = len(notifications)
        
        # Применяем пагинацию
        notifications = notifications[offset:offset + limit]
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'total_count': total_count,
            'unread_count': len([n for n in config.get('notifications_history', []) if not n.get('read', False)])
        }), 200
    except Exception as e:
        current_app.logger.error(f"Ошибка при получении уведомлений: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при получении уведомлений: {str(e)}'}), 500

@bp.route('/admin/alerts/notifications/<notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """
    Отметка уведомления как прочитанного
    """
    try:
        # Получаем конфигурацию с уведомлениями
        config = get_alerts_config()
        
        # Ищем уведомление по ID
        for notification in config.get('notifications_history', []):
            if notification.get('id') == notification_id:
                notification['read'] = True
                
                # Сохраняем обновленную конфигурацию
                if save_alerts_config(config):
                    return jsonify({
                        'success': True,
                        'message': 'Уведомление отмечено как прочитанное'
                    }), 200
                else:
                    return jsonify({'error': 'Ошибка при сохранении конфигурации'}), 500
        
        return jsonify({'error': 'Уведомление не найдено'}), 404
    except Exception as e:
        current_app.logger.error(f"Ошибка при отметке уведомления как прочитанного: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при отметке уведомления как прочитанного: {str(e)}'}), 500

@bp.route('/admin/alerts/notifications/read-all', methods=['POST'])
def mark_all_notifications_read():
    """
    Отметка всех уведомлений как прочитанных
    """
    try:
        # Получаем конфигурацию с уведомлениями
        config = get_alerts_config()
        
        # Отмечаем все уведомления как прочитанные
        for notification in config.get('notifications_history', []):
            notification['read'] = True
            
        # Сохраняем обновленную конфигурацию
        if save_alerts_config(config):
            return jsonify({
                'success': True,
                'message': 'Все уведомления отмечены как прочитанные'
            }), 200
        else:
            return jsonify({'error': 'Ошибка при сохранении конфигурации'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Ошибка при отметке всех уведомлений как прочитанных: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при отметке всех уведомлений как прочитанных: {str(e)}'}), 500

@bp.route('/admin/alerts/notifications/clear', methods=['POST'])
def clear_notifications():
    """
    Очистка всех уведомлений
    """
    try:
        # Получаем конфигурацию
        config = get_alerts_config()
        
        # Очищаем список уведомлений
        config['notifications_history'] = []
        
        # Сохраняем обновленную конфигурацию
        if save_alerts_config(config):
            return jsonify({
                'success': True,
                'message': 'Все уведомления удалены'
            }), 200
        else:
            return jsonify({'error': 'Ошибка при сохранении конфигурации'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Ошибка при очистке уведомлений: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при очистке уведомлений: {str(e)}'}), 500

@bp.route('/admin/alerts/test', methods=['POST'])
def test_alerts():
    """
    Тестирование системы оповещений
    """
    try:
        alert_type = request.json.get('type', 'web')
        
        if alert_type == 'web':
            # Создаем тестовое уведомление
            notification = add_notification(
                message="Это тестовое уведомление",
                level="info",
                source="test"
            )
            
            return jsonify({
                'success': True,
                'message': 'Тестовое уведомление создано',
                'notification': notification
            }), 200
            
        elif alert_type == 'email':
            # Получаем конфигурацию
            config = get_alerts_config()
            email_config = config.get('notifications', {}).get('email', {})
            
            if not email_config.get('enabled', False):
                return jsonify({'error': 'Оповещения по электронной почте отключены'}), 400
                
            # Проверяем настройки SMTP
            required_fields = ['smtp_server', 'smtp_port', 'smtp_user', 'smtp_password', 'sender', 'recipients']
            for field in required_fields:
                if not email_config.get(field):
                    return jsonify({'error': f'Не указано поле {field} в настройках SMTP'}), 400
                    
            # Отправляем тестовое письмо
            try:
                import smtplib
                from email.mime.text import MIMEText
                from email.mime.multipart import MIMEMultipart
                
                # Создаем сообщение
                message = MIMEMultipart()
                message['From'] = email_config['sender']
                message['To'] = ', '.join(email_config['recipients'])
                message['Subject'] = 'Тестовое уведомление CURSA'
                
                # Тело письма
                body = """
                Это тестовое уведомление от системы CURSA.
                
                Если вы получили это сообщение, значит настройки SMTP сервера корректны.
                
                С уважением,
                Система CURSA
                """
                
                message.attach(MIMEText(body, 'plain'))
                
                # Подключаемся к SMTP серверу
                with smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port']) as server:
                    server.starttls()  # Шифрование соединения
                    server.login(email_config['smtp_user'], email_config['smtp_password'])
                    server.send_message(message)
                
                # Добавляем уведомление об успешной отправке
                add_notification(
                    message=f"Тестовое письмо успешно отправлено на адреса: {', '.join(email_config['recipients'])}",
                    level="info",
                    source="email_test"
                )
                
                return jsonify({
                    'success': True,
                    'message': 'Тестовое письмо успешно отправлено'
                }), 200
                
            except Exception as mail_error:
                error_message = str(mail_error)
                
                # Добавляем уведомление об ошибке
                add_notification(
                    message=f"Ошибка при отправке тестового письма: {error_message}",
                    level="error",
                    source="email_test"
                )
                
                return jsonify({
                    'success': False,
                    'error': f'Ошибка при отправке тестового письма: {error_message}'
                }), 500
        else:
            return jsonify({'error': f'Неизвестный тип оповещения: {alert_type}'}), 400
            
    except Exception as e:
        current_app.logger.error(f"Ошибка при тестировании системы оповещений: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при тестировании системы оповещений: {str(e)}'}), 500

@bp.route('/admin/alerts/check', methods=['POST'])
def check_alerts():
    """
    Ручная проверка системы на наличие проблем
    """
    try:
        import platform
        import psutil
        import datetime
        
        # Получаем конфигурацию оповещений
        config = get_alerts_config()
        alerts_triggered = []
        
        # Проверка свободного места на дисках
        if config['disk_space']['enabled']:
            for partition in psutil.disk_partitions():
                if partition.mountpoint:
                    try:
                        usage = psutil.disk_usage(partition.mountpoint)
                        
                        # Проверяем на критический уровень
                        if usage.percent >= config['disk_space']['critical_threshold']:
                            message = f"Критическое заполнение диска {partition.mountpoint}: {usage.percent}% использовано"
                            alerts_triggered.append({
                                'type': 'disk_space',
                                'level': 'critical',
                                'message': message
                            })
                            
                            # Добавляем уведомление
                            add_notification(
                                message=message,
                                level="error",
                                source="disk_check"
                            )
                            
                        # Проверяем на уровень предупреждения
                        elif usage.percent >= config['disk_space']['warning_threshold']:
                            message = f"Предупреждение о заполнении диска {partition.mountpoint}: {usage.percent}% использовано"
                            alerts_triggered.append({
                                'type': 'disk_space',
                                'level': 'warning',
                                'message': message
                            })
                            
                            # Добавляем уведомление
                            add_notification(
                                message=message,
                                level="warning",
                                source="disk_check"
                            )
                            
                    except Exception as disk_error:
                        current_app.logger.error(f"Ошибка при проверке диска {partition.mountpoint}: {str(disk_error)}")
        
        # Проверка использования памяти
        if config['memory_usage']['enabled']:
            memory = psutil.virtual_memory()
            
            # Проверяем на критический уровень
            if memory.percent >= config['memory_usage']['critical_threshold']:
                message = f"Критическое использование памяти: {memory.percent}%"
                alerts_triggered.append({
                    'type': 'memory_usage',
                    'level': 'critical',
                    'message': message
                })
                
                # Добавляем уведомление
                add_notification(
                    message=message,
                    level="error",
                    source="memory_check"
                )
                
            # Проверяем на уровень предупреждения
            elif memory.percent >= config['memory_usage']['warning_threshold']:
                message = f"Предупреждение об использовании памяти: {memory.percent}%"
                alerts_triggered.append({
                    'type': 'memory_usage',
                    'level': 'warning',
                    'message': message
                })
                
                # Добавляем уведомление
                add_notification(
                    message=message,
                    level="warning",
                    source="memory_check"
                )
        
        # Проверка нагрузки на ЦП
        if config['system_load']['enabled']:
            cpu_percent = psutil.cpu_percent(interval=1)
            
            if cpu_percent >= config['system_load']['threshold']:
                message = f"Высокая нагрузка на ЦП: {cpu_percent}%"
                alerts_triggered.append({
                    'type': 'system_load',
                    'level': 'warning',
                    'message': message
                })
                
                # Добавляем уведомление
                add_notification(
                    message=message,
                    level="warning",
                    source="cpu_check"
                )
        
        # Проверка частоты ошибок в логах
        if config['error_rate']['enabled']:
            try:
                import re
                from datetime import datetime, timedelta
                
                log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs', 'app.log')
                
                if os.path.exists(log_file):
                    # Определяем период времени для проверки
                    window_seconds = config['error_rate']['window']
                    cutoff_time = datetime.now() - timedelta(seconds=window_seconds)
                    
                    # Шаблон для поиска ошибок в логах
                    error_pattern = re.compile(r'\[(.*?)\]\s+ERROR:')
                    error_count = 0
                    
                    with open(log_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            match = error_pattern.search(line)
                            if match:
                                try:
                                    # Извлекаем дату
                                    log_date_str = match.group(1)
                                    log_date = datetime.strptime(log_date_str, '%Y-%m-%d %H:%M:%S')
                                    
                                    # Проверяем, входит ли дата в интересующий нас период
                                    if log_date >= cutoff_time:
                                        error_count += 1
                                        
                                except Exception:
                                    pass
                    
                    # Проверяем количество ошибок
                    if error_count >= config['error_rate']['threshold']:
                        message = f"Повышенная частота ошибок: {error_count} ошибок за последние {window_seconds/3600:.1f} часов"
                        alerts_triggered.append({
                            'type': 'error_rate',
                            'level': 'warning',
                            'message': message
                        })
                        
                        # Добавляем уведомление
                        add_notification(
                            message=message,
                            level="warning",
                            source="error_rate_check"
                        )
            except Exception as log_error:
                current_app.logger.error(f"Ошибка при проверке частоты ошибок: {str(log_error)}")
        
        # Если проблем не обнаружено
        if not alerts_triggered:
            add_notification(
                message="Проверка системы завершена. Проблем не обнаружено.",
                level="info",
                source="system_check"
            )
        
        return jsonify({
            'success': True,
            'alerts_triggered': alerts_triggered,
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Ошибка при проверке системы: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при проверке системы: {str(e)}'}), 500 

@bp.route('/generate-report', methods=['POST'])
def generate_report():
    """
    Генерирует отчет о проверке документа в формате DOCX
    """
    current_app.logger.info("Получен запрос на генерацию отчета")
    data = request.json
    
    if not data or 'check_results' not in data:
        current_app.logger.error("Отсутствуют данные результатов проверки")
        return jsonify({'error': 'Необходимо указать результаты проверки'}), 400
    
    try:
        # Получаем имя исходного файла
        file_name = data.get('filename', 'document.docx')
        current_app.logger.info(f"Генерация отчета для файла: {file_name}")
        
        # Создаем процессор документов и генерируем отчет
        processor = DocumentProcessor(file_path=None)
        report_path = processor.generate_report_document(data['check_results'], file_name)
        
        current_app.logger.info(f"Отчет успешно сгенерирован, путь: {report_path}")
        
        if report_path:
            # Формируем полный путь к файлу отчета
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            full_path = os.path.join(base_dir, report_path.lstrip('/'))
            
            # Проверяем, что файл создан
            if os.path.exists(full_path):
                current_app.logger.info(f"Файл отчета существует, размер: {os.path.getsize(full_path)} байт")
                
                # Создаем имя для скачивания
                original_name = os.path.splitext(file_name)[0]
                download_filename = f"report_{original_name}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
                
                return jsonify({
                    'success': True,
                    'report_file_path': report_path,
                    'filename': download_filename
                }), 200
            else:
                current_app.logger.error(f"Файл отчета не найден: {full_path}")
                return jsonify({'error': 'Файл отчета не был создан'}), 500
        else:
            current_app.logger.error("Ошибка при генерации отчета")
            return jsonify({'error': 'Ошибка при генерации отчета'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Ошибка при генерации отчета: {type(e).__name__}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Ошибка при генерации отчета: {str(e)}'}), 500

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