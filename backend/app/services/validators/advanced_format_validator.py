"""
Валидатор расширенного форматирования документа.
Проверяет отступы, табуляцию, переносы, оформление источников и ссылок.
"""

from typing import Dict, Any, List
import time
import logging
import re

from . import BaseValidator, ValidationResult, ValidationIssue, Severity


logger = logging.getLogger(__name__)


class AdvancedFormatValidator(BaseValidator):
    """
    Валидатор для проверки расширенного форматирования (ГОСТ 6,7,12,25-27).

    Проверяет:
    - Отступы и выравнивание (правило 6)
    - Использование табуляции (правило 7)
    - Переносы слов (правило 12)
    - Оформление источников (правило 25)
    - Оформление ссылок (правило 26)
    - Перекрестные ссылки (правило 27)
    """

    @property
    def name(self) -> str:
        return "AdvancedFormatValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет расширенное форматирование документа.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        try:
            # Проверим отступы
            issues.extend(self._check_indents(document))

            # Проверим табуляцию
            issues.extend(self._check_tabs(document))

            # Проверим переносы
            issues.extend(self._check_hyphens(document))

            # Проверим оформление источников
            issues.extend(self._check_source_format(document))

            # Проверим ссылки
            issues.extend(self._check_references(document))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=len(issues) == 0,
                issues=issues,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"Error in advanced format validation: {e}")
            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=[
                    self._create_issue(
                        rule_id=6,
                        rule_name="Расширенное форматирование",
                        description=(
                            f"Критическая ошибка при проверке " f"форматирования: {str(e)}"
                        ),
                        severity=Severity.ERROR,
                        location="Document",
                        can_autocorrect=False,
                    )
                ],
                execution_time=execution_time,
            )

    def _check_indents(self, document: Any) -> List[ValidationIssue]:
        """
        Проверить правильность отступов в документе.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            for para_idx, para in enumerate(document.paragraphs, 1):
                if not para.text.strip():
                    continue

                # Проверим на неправильные отступы (больше 2 см)
                if para.paragraph_format.left_indent:
                    # Конвертируем в сантиметры
                    indent_cm = (
                        para.paragraph_format.left_indent.cm
                        if hasattr(para.paragraph_format.left_indent, "cm")
                        else 0
                    )

                    if indent_cm > 3.0:
                        issues.append(
                            self._create_issue(
                                rule_id=6,
                                rule_name="Отступы",
                                description=(
                                    f"Параграф {para_idx}: "
                                    f"отступ слишком большой ({indent_cm:.1f} см)"
                                ),
                                severity=Severity.WARNING,
                                location=f"Параграф {para_idx}",
                                can_autocorrect=False,
                            )
                        )

        except Exception as e:
            logger.warning(f"Error checking indents: {e}")

        return issues

    def _check_tabs(self, document: Any) -> List[ValidationIssue]:
        """
        Проверить использование табуляции в документе.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            for para_idx, para in enumerate(document.paragraphs, 1):
                text = para.text

                # Ищем символ табуляции
                if "\t" in text:
                    issues.append(
                        self._create_issue(
                            rule_id=7,
                            rule_name="Табуляция",
                            description=(
                                f"Параграф {para_idx}: "
                                f"обнаружено использование табуляции. "
                                f"Используйте отступы вместо табов"
                            ),
                            severity=Severity.WARNING,
                            location=f"Параграф {para_idx}",
                            suggestion=(
                                "Замените табуляцию на отступы "
                                "или используйте предусмотренные стили"
                            ),
                            can_autocorrect=True,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking tabs: {e}")

        return issues

    def _check_hyphens(self, document: Any) -> List[ValidationIssue]:
        """
        Проверить правильность переносов в словах.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            # Ищем мягкие переносы
            for para_idx, para in enumerate(document.paragraphs, 1):
                text = para.text

                # Мягкий перенос (U+00AD или специальный символ)
                if "\xad" in text or "­" in text:
                    issues.append(
                        self._create_issue(
                            rule_id=12,
                            rule_name="Переносы",
                            description=(
                                f"Параграф {para_idx}: " f"обнаружен ручной перенос слова"
                            ),
                            severity=Severity.INFO,
                            location=f"Параграф {para_idx}",
                            suggestion=(
                                "Избегайте ручных переносов, " "используйте автоматический перенос"
                            ),
                            can_autocorrect=True,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking hyphens: {e}")

        return issues

    def _check_source_format(self, document: Any) -> List[ValidationIssue]:
        """
        Проверить оформление источников (правило 25).

        Returns:
            List of validation issues
        """
        issues = []

        try:
            full_text = self._get_full_text(document)

            # Найдём раздел "Список литературы"
            bibliography_match = re.search(
                r"(?:Список\s+литературы|Литература|References)", full_text, re.IGNORECASE
            )

            if not bibliography_match:
                # Нет явной критики если нет списка
                return issues

            # Извлечём текст после списка литературы
            start_pos = bibliography_match.start()
            bib_section = full_text[start_pos:]

            # Проверим на проблемы в оформлении
            # Ищем источники с неправильным форматом

            # Проверим на отсутствие: авторов, названия, года
            lines = bib_section.split("\n")
            for line_idx, line in enumerate(lines[1:], 1):
                line = line.strip()

                if not line or line.startswith("Рисунок") or line.startswith("Таблица"):
                    break

                # Хeuristic: источник должен содержать число (год)
                if line and not re.search(r"\d{4}", line):
                    issues.append(
                        self._create_issue(
                            rule_id=25,
                            rule_name="Оформление источников",
                            description=(
                                f"Источник в списке литературы "
                                f"может быть неполным: отсутствует год"
                            ),
                            severity=Severity.WARNING,
                            location="Список литературы",
                            can_autocorrect=False,
                        )
                    )
                    break

        except Exception as e:
            logger.warning(f"Error checking source format: {e}")

        return issues

    def _check_references(self, document: Any) -> List[ValidationIssue]:
        """
        Проверить оформление ссылок (правила 26-27).

        Returns:
            List of validation issues
        """
        issues = []

        try:
            full_text = self._get_full_text(document)

            # Ищем ссылки в квадратных скобках [1], [2,3], [1-3]
            citation_pattern = re.compile(r"\[[\d,\-\s]+\]")
            citations = citation_pattern.findall(full_text)

            if not citations:
                # Нет ссылок - возможно, они использованы в другом формате
                return issues

            # Проверим на последовательность ссылок
            citation_numbers = []
            for citation in citations:
                # Извлечём числа из [1], [2,3], [1-3]
                numbers = re.findall(r"\d+", citation)
                citation_numbers.extend([int(n) for n in numbers])

            if citation_numbers:
                # Проверим на возрастающий порядок
                for i in range(1, len(citation_numbers)):
                    if citation_numbers[i] < citation_numbers[i - 1]:
                        issues.append(
                            self._create_issue(
                                rule_id=26,
                                rule_name="Оформление ссылок",
                                description=(f"Нарушена последовательность " f"нумерации ссылок"),
                                severity=Severity.WARNING,
                                location="Основной текст",
                                can_autocorrect=False,
                            )
                        )
                        break

        except Exception as e:
            logger.warning(f"Error checking references: {e}")

        return issues

    def _get_full_text(self, document: Any) -> str:
        """
        Получить весь текст документа.

        Returns:
            Full document text
        """
        try:
            paragraphs = []
            for para in document.paragraphs:
                if para.text.strip():
                    paragraphs.append(para.text)

            # Включим текст из таблиц
            for table in document.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for para in cell.paragraphs:
                            if para.text.strip():
                                paragraphs.append(para.text)

            return "\n".join(paragraphs)

        except Exception as e:
            logger.warning(f"Error getting text: {e}")
            return ""
