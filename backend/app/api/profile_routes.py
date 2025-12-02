from flask import Blueprint, jsonify, request, current_app, Response
import os
import json
import copy
import re
import shutil
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Dict, Any, Optional, List, Tuple

bp = Blueprint('profiles', __name__, url_prefix='/api/profiles')

# Директория для хранения профилей
PROFILES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'profiles')

# Директория для истории версий
HISTORY_DIR = os.path.join(PROFILES_DIR, '.history')

# Максимальное количество версий в истории
MAX_HISTORY_VERSIONS = 10

# Системные профили (нельзя редактировать/удалять)
SYSTEM_PROFILES = ['default_gost', 'gost_7_32_2017', 'gost_r_7_0_100_2018']

# Максимальная глубина наследования
MAX_INHERITANCE_DEPTH = 5

# Кэш для профилей (сбрасывается при изменениях)
_profile_cache_version = 0


def _get_cache_key() -> int:
    """Возвращает текущую версию кэша"""
    return _profile_cache_version


def invalidate_profile_cache() -> None:
    """Сбрасывает кэш профилей при изменениях"""
    global _profile_cache_version
    _profile_cache_version += 1
    # Очищаем lru_cache
    load_profile_cached.cache_clear()
    list_profiles_cached.cache_clear()


@lru_cache(maxsize=64)
def load_profile_cached(profile_id: str, cache_version: int) -> Dict[str, Any]:
    """
    Загружает профиль с диска с кэшированием.
    cache_version используется для инвалидации кэша.
    """
    profile_path = os.path.join(PROFILES_DIR, f"{sanitize_profile_id(profile_id)}.json")
    
    if not os.path.exists(profile_path):
        raise FileNotFoundError(f"Профиль '{profile_id}' не найден")
    
    with open(profile_path, 'r', encoding='utf-8') as f:
        return json.load(f)


@lru_cache(maxsize=8)
def list_profiles_cached(cache_version: int, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Кэшированный список профилей"""
    profiles = []
    
    if not os.path.exists(PROFILES_DIR):
        return []
        
    for filename in os.listdir(PROFILES_DIR):
        if filename.endswith('.json'):
            try:
                profile_id = filename.replace('.json', '')
                data = load_profile_cached(profile_id, cache_version)
                
                profile_category = data.get('category', 'custom')
                
                # Фильтрация по категории
                if category and profile_category != category:
                    continue
                
                profiles.append({
                    'id': profile_id,
                    'name': data.get('name', filename),
                    'description': data.get('description', ''),
                    'category': profile_category,
                    'version': data.get('version', ''),
                    'is_system': data.get('is_system', profile_id in SYSTEM_PROFILES),
                    'extends': data.get('extends'),
                    'university': data.get('university', {}).get('short_name') if data.get('university') else None
                })
            except Exception:
                pass
    
    # Сортировка: системные профили первыми, затем по имени
    profiles.sort(key=lambda x: (not x.get('is_system', False), x.get('name', '')))
    
    return profiles


def sanitize_profile_id(profile_id):
    """Очищает ID профиля от недопустимых символов"""
    return re.sub(r'[^a-zA-Z0-9_-]', '_', str(profile_id))


def save_profile_version(profile_id, data):
    """Сохраняет версию профиля в историю"""
    os.makedirs(HISTORY_DIR, exist_ok=True)
    
    profile_history_dir = os.path.join(HISTORY_DIR, profile_id)
    os.makedirs(profile_history_dir, exist_ok=True)
    
    # Генерируем имя файла с timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    version_file = os.path.join(profile_history_dir, f"{timestamp}.json")
    
    # Добавляем метаданные версии
    version_data = copy.deepcopy(data)
    version_data['_version_timestamp'] = datetime.now().isoformat()
    
    with open(version_file, 'w', encoding='utf-8') as f:
        json.dump(version_data, f, ensure_ascii=False, indent=4)
    
    # Очищаем старые версии
    cleanup_old_versions(profile_id)


def cleanup_old_versions(profile_id):
    """Удаляет старые версии, оставляя только MAX_HISTORY_VERSIONS последних"""
    profile_history_dir = os.path.join(HISTORY_DIR, profile_id)
    if not os.path.exists(profile_history_dir):
        return
    
    versions = sorted([f for f in os.listdir(profile_history_dir) if f.endswith('.json')])
    
    while len(versions) > MAX_HISTORY_VERSIONS:
        oldest = versions.pop(0)
        os.remove(os.path.join(profile_history_dir, oldest))


def get_profile_versions(profile_id):
    """Получает список версий профиля"""
    profile_history_dir = os.path.join(HISTORY_DIR, profile_id)
    if not os.path.exists(profile_history_dir):
        return []
    
    versions = []
    for filename in sorted(os.listdir(profile_history_dir), reverse=True):
        if filename.endswith('.json'):
            filepath = os.path.join(profile_history_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                versions.append({
                    'timestamp': data.get('_version_timestamp', filename.replace('.json', '')),
                    'filename': filename,
                    'name': data.get('name'),
                    'version': data.get('version')
                })
            except:
                pass
    
    return versions


def validate_profile_rules(rules, strict=False):
    """Полная валидация правил профиля"""
    issues = []
    warnings = []
    info = []
    
    # Проверка шрифта
    font = rules.get('font', {})
    if not font.get('name'):
        issues.append({'field': 'font.name', 'message': 'Не указано название шрифта', 'severity': 'error'})
    elif font.get('name') not in ['Times New Roman', 'Arial', 'Calibri', 'PT Serif', 'Liberation Serif']:
        warnings.append({'field': 'font.name', 'message': f"Шрифт '{font.get('name')}' может не поддерживаться", 'severity': 'warning'})
    
    font_size = font.get('size', 0)
    if not font_size or font_size <= 0:
        issues.append({'field': 'font.size', 'message': 'Некорректный размер шрифта', 'severity': 'error'})
    elif font_size < 10 or font_size > 16:
        warnings.append({'field': 'font.size', 'message': f"Необычный размер шрифта: {font_size} пт", 'severity': 'warning'})
    
    # Проверка полей страницы
    margins = rules.get('margins', {})
    for side in ['left', 'right', 'top', 'bottom']:
        value = margins.get(side)
        if value is None:
            issues.append({'field': f'margins.{side}', 'message': f'Не указано поле: {side}', 'severity': 'error'})
        elif value < 0:
            issues.append({'field': f'margins.{side}', 'message': f'Отрицательное значение поля: {side}', 'severity': 'error'})
        elif value < 1 or value > 5:
            warnings.append({'field': f'margins.{side}', 'message': f"Необычное значение поля {side}: {value} см", 'severity': 'warning'})
    
    # ГОСТ требования к полям
    if margins.get('left', 0) < 2.5:
        info.append({'field': 'margins.left', 'message': 'ГОСТ рекомендует левое поле минимум 2.5 см для подшивки', 'severity': 'info'})
    
    # Проверка межстрочного интервала
    line_spacing = rules.get('line_spacing')
    if line_spacing is None or line_spacing <= 0:
        issues.append({'field': 'line_spacing', 'message': 'Некорректный межстрочный интервал', 'severity': 'error'})
    elif line_spacing not in [1.0, 1.15, 1.5, 2.0]:
        warnings.append({'field': 'line_spacing', 'message': f"Нестандартный межстрочный интервал: {line_spacing}", 'severity': 'warning'})
    
    # Проверка отступа первой строки
    first_line_indent = rules.get('first_line_indent')
    if first_line_indent is not None:
        if first_line_indent < 0:
            issues.append({'field': 'first_line_indent', 'message': 'Отрицательный отступ первой строки', 'severity': 'error'})
        elif first_line_indent < 1.0 or first_line_indent > 1.5:
            info.append({'field': 'first_line_indent', 'message': f"ГОСТ рекомендует отступ 1.25 см, указано {first_line_indent} см", 'severity': 'info'})
    
    # Проверка заголовков
    headings = rules.get('headings', {})
    for level in ['h1', 'h2', 'h3']:
        h = headings.get(level, {})
        h_size = h.get('font_size')
        if h_size and (h_size < 8 or h_size > 24):
            warnings.append({'field': f'headings.{level}.font_size', 'message': f"Необычный размер шрифта для {level}: {h_size} пт", 'severity': 'warning'})
    
    # Проверка библиографии
    bibliography = rules.get('bibliography', {})
    if bibliography:
        min_sources = bibliography.get('min_sources')
        if min_sources and min_sources < 5:
            warnings.append({'field': 'bibliography.min_sources', 'message': f"Малое количество минимальных источников: {min_sources}", 'severity': 'warning'})
        
        max_age = bibliography.get('max_age_years')
        if max_age and max_age > 10:
            info.append({'field': 'bibliography.max_age_years', 'message': f"Большой допустимый возраст источников: {max_age} лет", 'severity': 'info'})
    
    # Проверка обязательных разделов
    required_sections = rules.get('required_sections', [])
    if not required_sections:
        warnings.append({'field': 'required_sections', 'message': 'Не указаны обязательные разделы', 'severity': 'warning'})
    else:
        # Проверяем наличие стандартных разделов
        standard_sections = {'введение', 'заключение', 'список литературы', 'список источников'}
        missing_standard = standard_sections - set(s.lower() for s in required_sections)
        if missing_standard:
            info.append({'field': 'required_sections', 'message': f"Отсутствуют типичные разделы: {', '.join(missing_standard)}", 'severity': 'info'})
    
    return {
        'issues': issues,
        'warnings': warnings,
        'info': info,
        'valid': len(issues) == 0,
        'score': max(0, 100 - len(issues) * 20 - len(warnings) * 5)
    }


def deep_merge(base, override):
    """Рекурсивно объединяет два словаря"""
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def load_profile_with_inheritance(profile_id, depth=0, visited=None):
    """Загружает профиль с применением наследования (с кэшированием)"""
    if visited is None:
        visited = set()
    
    if depth > MAX_INHERITANCE_DEPTH:
        raise ValueError(f"Превышена максимальная глубина наследования ({MAX_INHERITANCE_DEPTH})")
    
    if profile_id in visited:
        raise ValueError(f"Обнаружено циклическое наследование: {profile_id}")
    
    visited.add(profile_id)
    
    # Используем кэшированную функцию для загрузки с диска
    cache_version = _get_cache_key()
    profile_data = copy.deepcopy(load_profile_cached(profile_id, cache_version))
    
    # Если есть наследование, загружаем родительский профиль
    parent_id = profile_data.get('extends')
    
    if parent_id:
        parent_data = load_profile_with_inheritance(parent_id, depth + 1, visited)
        merged = deep_merge(parent_data, profile_data)
        merged['_inheritance_chain'] = parent_data.get('_inheritance_chain', [parent_id]) + [profile_id]
        return merged
    else:
        profile_data['_inheritance_chain'] = [profile_id]
        return profile_data


@bp.route('/', methods=['GET'])
def list_profiles():
    """List all available norm control profiles (с кэшированием)"""
    category = request.args.get('category')  # gost, university, custom
    
    if not os.path.exists(PROFILES_DIR):
        return jsonify([]), 200
    
    # Используем кэшированный список
    cache_version = _get_cache_key()
    profiles = list_profiles_cached(cache_version, category)
    
    return jsonify(profiles)


@bp.route('/categories', methods=['GET'])
def list_categories():
    """Get list of profile categories with counts"""
    categories = {
        'gost': {'name': 'Стандарты ГОСТ', 'count': 0},
        'university': {'name': 'Требования вузов', 'count': 0},
        'custom': {'name': 'Пользовательские', 'count': 0}
    }
    
    if os.path.exists(PROFILES_DIR):
        for filename in os.listdir(PROFILES_DIR):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(PROFILES_DIR, filename), 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        cat = data.get('category', 'custom')
                        if cat in categories:
                            categories[cat]['count'] += 1
                except:
                    pass
    
    return jsonify(categories)


@bp.route('/<profile_id>', methods=['GET'])
def get_profile(profile_id):
    """Get details of a specific profile with inheritance resolved"""
    resolve_inheritance = request.args.get('resolve', 'true').lower() == 'true'
    
    try:
        if resolve_inheritance:
            data = load_profile_with_inheritance(profile_id)
        else:
            profile_path = os.path.join(PROFILES_DIR, f"{sanitize_profile_id(profile_id)}.json")
            if not os.path.exists(profile_path):
                return jsonify({'error': 'Profile not found'}), 404
            with open(profile_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        
        data['id'] = profile_id
        data['is_system'] = data.get('is_system', profile_id in SYSTEM_PROFILES)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({'error': 'Profile not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>/rules', methods=['GET'])
def get_profile_rules(profile_id):
    """Get only the rules section of a profile (resolved with inheritance)"""
    try:
        data = load_profile_with_inheritance(profile_id)
        return jsonify({
            'id': profile_id,
            'name': data.get('name'),
            'rules': data.get('rules', {}),
            'bibliography': data.get('bibliography', {}),
            'validation': data.get('validation', {})
        })
    except FileNotFoundError:
        return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/', methods=['POST'])
def create_profile():
    """Create a new custom profile"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    profile_id = data.get('id')
    if not profile_id:
        # Генерируем ID из имени
        name = data.get('name', 'custom_profile')
        profile_id = sanitize_profile_id(name.lower().replace(' ', '_'))
    else:
        profile_id = sanitize_profile_id(profile_id)
    
    # Проверяем, что профиль не существует
    profile_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    if os.path.exists(profile_path):
        return jsonify({'error': 'Profile already exists'}), 409
    
    # Устанавливаем метаданные
    data['category'] = data.get('category', 'custom')
    data['is_system'] = False
    data['created_at'] = datetime.now().isoformat()
    data['version'] = data.get('version', '1.0')
    
    # Если наследуется от другого профиля, проверяем его существование
    if data.get('extends'):
        parent_path = os.path.join(PROFILES_DIR, f"{sanitize_profile_id(data['extends'])}.json")
        if not os.path.exists(parent_path):
            return jsonify({'error': f"Parent profile '{data['extends']}' not found"}), 400
    
    # Если нет наследования и нет rules, используем default_gost как базу
    if not data.get('extends') and not data.get('rules'):
        data['extends'] = 'default_gost'
    
    try:
        os.makedirs(PROFILES_DIR, exist_ok=True)
        with open(profile_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        # Сбрасываем кэш после создания профиля
        invalidate_profile_cache()
        
        return jsonify({
            'success': True,
            'id': profile_id,
            'message': 'Profile created successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>', methods=['PUT'])
def update_profile(profile_id):
    """Update an existing profile"""
    profile_id = sanitize_profile_id(profile_id)
    
    # Проверяем, что это не системный профиль
    if profile_id in SYSTEM_PROFILES:
        return jsonify({'error': 'Cannot modify system profiles'}), 403
    
    profile_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    if not os.path.exists(profile_path):
        return jsonify({'error': 'Profile not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Загружаем существующий профиль
        with open(profile_path, 'r', encoding='utf-8') as f:
            existing = json.load(f)
        
        # Сохраняем версию в историю
        save_profile_version(profile_id, existing)
        
        # Обновляем данные
        existing.update(data)
        existing['updated_at'] = datetime.now().isoformat()
        existing['is_system'] = False  # Нельзя сделать профиль системным
        
        # Увеличиваем версию
        current_version = existing.get('version', '1.0')
        try:
            major, minor = current_version.split('.')
            existing['version'] = f"{major}.{int(minor) + 1}"
        except:
            existing['version'] = '1.1'
        
        with open(profile_path, 'w', encoding='utf-8') as f:
            json.dump(existing, f, ensure_ascii=False, indent=4)
        
        # Сбрасываем кэш после обновления профиля
        invalidate_profile_cache()
        
        return jsonify({
            'success': True,
            'id': profile_id,
            'version': existing['version'],
            'message': 'Profile updated successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>', methods=['DELETE'])
def delete_profile(profile_id):
    """Delete a custom profile"""
    profile_id = sanitize_profile_id(profile_id)
    
    # Проверяем, что это не системный профиль
    if profile_id in SYSTEM_PROFILES:
        return jsonify({'error': 'Cannot delete system profiles'}), 403
    
    profile_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    if not os.path.exists(profile_path):
        return jsonify({'error': 'Profile not found'}), 404
    
    # Проверяем, не наследуется ли от этого профиля другой
    for filename in os.listdir(PROFILES_DIR):
        if filename.endswith('.json') and filename != f"{profile_id}.json":
            try:
                with open(os.path.join(PROFILES_DIR, filename), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('extends') == profile_id:
                        return jsonify({
                            'error': f"Cannot delete: profile '{filename.replace('.json', '')}' inherits from this profile"
                        }), 409
            except:
                pass
    
    try:
        os.remove(profile_path)
        
        # Сбрасываем кэш после удаления профиля
        invalidate_profile_cache()
        
        return jsonify({
            'success': True,
            'message': 'Profile deleted successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>/duplicate', methods=['POST'])
def duplicate_profile(profile_id):
    """Create a copy of an existing profile"""
    try:
        source_data = load_profile_with_inheritance(profile_id)
    except FileNotFoundError:
        return jsonify({'error': 'Profile not found'}), 404
    
    data = request.get_json() or {}
    new_name = data.get('name', f"{source_data.get('name', profile_id)} (копия)")
    new_id = sanitize_profile_id(data.get('id', f"{profile_id}_copy"))
    
    # Проверяем, что новый ID не занят
    new_path = os.path.join(PROFILES_DIR, f"{new_id}.json")
    counter = 1
    while os.path.exists(new_path):
        new_id = f"{sanitize_profile_id(profile_id)}_copy_{counter}"
        new_path = os.path.join(PROFILES_DIR, f"{new_id}.json")
        counter += 1
    
    # Создаем копию
    new_data = copy.deepcopy(source_data)
    new_data['name'] = new_name
    new_data['category'] = 'custom'
    new_data['is_system'] = False
    new_data['created_at'] = datetime.now().isoformat()
    new_data['copied_from'] = profile_id
    
    # Удаляем служебные поля
    new_data.pop('_inheritance_chain', None)
    new_data.pop('id', None)
    
    try:
        with open(new_path, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, ensure_ascii=False, indent=4)
        
        # Сбрасываем кэш после дублирования профиля
        invalidate_profile_cache()
        
        return jsonify({
            'success': True,
            'id': new_id,
            'name': new_name,
            'message': 'Profile duplicated successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/compare', methods=['GET'])
def compare_profiles():
    """Compare two profiles side by side"""
    profile1_id = request.args.get('profile1')
    profile2_id = request.args.get('profile2')
    
    if not profile1_id or not profile2_id:
        return jsonify({'error': 'Both profile1 and profile2 are required'}), 400
    
    try:
        data1 = load_profile_with_inheritance(profile1_id)
        data2 = load_profile_with_inheritance(profile2_id)
        
        # Находим различия в правилах
        differences = []
        
        def compare_dicts(d1, d2, path=''):
            all_keys = set(d1.keys()) | set(d2.keys())
            for key in all_keys:
                current_path = f"{path}.{key}" if path else key
                v1 = d1.get(key)
                v2 = d2.get(key)
                
                if isinstance(v1, dict) and isinstance(v2, dict):
                    compare_dicts(v1, v2, current_path)
                elif v1 != v2:
                    differences.append({
                        'path': current_path,
                        'profile1_value': v1,
                        'profile2_value': v2
                    })
        
        compare_dicts(data1.get('rules', {}), data2.get('rules', {}), 'rules')
        
        return jsonify({
            'profile1': {'id': profile1_id, 'name': data1.get('name')},
            'profile2': {'id': profile2_id, 'name': data2.get('name')},
            'differences': differences,
            'total_differences': len(differences)
        })
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>/export', methods=['GET'])
def export_profile(profile_id):
    """Export a profile as JSON file"""
    resolve_inheritance = request.args.get('resolve', 'false').lower() == 'true'
    
    try:
        if resolve_inheritance:
            data = load_profile_with_inheritance(profile_id)
            # Удаляем служебные поля
            data.pop('_inheritance_chain', None)
            data['exported_from'] = profile_id
            data['exported_at'] = datetime.now().isoformat()
            data['extends'] = None  # Раскрытое наследование не нуждается в extends
        else:
            profile_path = os.path.join(PROFILES_DIR, f"{sanitize_profile_id(profile_id)}.json")
            if not os.path.exists(profile_path):
                return jsonify({'error': 'Profile not found'}), 404
            with open(profile_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        
        # Возвращаем как скачиваемый файл
        from flask import Response
        
        response = Response(
            json.dumps(data, ensure_ascii=False, indent=2),
            mimetype='application/json',
            headers={
                'Content-Disposition': f'attachment; filename=profile_{profile_id}.json'
            }
        )
        return response
    except FileNotFoundError:
        return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/import', methods=['POST'])
def import_profile():
    """Import a profile from JSON"""
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        try:
            data = json.load(file)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON file'}), 400
    else:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
    
    # Валидация обязательных полей
    if not data.get('name'):
        return jsonify({'error': 'Profile name is required'}), 400
    
    if not data.get('rules'):
        return jsonify({'error': 'Profile rules are required'}), 400
    
    # Генерируем ID
    base_id = sanitize_profile_id(data.get('id', data['name'].lower().replace(' ', '_')))
    profile_id = base_id
    profile_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    
    # Проверяем уникальность ID
    counter = 1
    while os.path.exists(profile_path):
        profile_id = f"{base_id}_{counter}"
        profile_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
        counter += 1
    
    # Устанавливаем метаданные
    data['category'] = data.get('category', 'custom')
    data['is_system'] = False
    data['imported_at'] = datetime.now().isoformat()
    data['version'] = data.get('version', '1.0')
    
    # Проверяем родительский профиль, если указан
    if data.get('extends'):
        parent_path = os.path.join(PROFILES_DIR, f"{sanitize_profile_id(data['extends'])}.json")
        if not os.path.exists(parent_path):
            # Удаляем ссылку на несуществующий профиль
            data['extends'] = None
            data['import_warning'] = f"Parent profile '{data.get('extends')}' not found, inheritance removed"
    
    # Удаляем служебные поля экспорта
    data.pop('exported_from', None)
    data.pop('exported_at', None)
    data.pop('id', None)
    
    try:
        os.makedirs(PROFILES_DIR, exist_ok=True)
        with open(profile_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        # Сбрасываем кэш после импорта профиля
        invalidate_profile_cache()
        
        return jsonify({
            'success': True,
            'id': profile_id,
            'name': data['name'],
            'message': 'Profile imported successfully',
            'warning': data.get('import_warning')
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>/validate', methods=['POST'])
def validate_profile(profile_id):
    """Validate a profile and check for issues"""
    try:
        data = load_profile_with_inheritance(profile_id)
    except FileNotFoundError:
        return jsonify({'error': 'Profile not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e), 'valid': False}), 400
    
    issues = []
    warnings = []
    
    rules = data.get('rules', {})
    
    # Проверка шрифта
    font = rules.get('font', {})
    if not font.get('name'):
        issues.append('Не указано название шрифта')
    if not font.get('size') or font.get('size', 0) <= 0:
        issues.append('Некорректный размер шрифта')
    elif font.get('size') < 10 or font.get('size') > 16:
        warnings.append(f"Необычный размер шрифта: {font.get('size')} пт")
    
    # Проверка полей
    margins = rules.get('margins', {})
    for side in ['left', 'right', 'top', 'bottom']:
        value = margins.get(side)
        if value is None or value < 0:
            issues.append(f'Некорректное значение поля: {side}')
        elif value < 1 or value > 5:
            warnings.append(f"Необычное значение поля {side}: {value} см")
    
    # Проверка интервалов
    line_spacing = rules.get('line_spacing')
    if line_spacing is None or line_spacing <= 0:
        issues.append('Некорректный межстрочный интервал')
    
    first_line_indent = rules.get('first_line_indent')
    if first_line_indent is not None and first_line_indent < 0:
        issues.append('Некорректный отступ первой строки')
    
    # Проверка заголовков
    headings = rules.get('headings', {})
    for level in ['h1', 'h2', 'h3']:
        h = headings.get(level, {})
        if h.get('font_size') and (h['font_size'] < 8 or h['font_size'] > 24):
            warnings.append(f"Необычный размер шрифта для {level}: {h['font_size']} пт")
    
    # Проверка обязательных разделов
    required_sections = rules.get('required_sections', [])
    if not required_sections:
        warnings.append('Не указаны обязательные разделы')
    
    return jsonify({
        'valid': len(issues) == 0,
        'issues': issues,
        'warnings': warnings,
        'profile_id': profile_id,
        'profile_name': data.get('name'),
        'inheritance_chain': data.get('_inheritance_chain', [profile_id])
    })


@bp.route('/templates', methods=['GET'])
def get_profile_templates():
    """Get list of available profile templates for quick start"""
    templates = [
        {
            'id': 'minimal',
            'name': 'Минимальный профиль',
            'description': 'Базовый набор правил без дополнительных требований',
            'category': 'custom',
            'rules': {
                'font': {'name': 'Times New Roman', 'size': 14, 'color': '000000'},
                'margins': {'left': 3.0, 'right': 1.5, 'top': 2.0, 'bottom': 2.0},
                'line_spacing': 1.5,
                'first_line_indent': 1.25,
                'paragraph_alignment': 'JUSTIFY',
                'required_sections': []
            }
        },
        {
            'id': 'coursework',
            'name': 'Курсовая работа',
            'description': 'Типичные требования для курсовых работ',
            'category': 'custom',
            'rules': {
                'font': {'name': 'Times New Roman', 'size': 14, 'color': '000000'},
                'margins': {'left': 3.0, 'right': 1.0, 'top': 2.0, 'bottom': 2.0},
                'line_spacing': 1.5,
                'first_line_indent': 1.25,
                'paragraph_alignment': 'JUSTIFY',
                'required_sections': ['введение', 'заключение', 'список литературы']
            }
        },
        {
            'id': 'thesis',
            'name': 'Дипломная работа / ВКР',
            'description': 'Расширенные требования для ВКР',
            'category': 'custom',
            'rules': {
                'font': {'name': 'Times New Roman', 'size': 14, 'color': '000000'},
                'margins': {'left': 3.0, 'right': 1.0, 'top': 2.0, 'bottom': 2.0},
                'line_spacing': 1.5,
                'first_line_indent': 1.25,
                'paragraph_alignment': 'JUSTIFY',
                'required_sections': ['введение', 'заключение', 'список литературы', 'приложение']
            }
        },
        {
            'id': 'article',
            'name': 'Научная статья',
            'description': 'Требования для научных публикаций',
            'category': 'custom',
            'rules': {
                'font': {'name': 'Times New Roman', 'size': 12, 'color': '000000'},
                'margins': {'left': 2.5, 'right': 2.5, 'top': 2.5, 'bottom': 2.5},
                'line_spacing': 1.0,
                'first_line_indent': 1.0,
                'paragraph_alignment': 'JUSTIFY',
                'required_sections': ['аннотация', 'ключевые слова', 'введение', 'заключение', 'список литературы']
            }
        }
    ]
    
    return jsonify(templates)


# ======================= НОВЫЕ ENDPOINTS =======================

@bp.route('/<profile_id>/history', methods=['GET'])
def get_profile_history(profile_id):
    """Получить историю версий профиля"""
    profile_id = sanitize_profile_id(profile_id)
    
    versions = get_profile_versions(profile_id)
    
    return jsonify({
        'profile_id': profile_id,
        'versions': versions,
        'total': len(versions)
    })


@bp.route('/<profile_id>/history/<version_filename>', methods=['GET'])
def get_profile_version(profile_id, version_filename):
    """Получить конкретную версию профиля из истории"""
    profile_id = sanitize_profile_id(profile_id)
    version_filename = sanitize_profile_id(version_filename.replace('.json', '')) + '.json'
    
    version_path = os.path.join(HISTORY_DIR, profile_id, version_filename)
    
    if not os.path.exists(version_path):
        return jsonify({'error': 'Version not found'}), 404
    
    try:
        with open(version_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>/restore/<version_filename>', methods=['POST'])
def restore_profile_version(profile_id, version_filename):
    """Восстановить профиль из предыдущей версии"""
    profile_id = sanitize_profile_id(profile_id)
    
    if profile_id in SYSTEM_PROFILES:
        return jsonify({'error': 'Cannot modify system profiles'}), 403
    
    version_filename = sanitize_profile_id(version_filename.replace('.json', '')) + '.json'
    version_path = os.path.join(HISTORY_DIR, profile_id, version_filename)
    
    if not os.path.exists(version_path):
        return jsonify({'error': 'Version not found'}), 404
    
    profile_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    
    try:
        # Загружаем текущую версию и сохраняем в историю
        if os.path.exists(profile_path):
            with open(profile_path, 'r', encoding='utf-8') as f:
                current = json.load(f)
            save_profile_version(profile_id, current)
        
        # Загружаем старую версию
        with open(version_path, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
        
        # Удаляем служебные поля версии
        old_data.pop('_version_timestamp', None)
        old_data['restored_at'] = datetime.now().isoformat()
        old_data['restored_from'] = version_filename
        
        # Сохраняем как текущую версию
        with open(profile_path, 'w', encoding='utf-8') as f:
            json.dump(old_data, f, ensure_ascii=False, indent=4)
        
        # Сбрасываем кэш после восстановления профиля
        invalidate_profile_cache()
        
        return jsonify({
            'success': True,
            'message': 'Profile restored successfully',
            'restored_from': version_filename
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<profile_id>/validate/extended', methods=['POST'])
def validate_profile_extended(profile_id):
    """Расширенная валидация профиля с детальными рекомендациями"""
    try:
        data = load_profile_with_inheritance(profile_id)
    except FileNotFoundError:
        return jsonify({'error': 'Profile not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e), 'valid': False}), 400
    
    rules = data.get('rules', {})
    validation_result = validate_profile_rules(rules, strict=True)
    
    validation_result['profile_id'] = profile_id
    validation_result['profile_name'] = data.get('name')
    validation_result['inheritance_chain'] = data.get('_inheritance_chain', [profile_id])
    validation_result['category'] = data.get('category')
    
    return jsonify(validation_result)


@bp.route('/bulk/update', methods=['POST'])
def bulk_update_profiles():
    """Массовое обновление нескольких профилей"""
    data = request.get_json()
    
    if not data or 'profile_ids' not in data or 'changes' not in data:
        return jsonify({'error': 'profile_ids and changes are required'}), 400
    
    profile_ids = data['profile_ids']
    changes = data['changes']
    
    results = []
    success_count = 0
    
    for profile_id in profile_ids:
        profile_id = sanitize_profile_id(profile_id)
        
        # Пропускаем системные профили
        if profile_id in SYSTEM_PROFILES:
            results.append({
                'id': profile_id,
                'success': False,
                'error': 'Cannot modify system profile'
            })
            continue
        
        profile_path = os.path.join(PROFILES_DIR, f"{profile_id}.json")
        
        if not os.path.exists(profile_path):
            results.append({
                'id': profile_id,
                'success': False,
                'error': 'Profile not found'
            })
            continue
        
        try:
            with open(profile_path, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
            
            # Сохраняем в историю
            save_profile_version(profile_id, profile_data)
            
            # Применяем изменения
            profile_data = deep_merge(profile_data, changes)
            profile_data['updated_at'] = datetime.now().isoformat()
            profile_data['bulk_updated'] = True
            
            with open(profile_path, 'w', encoding='utf-8') as f:
                json.dump(profile_data, f, ensure_ascii=False, indent=4)
            
            results.append({
                'id': profile_id,
                'success': True
            })
            success_count += 1
            
        except Exception as e:
            results.append({
                'id': profile_id,
                'success': False,
                'error': str(e)
            })
    
    # Сбрасываем кэш после массового обновления, если были успешные изменения
    if success_count > 0:
        invalidate_profile_cache()
    
    return jsonify({
        'success': success_count == len(profile_ids),
        'total': len(profile_ids),
        'success_count': success_count,
        'failed_count': len(profile_ids) - success_count,
        'results': results
    })


@bp.route('/bulk/validate', methods=['POST'])
def bulk_validate_profiles():
    """Массовая валидация нескольких профилей"""
    data = request.get_json()
    
    if not data or 'profile_ids' not in data:
        return jsonify({'error': 'profile_ids is required'}), 400
    
    profile_ids = data.get('profile_ids', [])
    
    # Если пустой список, валидируем все профили
    if not profile_ids:
        if os.path.exists(PROFILES_DIR):
            profile_ids = [f.replace('.json', '') for f in os.listdir(PROFILES_DIR) if f.endswith('.json')]
    
    results = []
    valid_count = 0
    
    for profile_id in profile_ids:
        profile_id = sanitize_profile_id(profile_id)
        
        try:
            profile_data = load_profile_with_inheritance(profile_id)
            rules = profile_data.get('rules', {})
            validation = validate_profile_rules(rules)
            
            results.append({
                'id': profile_id,
                'name': profile_data.get('name'),
                'valid': validation['valid'],
                'score': validation['score'],
                'issues_count': len(validation['issues']),
                'warnings_count': len(validation['warnings'])
            })
            
            if validation['valid']:
                valid_count += 1
                
        except Exception as e:
            results.append({
                'id': profile_id,
                'valid': False,
                'error': str(e),
                'score': 0
            })
    
    # Сортируем по score
    results.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    return jsonify({
        'total': len(results),
        'valid_count': valid_count,
        'invalid_count': len(results) - valid_count,
        'average_score': sum(r.get('score', 0) for r in results) / len(results) if results else 0,
        'results': results
    })


@bp.route('/search', methods=['GET'])
def search_profiles():
    """Поиск профилей по критериям"""
    query = request.args.get('q', '').lower()
    category = request.args.get('category')
    min_sources = request.args.get('min_sources', type=int)
    font_name = request.args.get('font_name', '').lower()
    
    results = []
    
    if not os.path.exists(PROFILES_DIR):
        return jsonify([])
    
    for filename in os.listdir(PROFILES_DIR):
        if not filename.endswith('.json'):
            continue
        
        try:
            with open(os.path.join(PROFILES_DIR, filename), 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Фильтрация по категории
            if category and data.get('category') != category:
                continue
            
            # Поиск по тексту
            if query:
                name = data.get('name', '').lower()
                description = data.get('description', '').lower()
                if query not in name and query not in description:
                    continue
            
            # Фильтрация по минимальному количеству источников
            if min_sources:
                profile_min = data.get('rules', {}).get('bibliography', {}).get('min_sources', 0)
                if profile_min < min_sources:
                    continue
            
            # Фильтрация по шрифту
            if font_name:
                profile_font = data.get('rules', {}).get('font', {}).get('name', '').lower()
                if font_name not in profile_font:
                    continue
            
            results.append({
                'id': filename.replace('.json', ''),
                'name': data.get('name'),
                'description': data.get('description'),
                'category': data.get('category'),
                'version': data.get('version'),
                'is_system': data.get('is_system', filename.replace('.json', '') in SYSTEM_PROFILES)
            })
            
        except Exception:
            pass
    
    return jsonify(results)


@bp.route('/statistics', methods=['GET'])
def get_profiles_statistics():
    """Получить статистику по всем профилям"""
    stats = {
        'total': 0,
        'by_category': {'gost': 0, 'university': 0, 'custom': 0},
        'system_profiles': 0,
        'with_inheritance': 0,
        'fonts_used': {},
        'avg_min_sources': 0,
        'recently_updated': []
    }
    
    if not os.path.exists(PROFILES_DIR):
        return jsonify(stats)
    
    min_sources_list = []
    recently_updated = []
    
    for filename in os.listdir(PROFILES_DIR):
        if not filename.endswith('.json'):
            continue
        
        try:
            with open(os.path.join(PROFILES_DIR, filename), 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            stats['total'] += 1
            
            # По категориям
            cat = data.get('category', 'custom')
            if cat in stats['by_category']:
                stats['by_category'][cat] += 1
            
            # Системные
            if data.get('is_system') or filename.replace('.json', '') in SYSTEM_PROFILES:
                stats['system_profiles'] += 1
            
            # С наследованием
            if data.get('extends'):
                stats['with_inheritance'] += 1
            
            # Шрифты
            font = data.get('rules', {}).get('font', {}).get('name', 'Unknown')
            stats['fonts_used'][font] = stats['fonts_used'].get(font, 0) + 1
            
            # Мин. источники
            min_src = data.get('rules', {}).get('bibliography', {}).get('min_sources')
            if min_src:
                min_sources_list.append(min_src)
            
            # Недавно обновленные
            updated = data.get('updated_at') or data.get('created_at')
            if updated:
                recently_updated.append({
                    'id': filename.replace('.json', ''),
                    'name': data.get('name'),
                    'updated_at': updated
                })
                
        except Exception:
            pass
    
    # Средние источники
    if min_sources_list:
        stats['avg_min_sources'] = sum(min_sources_list) / len(min_sources_list)
    
    # Сортируем недавно обновленные
    recently_updated.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
    stats['recently_updated'] = recently_updated[:5]
    
    return jsonify(stats)
