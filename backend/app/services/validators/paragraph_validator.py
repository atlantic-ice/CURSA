"""
Валидатор для проверки оформления параграфов документа.
"""

from typing import Dict, Any, List
import time
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT, WD_LINE_SPACING
from docx.shared import Pt, Cm
from . import BaseValidator, ValidationResult, ValidationIssue, Severity


class ParagraphValidator(BaseValidator):
    """
    Валидатор для проверки оформления параграфов.

    Проверяет:
    - Отступ первой строки (абзацный отступ 1.25см)
    - Выравнивание текста (по ширине)
    - Межстрочный интервал (1.5 строки)
    - Интервалы до и после параграфов (0pt)
    - Отсутствие ручных переносов строк
    """

    @property
    def name(self) -> str:
        return "ParagraphValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет оформление параграфов в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        # Получаем требования из профиля
        paragraph_config = self._get_rule_config('paragraph', {})

        expected_first_line_indent = paragraph_config.get('first_line_indent_cm', 1.25)
        expected_alignment = self._get_alignment_from_config(
            paragraph_config.get('alignment', 'justify')
        )
        expected_line_spacing = paragraph_config.get('line_spacing', 1.5)
        expected_space_before = paragraph_config.get('space_before_pt', 0)
        expected_space_after = paragraph_config.get('space_after_pt', 0)

        # Допуски
        indent_tolerance = 0.1  # см
        spacing_tolerance = 0.1  # множитель
        space_tolerance = 2  # пункты

        # Проверяем каждый параграф
        for idx, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip()

            # Пропускаем пустые параграфы
            if not text:
                continue

            # Пропускаем заголовки, списки литературы, оглавление
            if self._is_special_paragraph(paragraph, text):
                continue

            # Проверка отступа первой строки
            issues.extend(self._check_first_line_indent(
                paragraph, idx, text, expected_first_line_indent, indent_tolerance
            ))

            # Проверка выравнивания
            issues.extend(self._check_alignment(
                paragraph, idx, text, expected_alignment
            ))

            # Проверка межстрочного интервала
            issues.extend(self._check_line_spacing(
                paragraph, idx, text, expected_line_spacing, spacing_tolerance
            ))

            # Проверка интервалов до/после
            issues.extend(self._check_paragraph_spacing(
                paragraph, idx, text,
                expected_space_before, expected_space_after, space_tolerance
            ))

            # Проверка ручных переносов
            issues.extend(self._check_manual_breaks(
                paragraph, idx, text
            ))

        execution_time = time.time() - start_time
        passed = len([i for i in issues if i.severity in [Severity.CRITICAL, Severity.ERROR]]) == 0

        return ValidationResult(
            validator_name=self.name,
            passed=passed,
            issues=issues,
            execution_time=execution_time
        )

    def _is_special_paragraph(self, paragraph: Any, text: str) -> bool:
        """
        Проверяет, является ли параграф специальным (заголовок, список и т.д.).

        Args:
            paragraph: Параграф
            text: Текст параграфа

        Returns:
            True если это специальный параграф
        """
        # Проверка стиля
        style_name = paragraph.style.name.lower() if paragraph.style else ""

        if any(s in style_name for s in ['heading', 'заголовок', 'title', 'toc', 'caption']):
            return True

        # Проверка по контенту
        text_lower = text.lower()
        special_keywords = [
            'введение', 'заключение', 'содержание', 'оглавление',
            'список литературы', 'библиография', 'приложение',
            'реферат', 'аннотация'
        ]

        if text_lower in special_keywords or text_lower == text.upper() and len(text) < 50:
            return True

        # Если начинается с номера раздела
        if text and text[0].isdigit() and '.' in text[:10]:
            return True

        return False

    def _check_first_line_indent(
        self,
        paragraph: Any,
        idx: int,
        text: str,
        expected_indent_cm: float,
        tolerance: float
    ) -> List[ValidationIssue]:
        """
        Проверяет отступ первой строки параграфа.

        Args:
            paragraph: Параграф
            idx: Индекс
            text: Текст
            expected_indent_cm: Ожидаемый отступ в см
            tolerance: Допуск в см

        Returns:
            Список проблем
        """
        issues = []

        first_line_indent = paragraph.paragraph_format.first_line_indent

        if first_line_indent is None:
            # Отступ не задан
            issues.append(self._create_issue(
                rule_id=4,
                rule_name="Абзацный отступ",
                description="Не задан абзацный отступ первой строки",
                severity=Severity.ERROR,
                location=self._format_location(
                    paragraph_index=idx,
                    text_preview=text[:50]
                ),
                expected=f"{expected_indent_cm} см",
                actual="Не задан",
                suggestion=f"Установите отступ первой строки {expected_indent_cm} см",
                can_autocorrect=True
            ))
        else:
            # Конвертируем в сантиметры
            actual_indent_cm = first_line_indent.cm

            if abs(actual_indent_cm - expected_indent_cm) > tolerance:
                issues.append(self._create_issue(
                    rule_id=4,
                    rule_name="Абзацный отступ",
                    description="Неправильный абзацный отступ первой строки",
                    severity=Severity.ERROR,
                    location=self._format_location(
                        paragraph_index=idx,
                        text_preview=text[:50]
                    ),
                    expected=f"{expected_indent_cm} см",
                    actual=f"{actual_indent_cm:.2f} см",
                    suggestion=f"Установите отступ {expected_indent_cm} см",
                    can_autocorrect=True
                ))

        return issues

    def _check_alignment(
        self,
        paragraph: Any,
        idx: int,
        text: str,
        expected_alignment
    ) -> List[ValidationIssue]:
        """
        Проверяет выравнивание параграфа.

        Args:
            paragraph: Параграф
            idx: Индекс
            text: Текст
            expected_alignment: Ожидаемое выравнивание

        Returns:
            Список проблем
        """
        issues = []

        actual_alignment = paragraph.alignment

        # None обычно означает "по умолчанию" (по левому краю или из стиля)
        if actual_alignment is None:
            actual_alignment = WD_PARAGRAPH_ALIGNMENT.LEFT

        if actual_alignment != expected_alignment:
            issues.append(self._create_issue(
                rule_id=5,
                rule_name="Выравнивание текста",
                description="Неправильное выравнивание параграфа",
                severity=Severity.WARNING,
                location=self._format_location(
                    paragraph_index=idx,
                    text_preview=text[:50]
                ),
                expected=self._get_alignment_name(expected_alignment),
                actual=self._get_alignment_name(actual_alignment),
                suggestion=f"Установите выравнивание: {self._get_alignment_name(expected_alignment)}",
                can_autocorrect=True
            ))

        return issues

    def _check_line_spacing(
        self,
        paragraph: Any,
        idx: int,
        text: str,
        expected_spacing: float,
        tolerance: float
    ) -> List[ValidationIssue]:
        """
        Проверяет межстрочный интервал.

        Args:
            paragraph: Параграф
            idx: Индекс
            text: Текст
            expected_spacing: Ожидаемый интервал (1.5, 2.0 и т.д.)
            tolerance: Допуск

        Returns:
            Список проблем
        """
        issues = []

        line_spacing_rule = paragraph.paragraph_format.line_spacing_rule
        line_spacing = paragraph.paragraph_format.line_spacing

        if line_spacing is None:
            issues.append(self._create_issue(
                rule_id=9,
                rule_name="Межстрочный интервал",
                description="Не задан межстрочный интервал",
                severity=Severity.ERROR,
                location=self._format_location(
                    paragraph_index=idx,
                    text_preview=text[:50]
                ),
                expected=f"{expected_spacing} строки",
                actual="Не задан",
                suggestion=f"Установите межстрочный интервал {expected_spacing}",
                can_autocorrect=True
            ))
        else:
            # Проверяем тип интервала
            if line_spacing_rule == WD_LINE_SPACING.MULTIPLE:
                # Интервал в множителе (1.5, 2.0 и т.д.)
                actual_spacing = line_spacing

                if abs(actual_spacing - expected_spacing) > tolerance:
                    issues.append(self._create_issue(
                        rule_id=9,
                        rule_name="Межстрочный интервал",
                        description="Неправильный межстрочный интервал",
                        severity=Severity.ERROR,
                        location=self._format_location(
                            paragraph_index=idx,
                            text_preview=text[:50]
                        ),
                        expected=f"{expected_spacing} строки",
                        actual=f"{actual_spacing:.1f} строки",
                        suggestion=f"Установите интервал {expected_spacing}",
                        can_autocorrect=True
                    ))
            elif line_spacing_rule == WD_LINE_SPACING.EXACTLY:
                # Точный интервал в пунктах - может быть проблемой
                issues.append(self._create_issue(
                    rule_id=9,
                    rule_name="Межстрочный интервал",
                    description="Используется точный межстрочный интервал вместо множителя",
                    severity=Severity.WARNING,
                    location=self._format_location(
                        paragraph_index=idx,
                        text_preview=text[:30]
                    ),
                    expected=f"Множитель {expected_spacing}",
                    actual=f"Точный {line_spacing}pt",
                    suggestion=f"Используйте множитель {expected_spacing} вместо точного значения",
                    can_autocorrect=True
                ))

        return issues

    def _check_paragraph_spacing(
        self,
        paragraph: Any,
        idx: int,
        text: str,
        expected_before: float,
        expected_after: float,
        tolerance: float
    ) -> List[ValidationIssue]:
        """
        Проверяет интервалы до и после параграфа.

        Args:
            paragraph: Параграф
            idx: Индекс
            text: Текст
            expected_before: Ожидаемый интервал до (в пунктах)
            expected_after: Ожидаемый интервал после (в пунктах)
            tolerance: Допуск

        Returns:
            Список проблем
        """
        issues = []

        space_before = paragraph.paragraph_format.space_before
        space_after = paragraph.paragraph_format.space_after

        # Проверка интервала до
        if space_before:
            actual_before = space_before.pt
            if abs(actual_before - expected_before) > tolerance:
                issues.append(self._create_issue(
                    rule_id=11,
                    rule_name="Интервал до параграфа",
                    description="Неправильный интервал до параграфа",
                    severity=Severity.WARNING,
                    location=self._format_location(
                        paragraph_index=idx,
                        text_preview=text[:30]
                    ),
                    expected=f"{expected_before}pt",
                    actual=f"{actual_before}pt",
                    suggestion=f"Установите интервал до {expected_before}pt",
                    can_autocorrect=True
                ))
        elif expected_before > 0:
            issues.append(self._create_issue(
                rule_id=11,
                rule_name="Интервал до параграфа",
                description="Не задан интервал до параграфа",
                severity=Severity.INFO,
                location=self._format_location(paragraph_index=idx),
                expected=f"{expected_before}pt",
                actual="0pt",
                can_autocorrect=True
            ))

        # Проверка интервала после
        if space_after:
            actual_after = space_after.pt
            if abs(actual_after - expected_after) > tolerance:
                issues.append(self._create_issue(
                    rule_id=11,
                    rule_name="Интервал после параграфа",
                    description="Неправильный интервал после параграфа",
                    severity=Severity.WARNING,
                    location=self._format_location(
                        paragraph_index=idx,
                        text_preview=text[:30]
                    ),
                    expected=f"{expected_after}pt",
                    actual=f"{actual_after}pt",
                    suggestion=f"Установите интервал после {expected_after}pt",
                    can_autocorrect=True
                ))
        elif expected_after > 0:
            issues.append(self._create_issue(
                rule_id=11,
                rule_name="Интервал после параграфа",
                description="Не задан интервал после параграфа",
                severity=Severity.INFO,
                location=self._format_location(paragraph_index=idx),
                expected=f"{expected_after}pt",
                actual="0pt",
                can_autocorrect=True
            ))

        return issues

    def _check_manual_breaks(
        self,
        paragraph: Any,
        idx: int,
        text: str
    ) -> List[ValidationIssue]:
        """
        Проверяет наличие ручных переносов строк.

        Args:
            paragraph: Параграф
            idx: Индекс
            text: Текст

        Returns:
            Список проблем
        """
        issues = []

        # Проверяем наличие переносов строк внутри параграфа
        if '\n' in paragraph.text or '\r' in paragraph.text:
            issues.append(self._create_issue(
                rule_id=5,
                rule_name="Ручные переносы строк",
                description="Обнаружены ручные переносы строк внутри параграфа",
                severity=Severity.WARNING,
                location=self._format_location(
                    paragraph_index=idx,
                    text_preview=text[:50]
                ),
                suggestion="Удалите ручные переносы, используйте абзацы",
                can_autocorrect=True
            ))

        # Проверяем избыточные пробелы (более 2 подряд)
        if '   ' in text:  # 3+ пробела
            issues.append(self._create_issue(
                rule_id=5,
                rule_name="Множественные пробелы",
                description="Обнаружены множественные пробелы подряд",
                severity=Severity.WARNING,
                location=self._format_location(
                    paragraph_index=idx,
                    text_preview=text[:50]
                ),
                suggestion="Замените множественные пробелы на одинарные",
                can_autocorrect=True
            ))

        # Проверяем табуляции
        if '\t' in paragraph.text:
            issues.append(self._create_issue(
                rule_id=4,
                rule_name="Использование табуляции",
                description="Обнаружены символы табуляции",
                severity=Severity.INFO,
                location=self._format_location(
                    paragraph_index=idx,
                    text_preview=text[:50]
                ),
                suggestion="Используйте абзацный отступ вместо табуляции",
                can_autocorrect=True
            ))

        return issues

    def _get_alignment_from_config(self, config_value: str):
        """
        Преобразует строковое значение выравнивания из конфига в enum.

        Args:
            config_value: Значение из конфига ('left', 'center', 'right', 'justify')

        Returns:
            WD_PARAGRAPH_ALIGNMENT значение
        """
        alignment_map = {
            'left': WD_PARAGRAPH_ALIGNMENT.LEFT,
            'center': WD_PARAGRAPH_ALIGNMENT.CENTER,
            'right': WD_PARAGRAPH_ALIGNMENT.RIGHT,
            'justify': WD_PARAGRAPH_ALIGNMENT.JUSTIFY
        }

        return alignment_map.get(config_value.lower(), WD_PARAGRAPH_ALIGNMENT.JUSTIFY)

    def _get_alignment_name(self, alignment) -> str:
        """Возвращает название выравнивания"""
        if alignment is None:
            return "Не задано"

        alignment_map = {
            WD_PARAGRAPH_ALIGNMENT.LEFT: "По левому краю",
            WD_PARAGRAPH_ALIGNMENT.CENTER: "По центру",
            WD_PARAGRAPH_ALIGNMENT.RIGHT: "По правому краю",
            WD_PARAGRAPH_ALIGNMENT.JUSTIFY: "По ширине"
        }

        return alignment_map.get(alignment, f"Неизвестно ({alignment})")
