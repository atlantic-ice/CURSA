"""Compatibility layer for the refactored document corrector API.

Модульная архитектура корректоров всё ещё используется для анализа, но активный
DOCX pipeline дипломной версии опирается на стабильную реализацию из
document_corrector.py. Этот модуль выравнивает API между двумя ветками, чтобы:

- сохранить рабочий multipass-контур в production flow;
- не дублировать бизнес-логику коррекции в двух местах;
- оставить совместимый импорт для тестов, документации и поэтапной миграции.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional, Tuple

from docx import Document

from .correctors import ContentCorrector, FormattingCorrector, StructureCorrector, StyleCorrector
from .document_corrector import (
    CorrectionPhase,
    CorrectionReport,
    DocumentCorrector as StableDocumentCorrector,
)


class DocumentCorrector:
    """Совместимый фасад поверх стабильного корректора документа.

    Для активной коррекции делегирует в `document_corrector.DocumentCorrector`,
    а модульные корректоры использует как read-only анализаторы прогресса
    рефакторинга.
    """

    def __init__(
        self,
        rules: Optional[Dict[str, Any]] = None,
        profile_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        resolved_profile = self._resolve_profile_data(rules=rules, profile_data=profile_data)

        self.rules = resolved_profile.get("rules", {})
        self.profile_data = resolved_profile

        self.style_corrector = StyleCorrector(self.rules)
        self.structure_corrector = StructureCorrector(self.rules)
        self.content_corrector = ContentCorrector(self.rules)
        self.formatting_corrector = FormattingCorrector(self.rules)
        self.correctors = [
            self.style_corrector,
            self.structure_corrector,
            self.content_corrector,
            self.formatting_corrector,
        ]

        self._stable_corrector = StableDocumentCorrector(profile_data=resolved_profile)

    @property
    def verbose_logging(self) -> bool:
        """Проксирует verbose-режим стабильного корректора."""
        return self._stable_corrector.verbose_logging

    @verbose_logging.setter
    def verbose_logging(self, value: bool) -> None:
        self._stable_corrector.verbose_logging = value

    @property
    def max_passes(self) -> int:
        """Проксирует число проходов стабильного корректора."""
        return self._stable_corrector.max_passes

    @max_passes.setter
    def max_passes(self, value: int) -> None:
        self._stable_corrector.max_passes = value

    def correct_document(
        self,
        file_path: str,
        errors: Optional[List[Any]] = None,
        out_path: Optional[str] = None,
        max_passes: Optional[int] = None,
    ) -> CorrectionReport:
        """Исправляет документ и возвращает совместимый отчёт.

        В отличие от стабильного модуля, этот метод сохраняет контракт
        refactored-версии и возвращает `CorrectionReport`, но фактическую
        коррекцию делегирует в multipass-реализацию.
        """
        corrected_path, report = self.correct_document_multipass(
            file_path=file_path,
            errors=errors,
            out_path=out_path,
            max_passes=max_passes,
        )
        setattr(report, "corrected_file_path", corrected_path)
        return report

    def correct_document_multipass(
        self,
        file_path: str,
        errors: Optional[List[Any]] = None,
        out_path: Optional[str] = None,
        max_passes: Optional[int] = None,
    ) -> Tuple[str, CorrectionReport]:
        """Делегирует multipass-коррекцию в стабильную реализацию."""
        if max_passes is None:
            max_passes = self.max_passes

        return self._stable_corrector.correct_document_multipass(
            file_path=file_path,
            errors=errors,
            out_path=out_path,
            max_passes=max_passes,
        )

    def analyze_document(self, file_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """Анализирует документ модульными корректами без изменения файла."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {file_path}")

        document = Document(file_path)
        analysis: Dict[str, List[Dict[str, Any]]] = {}

        for corrector in self.correctors:
            analysis[corrector.__class__.__name__] = corrector.analyze(document)

        return analysis

    @staticmethod
    def _resolve_profile_data(
        rules: Optional[Dict[str, Any]] = None,
        profile_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Нормализует входные правила к формату стабильного корректора."""
        if profile_data is not None:
            return profile_data

        if rules is not None:
            return {"rules": rules}

        return {"rules": StableDocumentCorrector().rules}


def correct_document(
    file_path: str,
    errors: Optional[List[Any]] = None,
    out_path: Optional[str] = None,
    max_passes: Optional[int] = None,
) -> CorrectionReport:
    """Функция совместимости для внешнего кода и тестов."""
    corrector = DocumentCorrector()
    return corrector.correct_document(
        file_path=file_path,
        errors=errors,
        out_path=out_path,
        max_passes=max_passes,
    )
