"""Refactored Document Corrector - Координатор для многопроходной коррекции.

После рефакторинга: основная логика разделена на специализированные модули
- StyleCorrector: шрифты, интервалы, поля
- StructureCorrector: заголовки, разделы
- ContentCorrector: таблицы, списки, рисунки
- FormattingCorrector: выравнивание, форматирование

Этот модуль координирует их работу.
"""

import os
import datetime
import tempfile
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

from docx import Document

from .correctors import (
    StyleCorrector,
    StructureCorrector,
    ContentCorrector,
    FormattingCorrector,
)
from .correctors.base import CorrectionAction


class CorrectionPhase(Enum):
    """Фазы многопроходной коррекции"""

    STRUCTURE = "structure"  # Структурный анализ
    STYLES = "styles"  # Применение стилей
    FORMATTING = "formatting"  # Форматирование текста
    VERIFICATION = "verification"  # Финальная верификация
    XML_DEEP = "xml_deep"  # Глубокая XML-коррекция


@dataclass
class CorrectionReport:
    """Полный отчёт о коррекции документа"""

    file_path: str
    start_time: datetime.datetime = field(default_factory=datetime.datetime.now)
    end_time: Optional[datetime.datetime] = None
    total_issues_found: int = 0
    total_issues_fixed: int = 0
    remaining_issues: int = 0
    passes_completed: int = 0
    max_passes: int = 3
    actions: List[CorrectionAction] = field(default_factory=list)
    verification_results: Dict[str, Any] = field(default_factory=dict)

    def get_summary(self) -> Dict[str, Any]:
        """Возвращает краткую сводку отчёта"""
        duration = (self.end_time - self.start_time).total_seconds() if self.end_time else None

        return {
            "file": self.file_path,
            "duration_seconds": duration,
            "passes_completed": self.passes_completed,
            "total_issues_found": self.total_issues_found,
            "total_issues_fixed": self.total_issues_fixed,
            "remaining_issues": self.remaining_issues,
            "success_rate": round(
                self.total_issues_fixed / max(self.total_issues_found, 1) * 100, 2
            ),
        }


class DocumentCorrector:
    """Координатор для многопроходной коррекции документа.

    Использует специализированные корректоры для разных аспектов документа:
    - StyleCorrector для стилей и форматирования
    - StructureCorrector для структуры
    - ContentCorrector для содержимого
    - FormattingCorrector для дополнительного форматирования

    Выполняет многопроходную коррекцию до достижения стабильного состояния.
    """

    def __init__(self, rules: Dict[str, Any] = None):
        """Инициализация координатора корректоров.

        Args:
            rules: Словарь правил для всех корректоров
        """
        self.rules = rules or self._get_default_rules()

        # Инициализируем все корректоры
        self.style_corrector = StyleCorrector(self.rules)
        self.structure_corrector = StructureCorrector(self.rules)
        self.content_corrector = ContentCorrector(self.rules)
        self.formatting_corrector = FormattingCorrector(self.rules)

        # Все корректоры в порядке применения
        self.correctors = [
            self.style_corrector,
            self.structure_corrector,
            self.content_corrector,
            self.formatting_corrector,
        ]

    def correct_document(
        self, file_path: str, errors: List = None, out_path: str = None, max_passes: int = 3
    ) -> CorrectionReport:
        """Исправляет документ многопроходным методом.

        Args:
            file_path: Путь к исходному документу DOCX
            errors: Список конкретных ошибок для исправления (опционально)
            out_path: Путь для сохранения исправленного документа
            max_passes: Максимальное количество проходов

        Returns:
            Отчёт о коррекции

        Raises:
            FileNotFoundError: Если файл не найден
            Exception: При ошибках обработки документа
        """
        # Проверяем что файл существует
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {file_path}")

        # Создаем отчет
        report = CorrectionReport(
            file_path=file_path,
            max_passes=max_passes,
        )

        try:
            # Загружаем документ
            document = Document(file_path)

            # Выполняем многопроходную коррекцию
            for pass_num in range(1, max_passes + 1):
                print(f"\nPass {pass_num}/{max_passes}...")

                previously_fixed = report.total_issues_fixed

                # Применяем каждый корректор
                for corrector in self.correctors:
                    corrected_count = corrector.correct(document)
                    report.total_issues_fixed += corrected_count

                    # Собираем действия из корректора
                    report.actions.extend(corrector.get_actions())

                    print(f"  * {corrector.__class__.__name__}: {corrected_count} fixes")

                report.passes_completed = pass_num

                # Если ничего не было исправлено, выходим из цикла
                if report.total_issues_fixed == previously_fixed:
                    print(f"[OK] Stable state reached at pass {pass_num}")
                    break

            # Сохраняем документ
            if out_path:
                document.save(out_path)
                print(f"[FILE] Document saved: {out_path}")

            report.end_time = datetime.datetime.now()

            return report

        except Exception as e:
            report.end_time = datetime.datetime.now()
            raise RuntimeError(f"Ошибка при коррекции документа: {str(e)}") from e

    def analyze_document(self, file_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """Анализирует все проблемы в документе без коррекции.

        Args:
            file_path: Путь к документу

        Returns:
            Словарь со списками проблем от каждого корректора

        Raises:
            FileNotFoundError: Если файл не найден
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {file_path}")

        document = Document(file_path)
        analysis = {}

        for corrector in self.correctors:
            issues = corrector.analyze(document)
            corrector_name = corrector.__class__.__name__
            analysis[corrector_name] = issues

            print(f"{corrector_name}: {len(issues)} проблем найдено")

        return analysis

    @staticmethod
    def _get_default_rules() -> Dict[str, Any]:
        """Возвращает правила по умолчанию (ГОСТ 7.32-2017).

        Returns:
            Словарь правил
        """
        return {
            "font": {
                "name": "Times New Roman",
                "size": 14,
            },
            "headings": {
                "h1": {"font_size": 14, "bold": True},
                "h2": {"font_size": 14, "bold": True},
            },
            "line_spacing": 1.5,
            "first_line_indent": 1.25,  # cm
            "margins": {
                "left": 3.0,  # cm
                "right": 1.5,  # cm
                "top": 2.0,  # cm
                "bottom": 2.0,  # cm
            },
        }


# ============ Обратная совместимость ============


def correct_document(file_path, errors=None, out_path=None):
    """Вспомогательная функция для обратной совместимости.

    Args:
        file_path: Путь к документу
        errors: Список ошибок
        out_path: Путь сохранения

    Returns:
        Отчет о коррекции
    """
    corrector = DocumentCorrector()
    return corrector.correct_document(file_path, errors, out_path)
