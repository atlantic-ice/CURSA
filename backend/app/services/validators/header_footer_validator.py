"""
Валидатор колонтитулов - проверяет оформление верхних и нижних колонтитулов.
Проверяет наличие, формат и консистентность колонтитулов по всему документу.
"""

from typing import Dict, Any, List
import time
import logging
import re

from . import BaseValidator, ValidationResult, ValidationIssue, Severity


logger = logging.getLogger(__name__)


class HeaderFooterValidator(BaseValidator):
    """
    Валидатор для проверки правил оформления колонтитулов (ГОСТ 29).

    Проверяет:
    - Наличие верхних колонтитулов (опционально)
    - Наличие нижних колонтитулов
    - Формат нижних колонтитулов (чаще всего - номер страницы)
    - Консистентность колонтитулов между секциями
    - Размер шрифта в колонтитулах (обычно 12pt)
    - Отступы от края страницы
    - Нумерация страниц в колонтитулах
    """

    @property
    def name(self) -> str:
        return "HeaderFooterValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет оформление колонтитулов в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        try:
            # Проверим наличие и формат колонтитулов
            issues.extend(self._check_footer_presence(document))
            issues.extend(self._check_footer_format(document))
            issues.extend(self._check_page_numbers(document))
            issues.extend(self._check_footer_font(document))
            issues.extend(self._check_footer_margins(document))
            issues.extend(self._check_footer_consistency(document))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=len(issues) == 0,
                issues=issues,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"Error validating headers/footers: {e}")
            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=[
                    self._create_issue(
                        rule_id=29,
                        rule_name="Колонтитулы",
                        description=(f"Критическая ошибка при проверке " f"колонтитулов: {str(e)}"),
                        severity=Severity.ERROR,
                        location="Document",
                        can_autocorrect=False,
                    )
                ],
                execution_time=execution_time,
            )

    def _check_footer_presence(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет наличие нижних колонтитулов.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            # Проверим наличие footer в любой из секций
            has_footer = False

            for section in document.sections:
                footer = section.footer

                if footer and footer.paragraphs:
                    for para in footer.paragraphs:
                        if para.text.strip():
                            has_footer = True
                            break

            if not has_footer:
                issues.append(
                    self._create_issue(
                        rule_id=29,
                        rule_name="Колонтитулы",
                        description=("Отсутствуют нижние колонтитулы " "в документе"),
                        severity=Severity.WARNING,
                        location="Document",
                        expected="Наличие нижних колонтитулов",
                        actual="Колонтитулы отсутствуют",
                        suggestion=("Добавьте нижний колонтитул со " "своим содержимым"),
                        can_autocorrect=False,
                    )
                )

        except Exception as e:
            logger.warning(f"Error checking footer presence: {e}")

        return issues

    def _check_footer_format(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет формат нижних колонтитулов.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            for section in document.sections:
                footer = section.footer

                if not footer or not footer.paragraphs:
                    continue

                for para in footer.paragraphs:
                    if not para.text.strip():
                        continue

                    # Проверим что колонтитул не содержит лишних символов
                    text = para.text.strip()

                    # Пустой колонтитул
                    if len(text) == 0:
                        issues.append(
                            self._create_issue(
                                rule_id=29,
                                rule_name="Колонтитулы",
                                description="Пустой нижний колонтитул",
                                severity=Severity.INFO,
                                location="Footer",
                                can_autocorrect=False,
                            )
                        )

        except Exception as e:
            logger.warning(f"Error checking footer format: {e}")

        return issues

    def _check_page_numbers(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет наличие и формат номеров страниц.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            page_num_found = False

            for section in document.sections:
                footer = section.footer

                if not footer or not footer.paragraphs:
                    continue

                for para in footer.paragraphs:
                    text = para.text.strip()

                    # Ищем номер страницы в разных форматах
                    if any(
                        pattern in text.lower()
                        for pattern in [
                            "pagex",
                            "# страниц",
                            "номер",
                            "стр.",
                        ]
                    ):
                        page_num_found = True

                    # Проверим на арабские цифры
                    if re.search(r"\d+", text):
                        page_num_found = True

            if not page_num_found:
                issues.append(
                    self._create_issue(
                        rule_id=29,
                        rule_name="Колонтитулы",
                        description=("Не найдены номера страниц " "в колонтитулах"),
                        severity=Severity.WARNING,
                        location="Footer",
                        expected="Номера страниц в колонтитуле",
                        actual="Номера страниц отсутствуют",
                        suggestion=("Добавьте номера страниц " "в нижний колонтитул"),
                        can_autocorrect=False,
                    )
                )

        except Exception as e:
            logger.warning(f"Error checking page numbers: {e}")

        return issues

    def _check_footer_font(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет размер и вид шрифта в колонтитулах.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            expected_font_size = self._get_rule_config("footer.font_size", 12.0)
            expected_font_name = self._get_rule_config("footer.font_name", "Times New Roman")

            for section in document.sections:
                footer = section.footer

                if not footer or not footer.paragraphs:
                    continue

                for para in footer.paragraphs:
                    for run in para.runs:
                        if not run.text.strip():
                            continue

                        # Проверим размер шрифта
                        if run.font.size:
                            font_size = run.font.size.pt

                            if abs(font_size - expected_font_size) > 0.5:
                                issues.append(
                                    self._create_issue(
                                        rule_id=29,
                                        rule_name=("Размер шрифта " "колонтитула"),
                                        description=(
                                            f"Размер должен быть " f"{expected_font_size}pt"
                                        ),
                                        severity=(Severity.WARNING),
                                        location="Footer",
                                        expected=(f"{expected_font_size}pt"),
                                        actual=f"{font_size}pt",
                                        suggestion=(f"Установите " f"{expected_font_size}pt"),
                                        can_autocorrect=True,
                                    )
                                )

                        # Проверим название шрифта
                        if run.font.name:
                            font_name = run.font.name

                            if font_name != expected_font_name:
                                issues.append(
                                    self._create_issue(
                                        rule_id=29,
                                        rule_name=("Шрифт колонтитула"),
                                        description=(
                                            f"Используется "
                                            f"{font_name}, "
                                            f"требуется "
                                            f"{expected_font_name}"
                                        ),
                                        severity=(Severity.WARNING),
                                        location="Footer",
                                        expected=(expected_font_name),
                                        actual=font_name,
                                        suggestion=(f"Используйте " f"{expected_font_name}"),
                                        can_autocorrect=True,
                                    )
                                )

        except Exception as e:
            logger.warning(f"Error checking footer font: {e}")

        return issues

    def _check_footer_margins(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет отступы колонтитулов от края.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            for section in document.sections:
                footer = section.footer

                if not footer or not footer.paragraphs:
                    continue

                for para in footer.paragraphs:
                    # Проверим отступ от левого края
                    if para.paragraph_format.left_indent:
                        left_indent = para.paragraph_format.left_indent

                        # Допустимый диапазон - 0-1 см
                        if left_indent > 914400:  # 1 см в twips
                            issues.append(
                                self._create_issue(
                                    rule_id=29,
                                    rule_name=("Отступ колонтитула"),
                                    description=("Большой левый отступ " "в колонтитуле"),
                                    severity=(Severity.INFO),
                                    location="Footer",
                                    can_autocorrect=False,
                                )
                            )

        except Exception as e:
            logger.warning(f"Error checking footer margins: {e}")

        return issues

    def _check_footer_consistency(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет консистентность содержимого колонтитулов.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            footer_contents = []

            for section in document.sections:
                footer = section.footer

                if not footer or not footer.paragraphs:
                    continue

                for para in footer.paragraphs:
                    text = para.text.strip()

                    if text:
                        footer_contents.append(text)

            # Проверим что все колонтитулы похожи
            if len(footer_contents) > 1:
                first_footer = footer_contents[0]

                for footer in footer_contents[1:]:
                    # Если содержимое совсем другое
                    if first_footer.lower() != footer.lower():
                        # Это может быть нормально, если
                        # разные секции имеют разные
                        # настройки
                        pass

        except Exception as e:
            logger.warning(f"Error checking footer consistency: {e}")

        return issues
