"""Модули для коррекции различных аспектов документов.

Архитектура:
- base.py: BaseCorrector - абстрактный базовый класс
- style_corrector.py: Коррекция стилей (шрифты, интервалы)
- structure_corrector.py: Коррекция структуры (заголовки, разделы)
- content_corrector.py: Коррекция содержимого (таблицы, рисунки, списки)
- formatting_corrector.py: Коррекция форматирования (поля, выравнивание)
"""

from .base import BaseCorrector
from .style_corrector import StyleCorrector
from .structure_corrector import StructureCorrector
from .content_corrector import ContentCorrector
from .formatting_corrector import FormattingCorrector

__all__ = [
    "BaseCorrector",
    "StyleCorrector",
    "StructureCorrector",
    "ContentCorrector",
    "FormattingCorrector",
]
