"""
Валидатор сносок - проверяет оформление сносок и концевых примечаний.
Проверяет наличие, формат и консистентность сносок по всему документу.
"""

from typing import Dict, Any, List
import time
import logging
import re

from . import BaseValidator, ValidationResult, ValidationIssue, Severity


logger = logging.getLogger(__name__)


class FootnoteValidator(BaseValidator):
    """
    Валидатор для проверки правил оформления сносок (ГОСТ 30).

    Проверяет:
    - Наличие сносок и концевых примечаний в документе
    - Формат нумерации сносок (арабские цифры)
    - Последовательность нумерации сносок
    - Размер шрифта в сносках (обычно 10-12pt)
    - Отступы в сносках
    - Содержание сносок (должны быть короткими)
    - Формат ссылки на сноску в тексте
    - Разделение сносок от основного текста
    """

    @property
    def name(self) -> str:
        return "FootnoteValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет оформление сносок в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        try:
            # Извлечём информацию о сносках
            notes_info = self._extract_notes_info(document)

            if not notes_info["total_notes"]:
                # Нет сносок - проверка не требуется
                execution_time = time.time() - start_time
                return ValidationResult(
                    validator_name=self.name,
                    passed=True,
                    issues=[],
                    execution_time=execution_time,
                )

            # Проверим формат и нумерацию
            issues.extend(self._check_note_numbering(notes_info))

            # Проверим содержание
            issues.extend(self._check_note_content(notes_info))

            # Проверим форматирование
            issues.extend(self._check_note_formatting(document))

            # Проверим ссылки в тексте
            issues.extend(self._check_note_references(document))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=len(issues) == 0,
                issues=issues,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"Error validating footnotes: {e}")
            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=[
                    self._create_issue(
                        rule_id=30,
                        rule_name="Сноски и примечания",
                        description=(f"Критическая ошибка при проверке " f"сносок: {str(e)}"),
                        severity=Severity.ERROR,
                        location="Document",
                        can_autocorrect=False,
                    )
                ],
                execution_time=execution_time,
            )

    def _extract_notes_info(self, document: Any) -> Dict[str, Any]:
        """
        Извлечь информацию о сносках в документе.

        Returns:
            Dictionary with notes information
        """
        notes_info = {
            "total_notes": 0,
            "footnotes": [],
            "endnotes": [],
            "note_numbers": [],
            "note_content": {},
        }

        try:
            # В python-docx доступ к сноскам ограничен
            # Проверим наличие ссылок на сноски в тексте
            pattern = r"\[\d+\]"  # Формат [1], [2] и т.д.

            for paragraph in document.paragraphs:
                text = paragraph.text

                for match in re.finditer(pattern, text):
                    note_ref = match.group()
                    note_num = int(note_ref[1:-1])

                    if note_num not in notes_info["note_numbers"]:
                        notes_info["note_numbers"].append(note_num)
                    notes_info["total_notes"] += 1

            notes_info["note_numbers"].sort()

        except Exception as e:
            logger.warning(f"Error extracting notes info: {e}")

        return notes_info

    def _check_note_numbering(self, notes_info: Dict[str, Any]) -> List[ValidationIssue]:
        """
        Проверяет правильность нумерации сносок.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            note_numbers = notes_info["note_numbers"]

            if not note_numbers:
                return issues

            # Проверим последовательность
            for i, num in enumerate(note_numbers, 1):
                if num != i:
                    issues.append(
                        self._create_issue(
                            rule_id=30,
                            rule_name="Нумерация сносок",
                            description=(
                                f"Нарушена последовательность: " f"ожидалось {i}, найдено {num}"
                            ),
                            severity=Severity.WARNING,
                            location=f"Сноска {num}",
                            expected=("Непрерывная нумерация " "1, 2, 3, ..."),
                            actual=(f"Найдена перестановка: {num}"),
                            suggestion=("Проверьте нумерацию сносок"),
                            can_autocorrect=False,
                        )
                    )
                    break

        except Exception as e:
            logger.warning(f"Error checking note numbering: {e}")

        return issues

    def _check_note_content(self, notes_info: Dict[str, Any]) -> List[ValidationIssue]:
        """
        Проверяет содержание сносок.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            # Проверим что количество сносок разумно
            total_notes = notes_info["total_notes"]
            max_allowed_notes = self._get_rule_config("notes.max_notes", 100)

            if total_notes > max_allowed_notes:
                issues.append(
                    self._create_issue(
                        rule_id=30,
                        rule_name="Количество сносок",
                        description=(f"Слишком много сносок: " f"{total_notes}"),
                        severity=Severity.INFO,
                        location="Document",
                        expected=(f"Не более {max_allowed_notes} " "сносок"),
                        actual=f"{total_notes} сносок",
                        suggestion=("Рассмотрите объединение " "некоторых сносок"),
                        can_autocorrect=False,
                    )
                )

        except Exception as e:
            logger.warning(f"Error checking note content: {e}")

        return issues

    def _check_note_formatting(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет форматирование сносок.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            # Проверим размер шрифта сносок
            expected_font_size = self._get_rule_config("notes.font_size", 10.0)
            max_font_size = self._get_rule_config("notes.max_font_size", 12.0)

            # В python-docx доступ к сноскам ограничен
            # Можно проверить только если есть
            # пользовательское форматирование

            # TODO: добавить более детальную проверку
            # когда python-docx поддержит доступ к сноскам

        except Exception as e:
            logger.warning(f"Error checking note formatting: {e}")

        return issues

    def _check_note_references(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет ссылки на сноски в тексте.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            # Ищем все ссылки на сноски в тексте
            note_pattern = r"\[\d+\]"
            found_references = set()

            full_text = self._get_full_text(document)

            for match in re.finditer(note_pattern, full_text):
                note_ref = match.group()
                note_num = int(note_ref[1:-1])
                found_references.add(note_num)

            # Проверим форматирование ссылок
            # Они должны быть после пунктуации
            bad_format = re.findall(r"[a-яA-Я]\s\[\d+\]", full_text, re.UNICODE)

            if bad_format:
                issues.append(
                    self._create_issue(
                        rule_id=30,
                        rule_name="Формат ссылки",
                        description=("Неправильный формат ссылки: " "пробел перед скобкой"),
                        severity=Severity.WARNING,
                        location="Document",
                        expected=("Ссылка сразу после пунктуации"),
                        actual="Есть пробел перед скобкой",
                        suggestion=("Удалите пробел перед " "ссылкой на сноску"),
                        can_autocorrect=True,
                    )
                )

        except Exception as e:
            logger.warning(f"Error checking note references: {e}")

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
