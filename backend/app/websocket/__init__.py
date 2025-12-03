"""
WebSocket модуль для отслеживания прогресса обработки документов.
Использует Flask-SocketIO для real-time обновлений.
"""

from flask_socketio import SocketIO, emit, join_room, leave_room
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Глобальный экземпляр SocketIO (инициализируется в app.py)
socketio: Optional[SocketIO] = None


def init_socketio(app) -> SocketIO:
    """
    Инициализирует SocketIO с приложением Flask.
    
    Args:
        app: Flask приложение
        
    Returns:
        Экземпляр SocketIO
    """
    global socketio
    
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        async_mode='threading',  # Используем threading для совместимости
        logger=False,
        engineio_logger=False
    )
    
    # Регистрируем обработчики событий
    register_handlers(socketio)
    
    logger.info("SocketIO инициализирован")
    return socketio


def register_handlers(sio: SocketIO):
    """Регистрирует обработчики WebSocket событий"""
    
    @sio.on('connect')
    def handle_connect():
        logger.debug("Клиент подключился")
        emit('connected', {'status': 'ok'})
    
    @sio.on('disconnect')
    def handle_disconnect():
        logger.debug("Клиент отключился")
    
    @sio.on('join')
    def handle_join(session_id: str):
        """Присоединяет клиента к комнате сессии"""
        join_room(session_id)
        logger.debug(f"Клиент присоединился к сессии {session_id}")
        emit('joined', {'session_id': session_id})
    
    @sio.on('leave')
    def handle_leave(session_id: str):
        """Отсоединяет клиента от комнаты сессии"""
        leave_room(session_id)
        logger.debug(f"Клиент покинул сессию {session_id}")


class ProgressEmitter:
    """
    Класс для отправки событий прогресса.
    
    Этапы обработки:
    - upload (0-10%): Загрузка файла
    - extract (10-25%): Извлечение данных
    - check (25-50%): Проверка нормоконтроля
    - correct (50-85%): Автоисправление
    - report (85-95%): Генерация отчёта
    - complete (100%): Завершено
    """
    
    STAGES = {
        'upload': (0, 10, 'Загрузка файла...'),
        'extract': (10, 25, 'Извлечение данных...'),
        'check': (25, 50, 'Проверка нормоконтроля...'),
        'correct': (50, 85, 'Автоматическое исправление...'),
        'report': (85, 95, 'Генерация отчёта...'),
        'complete': (100, 100, 'Готово!'),
        'error': (0, 0, 'Ошибка')
    }
    
    def __init__(self, session_id: str):
        """
        Args:
            session_id: Уникальный идентификатор сессии обработки
        """
        self.session_id = session_id
        self.current_stage = None
        self.current_progress = 0
    
    def emit(self, stage: str, sub_progress: float = 0, message: str = None):
        """
        Отправляет событие прогресса.
        
        Args:
            stage: Название этапа (из STAGES)
            sub_progress: Прогресс внутри этапа (0-100)
            message: Дополнительное сообщение
        """
        global socketio
        
        if socketio is None:
            logger.debug(f"SocketIO не инициализирован, пропуск emit: {stage}")
            return
        
        if stage not in self.STAGES:
            logger.warning(f"Неизвестный этап: {stage}")
            return
        
        start, end, default_message = self.STAGES[stage]
        
        # Вычисляем общий прогресс
        if stage == 'error':
            progress = self.current_progress
        else:
            progress = start + (end - start) * (sub_progress / 100)
        
        self.current_stage = stage
        self.current_progress = progress
        
        data = {
            'session_id': self.session_id,
            'stage': stage,
            'progress': round(progress, 1),
            'message': message or default_message,
            'sub_progress': round(sub_progress, 1)
        }
        
        try:
            socketio.emit('progress', data, room=self.session_id)
            logger.debug(f"Progress emit: {stage} - {progress}%")
        except Exception as e:
            logger.error(f"Ошибка emit: {e}")
    
    def start(self):
        """Начало обработки"""
        self.emit('upload', 0)
    
    def uploading(self, percent: float):
        """Прогресс загрузки"""
        self.emit('upload', percent)
    
    def extracting(self, percent: float = 50):
        """Извлечение данных"""
        self.emit('extract', percent)
    
    def checking(self, percent: float = 50, message: str = None):
        """Проверка нормоконтроля"""
        self.emit('check', percent, message)
    
    def correcting(self, percent: float = 50, message: str = None):
        """Автоисправление"""
        self.emit('correct', percent, message)
    
    def generating_report(self, percent: float = 50):
        """Генерация отчёта"""
        self.emit('report', percent)
    
    def complete(self, message: str = None):
        """Завершение обработки"""
        self.emit('complete', 100, message or 'Обработка завершена!')
    
    def error(self, message: str):
        """Ошибка обработки"""
        self.emit('error', 0, f'Ошибка: {message}')


def get_progress_emitter(session_id: str) -> ProgressEmitter:
    """
    Фабричная функция для создания эмиттера прогресса.
    
    Args:
        session_id: Уникальный идентификатор сессии
        
    Returns:
        Экземпляр ProgressEmitter
    """
    return ProgressEmitter(session_id)
