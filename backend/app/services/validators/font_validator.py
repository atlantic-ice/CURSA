"""
Валидатор для проверки форматирования шрифтов в документе.
"""

from typing import Dict, Any, List
import time
from . import BaseValidator, ValidationResult, ValidationIssue, Severity


class FontValidator(BaseValidator):
    """
    Валидатор для проверки соответствия шрифтов требованиям нормоконтроля.

    Проверяет:
    - Название шрифта (Times New Roman, Arial и т.д.)
    - Размер шрифта (обычно 14pt для основного текста)
    - Цвет шрифта (должен быть черным)
    - Консистентность шрифта по всему документу
    """

    @property
    def name(self) -> str:
        return "FontValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет форматирование шрифтов в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        # Получаем требования к шрифту из профиля
        required_font_name = self._get_rule_config("font.name", "Times New Roman")
        required_font_size = self._get_rule_config("font.size", 14.0)
        allowed_fonts = self._get_rule_config("font.allowed_fonts", [required_font_name])

        # Проверяем каждый параграф
        for idx, paragraph in enumerate(document.paragraphs):
            # Пропускаем пустые параграфы
            if not paragraph.text.strip():
                continue

            # Проверяем каждый run в параграфе
            for run in paragraph.runs:
                if not run.text.strip():
                    continue

                # Проверка названия шрифта
                font_name = run.font.name
                if font_name and font_name not in allowed_fonts:
                    issues.append(
                        self._create_issue(
                            rule_id=3,
                            rule_name="Название шрифта",
                            description=f"Используется недопустимый шрифт '{font_name}'",
                            severity=Severity.ERROR,
                            location=self._format_location(
                                paragraph_index=idx, text_preview=run.text[:50]
                            ),
                            expected=f"Один из: {', '.join(allowed_fonts)}",
                            actual=font_name,
                            suggestion=f"Измените шрифт на {required_font_name}",
                            can_autocorrect=True,
                        )
                    )

                # Проверка размера шрифта
                if run.font.size:
                    font_size_pt = run.font.size.pt

                    # Допускаем небольшое отклонение для заголовков
                    # Проверяем только для обычного текста
                    if not self._is_heading(paragraph):
                        if abs(font_size_pt - required_font_size) > 0.5:
                            issues.append(
                                self._create_issue(
                                    rule_id=2,
                                    rule_name="Размер шрифта",
                                    description=f"Неверный размер шрифта: {font_size_pt}pt",
                                    severity=Severity.ERROR,
                                    location=self._format_location(
                                        paragraph_index=idx, text_preview=run.text[:50]
                                    ),
                                    expected=f"{required_font_size}pt",
                                    actual=f"{font_size_pt}pt",
                                    suggestion=f"Установите размер шрифта {required_font_size}pt",
                                    can_autocorrect=True,
                                )
                            )

                # Проверка цвета шрифта (должен быть черным)
                if run.font.color and run.font.color.rgb:
                    rgb = run.font.color.rgb
                    # Черный цвет: (0, 0, 0)
                    if rgb != (0, 0, 0) and not self._is_heading(paragraph):
                        issues.append(
                            self._create_issue(
                                rule_id=3,
                                rule_name="Цвет шрифта",
                                description=f"Текст должен быть черного цвета, найден: {rgb}",
                                severity=Severity.WARNING,
                                location=self._format_location(
                                    paragraph_index=idx, text_preview=run.text[:50]
                                ),
                                expected="Черный (RGB: 0, 0, 0)",
                                actual=f"RGB: {rgb}",
                                suggestion="Измените цвет текста на черный",
                                can_autocorrect=True,
                            )
                        )

        # Проверяем таблицы (если есть)
        issues.extend(self._check_tables_font(document, required_font_name, allowed_fonts))

        execution_time = time.time() - start_time
        passed = len(issues) == 0

        return ValidationResult(
            validator_name=self.name, passed=passed, issues=issues, execution_time=execution_time
        )

    def _is_heading(self, paragraph) -> bool:
        """
        Проверяет, является ли параграф заголовком.

        Args:
            paragraph: Параграф документа

        Returns:
            True если параграф - заголовок
        """
        style_name = paragraph.style.name.lower() if paragraph.style else ""
        return "heading" in style_name or "заголовок" in style_name

    def _check_tables_font(
        self, document: Any, required_font_name: str, allowed_fonts: List[str]
    ) -> List[ValidationIssue]:
        """
        Проверяет шрифты в таблицах.

        Args:
            document: Document объект
            required_font_name: Требуемое название шрифта
            allowed_fonts: Список допустимых шрифтов

        Returns:
            Список найденных проблем
        """
        issues = []

        # Таблицам может быть разрешен меньший размер шрифта
        table_font_size = self._get_rule_config("tables.font_size", 12.0)
        min_table_font_size = self._get_rule_config("tables.min_font_size", 10.0)

        for table_idx, table in enumerate(document.tables):
            for row_idx, row in enumerate(table.rows):
                for cell_idx, cell in enumerate(row.cells):
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            if not run.text.strip():
                                continue

                            # Проверка названия шрифта
                            font_name = run.font.name
                            if font_name and font_name not in allowed_fonts:
                                issues.append(
                                    self._create_issue(
                                        rule_id=3,
                                        rule_name="Шрифт в таблице",
                                        description=f"В таблице используется недопустимый шрифт '{font_name}'",
                                        severity=Severity.WARNING,
                                        location=self._format_location(
                                            table_index=table_idx,
                                            row_index=row_idx,
                                            cell_index=cell_idx,
                                            text_preview=run.text[:30],
                                        ),
                                        expected=f"Один из: {', '.join(allowed_fonts)}",
                                        actual=font_name,
                                        can_autocorrect=True,
                                    )
                                )

                            # Проверка размера шрифта в таблице
                            if run.font.size:
                                font_size_pt = run.font.size.pt
                                if font_size_pt < min_table_font_size:
                                    issues.append(
                                        self._create_issue(
                                            rule_id=24,
                                            rule_name="Размер шрифта в таблице",
                                            description=f"Слишком мелкий шрифт в таблице: {font_size_pt}pt",
                                            severity=Severity.WARNING,
                                            location=self._format_location(
                                                table_index=table_idx,
                                                row_index=row_idx,
                                                cell_index=cell_idx,
                                            ),
                                            expected=f"Не менее {min_table_font_size}pt",
                                            actual=f"{font_size_pt}pt",
                                            can_autocorrect=True,
                                        )
                                    )

        return issues
