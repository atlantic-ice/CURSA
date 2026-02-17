"""Базовый класс для всех корректоров.

Определяет интерфейс, который должны реализовать все специализированные корректоры.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from docx import Document
import datetime


@dataclass
class CorrectionAction:
    """Описание одного действия коррекции.
    
    Attributes:
        element_type: Тип элемента (paragraph, table, heading и т.д.)
        element_index: Индекс элемента в документе
        action_type: Тип действия (font_change, spacing_change и т.д.)
        old_value: Исходное значение
        new_value: Новое значение
        description: Описание действия
        success: Успешно ли выполнено действие
        error_message: Сообщение об ошибке (если apply_all имел место)
    """
    element_type: str
    element_index: int
    action_type: str
    old_value: Any
    new_value: Any
    description: str
    success: bool = True
    error_message: str = ""


class BaseCorrector(ABC):
    """Абстрактный базовый класс для всех корректоров.
    
    Каждый корректор отвечает за коррекцию определённого аспекта документа:
    - StyleCorrector: шрифты, размеры, интервалы
    - StructureCorrector: заголовки, разделы
    - ContentCorrector: таблицы, рисунки, списки
    - FormattingCorrector: поля, выравнивание, нумерация
    """
    
    def __init__(self):
        """Инициализация корректора."""
        self.actions: List[CorrectionAction] = []
    
    @abstractmethod
    def analyze(self, document: Document) -> List[Dict[str, Any]]:
        """Анализирует документ и возвращает обнаруженные проблемы.
        
        Args:
            document: Документ DOCX для анализа
            
        Returns:
            Список словарей с описанием проблем
            
        Raises:
            ValueError: Если документ некорректен
        """
        pass
    
    @abstractmethod
    def correct(self, document: Document) -> int:
        """Исправляет проблемы в документе.
        
        Args:
            document: Документ DOCX для коррекции
            
        Returns:
            Количество исправленных проблем
            
        Raises:
            RuntimeError: Если коррекция не удалась
        """
        pass
    
    def get_actions(self) -> List[CorrectionAction]:
        """Возвращает список выполненных действий.
        
        Returns:
            Список действий коррекции
        """
        return self.actions
    
    def clear_actions(self) -> None:
        """Очищает историю действий."""
        self.actions = []
    
    def add_action(
        self,
        element_type: str,
        element_index: int,
        action_type: str,
        old_value: Any,
        new_value: Any,
        description: str,
        success: bool = True,
        error_message: str = ""
    ) -> None:
        """Добавляет действие в историю.
        
        Args:
            element_type: Тип элемента
            element_index: Индекс элемента
            action_type: Тип действия
            old_value: Исходное значение
            new_value: Новое значение
            description: Описание
            success: Успешно ли выполнено
            error_message: Сообщение об ошибке
        """
        action = CorrectionAction(
            element_type=element_type,
            element_index=element_index,
            action_type=action_type,
            old_value=old_value,
            new_value=new_value,
            description=description,
            success=success,
            error_message=error_message,
        )
        self.actions.append(action)
    
    def get_summary(self) -> Dict[str, Any]:
        """Возвращает краткую сводку выполненных действий.
        
        Returns:
            Словарь со статистикой
        """
        successful = sum(1 for a in self.actions if a.success)
        failed = len(self.actions) - successful
        
        return {
            "total_actions": len(self.actions),
            "successful": successful,
            "failed": failed,
            "success_rate": round(successful / max(len(self.actions), 1) * 100, 2),
            "actions_by_type": self._count_by_type(),
        }
    
    def _count_by_type(self) -> Dict[str, int]:
        """Считает действия по типам.
        
        Returns:
            Словарь с подсчетом действий по типам
        """
        counts: Dict[str, int] = {}
        for action in self.actions:
            counts[action.action_type] = counts.get(action.action_type, 0) + 1
        return counts
