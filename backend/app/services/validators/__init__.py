"""
Базовый класс для всех валидаторов документа.
Предоставляет общий интерфейс для проверки различных аспектов документа.
"""

from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Severity(Enum):
    """Уровень серьезности ошибки"""
    CRITICAL = "critical"  # Критические нарушения требований
    ERROR = "error"        # Существенные ошибки
    WARNING = "warning"    # Предупреждения
    INFO = "info"          # Информационные сообщения


@dataclass
class ValidationIssue:
    """
    Класс для представления найденной проблемы в документе.
    """
    rule_id: int
    rule_name: str
    description: str
    severity: Severity
    location: Optional[Dict[str, Any]] = None  # Местоположение: параграф, страница и т.д.
    expected: Optional[str] = None             # Ожидаемое значение
    actual: Optional[str] = None               # Фактическое значение
    suggestion: Optional[str] = None           # Предложение по исправлению
    can_autocorrect: bool = False              # Можно ли исправить автоматически

    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь для API ответа"""
        return {
            'rule_id': self.rule_id,
            'rule_name': self.rule_name,
            'description': self.description,
            'severity': self.severity.value,
            'location': self.location,
            'expected': self.expected,
            'actual': self.actual,
            'suggestion': self.suggestion,
            'can_autocorrect': self.can_autocorrect
        }


@dataclass
class ValidationResult:
    """
    Результат валидации документа.
    """
    validator_name: str
    passed: bool
    issues: List[ValidationIssue]
    execution_time: float = 0.0  # Время выполнения в секундах

    @property
    def critical_count(self) -> int:
        """Количество критических ошибок"""
        return sum(1 for issue in self.issues if issue.severity == Severity.CRITICAL)

    @property
    def error_count(self) -> int:
        """Количество ошибок"""
        return sum(1 for issue in self.issues if issue.severity == Severity.ERROR)

    @property
    def warning_count(self) -> int:
        """Количество предупреждений"""
        return sum(1 for issue in self.issues if issue.severity == Severity.WARNING)

    def to_dict(self) -> Dict[str, Any]:
        """Преобразование в словарь"""
        return {
            'validator_name': self.validator_name,
            'passed': self.passed,
            'execution_time': self.execution_time,
            'statistics': {
                'total_issues': len(self.issues),
                'critical': self.critical_count,
                'errors': self.error_count,
                'warnings': self.warning_count,
                'info': len(self.issues) - self.critical_count - self.error_count - self.warning_count
            },
            'issues': [issue.to_dict() for issue in self.issues]
        }


class BaseValidator(ABC):
    """
    Абстрактный базовый класс для всех валидаторов.

    Каждый валидатор отвечает за проверку определённого аспекта документа
    (форматирование, структура, содержание и т.д.)
    """

    def __init__(self, profile: Optional[Dict[str, Any]] = None):
        """
        Инициализация валидатора.

        Args:
            profile: Профиль требований (из JSON конфигурации)
        """
        self.profile = profile or {}
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @property
    @abstractmethod
    def name(self) -> str:
        """Название валидатора"""
        pass

    @property
    def enabled(self) -> bool:
        """Включен ли валидатор (можно отключить через профиль)"""
        validation_settings = self.profile.get('validation', {})
        check_key = f"check_{self.name.lower().replace(' ', '_')}"
        return validation_settings.get(check_key, True)

    @abstractmethod
    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Выполняет валидацию документа.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа (из DocumentProcessor)

        Returns:
            ValidationResult с найденными проблемами
        """
        pass

    def _get_rule_config(self, rule_key: str, default: Any = None) -> Any:
        """
        Получить настройку правила из профиля.

        Args:
            rule_key: Ключ правила (например, 'font.size')
            default: Значение по умолчанию

        Returns:
            Значение настройки или default
        """
        rules = self.profile.get('rules', {})
        keys = rule_key.split('.')

        value = rules
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                return default

        return value if value is not None else default

    def _create_issue(
        self,
        rule_id: int,
        rule_name: str,
        description: str,
        severity: Severity,
        **kwargs
    ) -> ValidationIssue:
        """
        Создать ValidationIssue с логированием.

        Args:
            rule_id: ID правила
            rule_name: Название правила
            description: Описание проблемы
            severity: Уровень серьезности
            **kwargs: Дополнительные параметры для ValidationIssue

        Returns:
            ValidationIssue объект
        """
        issue = ValidationIssue(
            rule_id=rule_id,
            rule_name=rule_name,
            description=description,
            severity=severity,
            **kwargs
        )

        # Логирование в зависимости от серьезности
        log_message = f"{rule_name}: {description}"
        if severity == Severity.CRITICAL:
            self.logger.error(log_message)
        elif severity == Severity.ERROR:
            self.logger.warning(log_message)
        elif severity == Severity.WARNING:
            self.logger.info(log_message)
        else:
            self.logger.debug(log_message)

        return issue

    def _format_location(
        self,
        paragraph_index: Optional[int] = None,
        page_number: Optional[int] = None,
        section: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Форматировать информацию о местоположении проблемы.

        Args:
            paragraph_index: Индекс параграфа
            page_number: Номер страницы
            section: Название секции
            **kwargs: Дополнительные параметры местоположения

        Returns:
            Словарь с местоположением
        """
        location = {}

        if paragraph_index is not None:
            location['paragraph_index'] = paragraph_index
            location['paragraph_number'] = paragraph_index + 1  # Human-readable

        if page_number is not None:
            location['page_number'] = page_number

        if section is not None:
            location['section'] = section

        location.update(kwargs)
        return location
