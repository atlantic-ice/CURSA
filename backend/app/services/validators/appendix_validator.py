"""
Валидатор приложений - проверяет правила оформления приложений.
Проверяет наличие, нумерацию и оформление приложений в документе.
"""

from typing import Dict, Any, List
import time
import logging
import re

from . import BaseValidator, ValidationResult, ValidationIssue, Severity


logger = logging.getLogger(__name__)


class AppendixValidator(BaseValidator):
    """
    Валидатор для проверки правил оформления приложений (ГОСТ 22-23).

    Проверяет:
    - Наличие приложений в документе
    - Правильность нумерации (ПРИЛОЖЕНИЕ А, ПРИЛОЖЕНИЕ Б и т.д.)
    - Наличие ссылок на приложения в основном тексте
    - Правильность оформления заголовков приложений
    - Последовательность нумерации
    """

    @property
    def name(self) -> str:
        return "AppendixValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет оформление приложений в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        try:
            # Найдём все приложения в документе
            appendices = self._find_appendices(document)
            appendix_references = self._find_appendix_references_in_text(document)

            if not appendices:
                # Нет приложений - это нормально
                execution_time = time.time() - start_time
                return ValidationResult(
                    validator_name=self.name, passed=True, issues=[], execution_time=execution_time
                )

            # Проверим нумерацию приложений
            issues.extend(self._check_appendix_numbering(appendices))

            # Проверим формат заголовков приложений
            issues.extend(self._check_appendix_headers(appendices))

            # Проверим согласованность ссылок
            issues.extend(self._check_appendix_references(appendix_references, len(appendices)))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=len(issues) == 0,
                issues=issues,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"Error validating appendices: {e}")
            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=[
                    self._create_issue(
                        rule_id=22,
                        rule_name="Приложения",
                        description=(f"Критическая ошибка при проверке " f"приложений: {str(e)}"),
                        severity=Severity.ERROR,
                        location="Document",
                        can_autocorrect=False,
                    )
                ],
                execution_time=execution_time,
            )

    def _find_appendices(self, document: Any) -> List[Dict[str, Any]]:
        """
        Найти все приложения в документе.
        Ищет паттерны вида "ПРИЛОЖЕНИЕ А", "ПРИЛОЖЕНИЕ 1" и т.д.

        Returns:
            List of appendix information
        """
        appendices = []
        full_text = self._get_full_text(document)

        # Паттерны для поиска приложений
        patterns = [
            # ПРИЛОЖЕНИЕ А, ПРИЛОЖЕНИЕ Б и т.д.
            r"^\s*ПРИЛОЖЕНИЕ\s+([А-Я])\s*[-–—:]*\s*(.+?)$",
            # ПРИЛОЖЕНИЕ 1, ПРИЛОЖЕНИЕ 2 и т.д.
            r"^\s*ПРИЛОЖЕНИЕ\s+(\d+)\s*[-–—:]*\s*(.+?)$",
            # Appendix A, Appendix 1 (английский)
            r"^\s*(?:APPENDIX|Appendix)\s+([А-Я\d])\s*[-–—:]*\s*(.+?)$",
        ]

        try:
            for line in full_text.split("\n"):
                line = line.strip()
                if not line:
                    continue

                for pattern in patterns:
                    match = re.match(pattern, line, re.IGNORECASE)
                    if match:
                        try:
                            letter_or_num = match.group(1)
                            title = match.group(2).strip()

                            appendix_info = {
                                "letter": letter_or_num,
                                "title": title,
                                "line": line,
                                "is_letter": letter_or_num.isalpha(),
                            }
                            appendices.append(appendix_info)
                        except (IndexError, AttributeError):
                            continue

            return appendices

        except Exception as e:
            logger.warning(f"Error finding appendices: {e}")
            return []

    def _find_appendix_references_in_text(self, document: Any) -> List[str]:
        """
        Найти все ссылки на приложения в тексте документа.

        Returns:
            List of appendix letters/numbers referenced in text
        """
        references = []

        # Паттерны для поиска ссылок на приложения
        patterns = [
            r"(?:в|из|см)\s+ПРИЛОЖЕН(?:ИИ|ИЕ)\s+([А-Я\d])",
            r"ПРИЛОЖЕН(?:ИИ|ИЕ)\s+([А-Я\d])",
            r"(?:in|from|see)\s+APPENDIX\s+([А-Я\d])",
            r"Appendix\s+([А-Я\d])",
        ]

        try:
            full_text = self._get_full_text(document)

            for pattern in patterns:
                for match in re.finditer(pattern, full_text, re.IGNORECASE):
                    try:
                        ref = match.group(1)
                        if ref not in references:
                            references.append(ref)
                    except (IndexError, AttributeError):
                        continue

            return references

        except Exception as e:
            logger.warning(f"Error finding appendix references: {e}")
            return []

    def _check_appendix_numbering(self, appendices: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """
        Проверить правильность нумерации приложений.

        Returns:
            List of validation issues
        """
        issues = []

        if not appendices:
            return issues

        try:
            # Проверим что все приложения используют один стиль
            # (либо буквы, либо цифры)
            use_letters = appendices[0]["is_letter"]

            for i, app in enumerate(appendices):
                if app["is_letter"] != use_letters:
                    desc = "Смешанный стиль нумерации приложений: " "используются и буквы и цифры"
                    issues.append(
                        self._create_issue(
                            rule_id=22,
                            rule_name="Приложения",
                            description=desc,
                            severity=Severity.ERROR,
                            location="Приложения",
                            can_autocorrect=False,
                        )
                    )
                    break

            # Если буквы - проверим последовательность
            if use_letters:
                letters = [app["letter"] for app in appendices]
                expected_letters = [chr(ord("А") + i) for i in range(len(letters))]

                if letters != expected_letters:
                    desc = (
                        f"Нарушена последовательность букв "
                        f"приложений: ожидается {expected_letters}, "
                        f"найдено {letters}"
                    )
                    issues.append(
                        self._create_issue(
                            rule_id=22,
                            rule_name="Приложения",
                            description=desc,
                            severity=Severity.WARNING,
                            location="Приложения",
                            can_autocorrect=False,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking numbering: {e}")

        return issues

    def _check_appendix_headers(self, appendices: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """
        Проверить правильность оформления заголовков приложений.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            for app in appendices:
                line = app["line"]

                # Проверим что заголовок написан
                # ПРОПИСНЫМИ буквами
                if "ПРИЛОЖЕНИЕ" not in line:
                    # Может быть в нижнем регистре
                    desc = "Заголовок приложения должен быть " "в ПРОПИСНЫХ буквах"
                    issues.append(
                        self._create_issue(
                            rule_id=22,
                            rule_name="Приложения",
                            description=desc,
                            severity=Severity.WARNING,
                            location=f"Приложение {app['letter']}",
                            can_autocorrect=False,
                        )
                    )

                # Проверим что есть название
                if not app["title"]:
                    desc = f"Приложение {app['letter']}: " f"отсутствует название приложения"
                    issues.append(
                        self._create_issue(
                            rule_id=22,
                            rule_name="Приложения",
                            description=desc,
                            severity=Severity.WARNING,
                            location=f"Приложение {app['letter']}",
                            can_autocorrect=False,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking headers: {e}")

        return issues

    def _check_appendix_references(
        self, references: List[str], total_appendices: int
    ) -> List[ValidationIssue]:
        """
        Проверить что все приложения ссылаются в тексте.

        Returns:
            List of validation issues
        """
        issues = []

        if not references and total_appendices > 0:
            desc = f"В документе {total_appendices} приложений, " f"но они не упоминаются в тексте"
            issues.append(
                self._create_issue(
                    rule_id=22,
                    rule_name="Приложения",
                    description=desc,
                    severity=Severity.WARNING,
                    location="Document",
                    can_autocorrect=False,
                )
            )

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
