"""
Валидатор разрывов страниц - проверяет правильность размещения разрывов.
Проверяет что разрывы находятся в начале глав и отсутствуют в неправильных местах.
"""

from typing import Dict, Any, List
import time
import logging
import re

from . import BaseValidator, ValidationResult, ValidationIssue, Severity


logger = logging.getLogger(__name__)


class PageBreakValidator(BaseValidator):
    """
    Валидатор для проверки правил размещения разрывов (ГОСТ 10).

    Проверяет:
    - Наличие разрыва перед каждой главой
    - Отсутствие разрывов внутри разделов
    - Отсутствие разрывов перед таблицами
    - Отсутствие пустых страниц
    - Консистентность размещения разрывов
    - Отсутствие нескольких разрывов подряд
    """

    @property
    def name(self) -> str:
        return "PageBreakValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет правильность разрывов страниц в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        try:
            # Найдём все разрывы и заголовки
            breaks_info = self._find_page_breaks(document)
            headings = self._find_chapter_headings(document)

            if not headings:
                # Нет глав - проверка не требуется
                execution_time = time.time() - start_time
                return ValidationResult(
                    validator_name=self.name,
                    passed=True,
                    issues=[],
                    execution_time=execution_time,
                )

            # Проверим наличие разрывов перед главами
            issues.extend(self._check_breaks_before_chapters(document, headings, breaks_info))

            # Проверим отсутствие неправильных разрывов
            issues.extend(self._check_invalid_breaks(document, headings, breaks_info))

            # Проверим отсутствие пустых страниц
            issues.extend(self._check_empty_pages(document, breaks_info))

            # Проверим отсутствие нескольких разрывов
            issues.extend(self._check_multiple_breaks(breaks_info))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=len(issues) == 0,
                issues=issues,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"Error validating page breaks: {e}")
            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=[
                    self._create_issue(
                        rule_id=10,
                        rule_name="Разрывы страниц",
                        description=(f"Критическая ошибка при проверке " f"разрывов: {str(e)}"),
                        severity=Severity.ERROR,
                        location="Document",
                        can_autocorrect=False,
                    )
                ],
                execution_time=execution_time,
            )

    def _find_page_breaks(self, document: Any) -> Dict[str, Any]:
        """
        Найти все разрывы страниц в документе.

        Returns:
            Dictionary with break information
        """
        breaks_info = {
            "total_breaks": 0,
            "break_indices": [],
            "break_types": {},
        }

        try:
            for para_idx, paragraph in enumerate(document.paragraphs):
                # Проверим разрыв через paragraph_format
                if (
                    hasattr(
                        paragraph.paragraph_format,
                        "page_break_before",
                    )
                    and paragraph.paragraph_format.page_break_before
                ):
                    breaks_info["total_breaks"] += 1
                    breaks_info["break_indices"].append(para_idx)
                    breaks_info["break_types"][para_idx] = "format"

                # Проверим разрыв в runs (горячие клавиши)
                for run in paragraph.runs:
                    # Разрыв кодируется как '\x0c' или '\x000c'
                    if "\f" in run.text or "\x0c" in run.text:
                        breaks_info["total_breaks"] += 1
                        if para_idx not in breaks_info["break_indices"]:
                            breaks_info["break_indices"].append(para_idx)
                        breaks_info["break_types"][para_idx] = "run"

        except Exception as e:
            logger.warning(f"Error finding page breaks: {e}")

        return breaks_info

    def _find_chapter_headings(self, document: Any) -> List[Dict[str, Any]]:
        """
        Найти все заголовки глав в документе.

        Returns:
            List of chapter heading information
        """
        headings = []

        try:
            for para_idx, paragraph in enumerate(document.paragraphs):
                text = paragraph.text.strip()

                if not text:
                    continue

                # Проверим стиль параграфа
                style_name = paragraph.style.name if paragraph.style else ""

                # Ищем заголовки с номерами (Глава, 1, 1.1 и т.д.)
                is_chapter = False

                # Проверим стиль Heading
                if "heading" in style_name.lower():
                    is_chapter = True

                # Проверим паттерны глав
                chapter_patterns = [
                    r"^(ГЛАВА|CHAPTER)\s+\d+",
                    r"^[IVX]+\.?\s+",  # Римские цифры
                    r"^\d+\.?\s+[A-ZА-Я]",  # 1. Название
                ]

                for pattern in chapter_patterns:
                    if re.match(pattern, text, re.IGNORECASE | re.UNICODE):
                        is_chapter = True
                        break

                if is_chapter:
                    headings.append(
                        {
                            "index": para_idx,
                            "text": text,
                            "style": style_name,
                        }
                    )

        except Exception as e:
            logger.warning(f"Error finding chapter headings: {e}")

        return headings

    def _check_breaks_before_chapters(
        self,
        document: Any,
        headings: List[Dict[str, Any]],
        breaks_info: Dict[str, Any],
    ) -> List[ValidationIssue]:
        """
        Проверяет наличие разрывов перед главами.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            break_indices = breaks_info["break_indices"]

            # Пропустим первый раздел (может быть без разрыва)
            for heading_idx, heading in enumerate(headings[1:], 1):
                para_idx = heading["index"]

                # Проверим есть ли разрыв перед этой главой
                # Разрыв должен быть перед параграфом или в нём
                has_break = para_idx in break_indices or (
                    para_idx > 0 and (para_idx - 1) in break_indices
                )

                if not has_break:
                    issues.append(
                        self._create_issue(
                            rule_id=10,
                            rule_name="Разрыв перед главой",
                            description=(
                                f"Отсутствует разрыв " f"перед главой " f"{heading['text'][:30]}"
                            ),
                            severity=Severity.WARNING,
                            location=(f"Параграф {para_idx}"),
                            expected=("Разрыв перед главой"),
                            actual=("Разрыв отсутствует"),
                            suggestion=("Добавьте разрыв " "перед заголовком"),
                            can_autocorrect=True,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking chapter breaks: {e}")

        return issues

    def _check_invalid_breaks(
        self,
        document: Any,
        headings: List[Dict[str, Any]],
        breaks_info: Dict[str, Any],
    ) -> List[ValidationIssue]:
        """
        Проверяет отсутствие неправильно размещённых разрывов.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            break_indices = breaks_info["break_indices"]
            heading_indices = {h["index"] for h in headings}

            for break_idx in break_indices:
                # Проверим что разрыв находится перед заголовком
                is_before_heading = break_idx in heading_indices or (
                    break_idx < len(document.paragraphs) - 1 and (break_idx + 1) in heading_indices
                )

                if not is_before_heading:
                    # Разрыв в неправильном месте
                    para = document.paragraphs[break_idx]
                    text = para.text[:50]

                    issues.append(
                        self._create_issue(
                            rule_id=10,
                            rule_name=("Неправильный разрыв"),
                            description=(f"Разрыв не перед главой: " f"{text}"),
                            severity=Severity.INFO,
                            location=(f"Параграф {break_idx}"),
                            expected=("Разрывы только " "перед главами"),
                            actual=("Разрыв в тексте"),
                            suggestion=("Проверьте размещение " "разрыва"),
                            can_autocorrect=False,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking invalid breaks: {e}")

        return issues

    def _check_empty_pages(
        self, document: Any, breaks_info: Dict[str, Any]
    ) -> List[ValidationIssue]:
        """
        Проверяет отсутствие пустых страниц.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            # Пустая страница обычно означает
            # несколько разрывов подряд или пустые параграфы
            break_indices = breaks_info["break_indices"]

            if len(break_indices) < 2:
                return issues

            # Проверим есть ли разрывы подряд
            for i in range(len(break_indices) - 1):
                curr_idx = break_indices[i]
                next_idx = break_indices[i + 1]

                # Если разрывы близко друг к другу
                if next_idx - curr_idx <= 3:
                    # Скорее всего есть пустая страница
                    issues.append(
                        self._create_issue(
                            rule_id=10,
                            rule_name=("Пустая страница"),
                            description=(
                                "Обнаружена вероятная " "пустая страница " "между разрывами"
                            ),
                            severity=Severity.WARNING,
                            location=(f"Между {curr_idx} " f"и {next_idx}"),
                            expected=("Нет пустых страниц"),
                            actual="Пустая страница",
                            suggestion=("Удалите пустые " "параграфы между разрывами"),
                            can_autocorrect=True,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking empty pages: {e}")

        return issues

    def _check_multiple_breaks(self, breaks_info: Dict[str, Any]) -> List[ValidationIssue]:
        """
        Проверяет отсутствие нескольких разрывов подряд.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            break_indices = breaks_info["break_indices"]

            if len(break_indices) < 2:
                return issues

            prev_idx = break_indices[0]

            for break_idx in break_indices[1:]:
                # Если разрывы очень близко (в пределах 1-2)
                if break_idx - prev_idx <= 2:
                    issues.append(
                        self._create_issue(
                            rule_id=10,
                            rule_name=("Несколько разрывов"),
                            description=("Найдено несколько " "разрывов подряд"),
                            severity=Severity.WARNING,
                            location=(f"Параграфы " f"{prev_idx}-{break_idx}"),
                            expected=("Один разрыв " "перед главой"),
                            actual=(
                                f"Несколько разрывов " f"({break_idx - prev_idx} " f"параграфов)"
                            ),
                            suggestion=("Удалите лишние " "разрывы"),
                            can_autocorrect=True,
                        )
                    )

                prev_idx = break_idx

        except Exception as e:
            logger.warning(f"Error checking multiple breaks: {e}")

        return issues
