"""
Валидатор перекрестных ссылок и нумерации разделов.
Проверяет правильность нумерации разделов, перекрестные ссылки.
"""

from typing import Dict, Any, List, Tuple
import time
import logging
import re

from . import BaseValidator, ValidationResult, ValidationIssue, Severity


logger = logging.getLogger(__name__)


class CrossReferenceValidator(BaseValidator):
    """
    Валидатор для проверки перекрестных ссылок (ГОСТ 14,26,27).

    Проверяет:
    - Правильность нумерации разделов (правило 14)
    - Корректность перекрестных ссылок (правило 27)
    - Наличие ссылок на элементы документа (правило 26)
    """

    @property
    def name(self) -> str:
        return "CrossReferenceValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет перекрестные ссылки в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        try:
            # Извлечём все заголовки с нумерацией
            sections = self._extract_sections(document)

            # Проверим нумерацию разделов
            issues.extend(self._check_section_numbering(sections))

            # Найдём все перекрестные ссылки
            cross_refs = self._find_cross_references(document)

            # Проверим что все ссылки корректны
            issues.extend(self._check_cross_reference_validity(cross_refs, sections))

            # Проверим что ссылки указывают на существующие элементы
            issues.extend(self._check_reference_targets(document, cross_refs))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=len(issues) == 0,
                issues=issues,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"Error in cross-reference validation: {e}")
            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=[
                    self._create_issue(
                        rule_id=14,
                        rule_name="Перекрестные ссылки",
                        description=(
                            f"Критическая ошибка при проверке " f"перекрестных ссылок: {str(e)}"
                        ),
                        severity=Severity.ERROR,
                        location="Document",
                        can_autocorrect=False,
                    )
                ],
                execution_time=execution_time,
            )

    def _extract_sections(self, document: Any) -> List[Dict[str, Any]]:
        """
        Извлечь все разделы документа с нумерацией.

        Returns:
            List of section information
        """
        sections = []

        try:
            for para_idx, para in enumerate(document.paragraphs, 1):
                text = para.text.strip()

                if not text:
                    continue

                # Ищем заголовки с нумерацией: 1., 1.1, 1.1.1 и т.д.
                match = re.match(r"^(\d+(?:\.\d+)*)\s*[.—\-]\s*(.+)$", text)

                if match:
                    section_num = match.group(1)
                    section_title = match.group(2).strip()

                    section_info = {
                        "number": section_num,
                        "title": section_title,
                        "text": text,
                        "para_index": para_idx,
                        "level": len(section_num.split(".")),
                    }
                    sections.append(section_info)

            return sections

        except Exception as e:
            logger.warning(f"Error extracting sections: {e}")
            return []

    def _check_section_numbering(self, sections: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """
        Проверить правильность нумерации разделов.

        Returns:
            List of validation issues
        """
        issues = []

        if not sections:
            return issues

        try:
            prev_num = None
            prev_level = 0

            for section in sections:
                curr_num = section["number"]
                curr_level = section["level"]

                # Проверим на правильный переход уровня
                if prev_num is not None:
                    # Разберём номер на части
                    prev_parts = prev_num.split(".")
                    curr_parts = curr_num.split(".")

                    # Если переходим на подуровень
                    if curr_level == prev_level + 1:
                        # Новый подуровень должен быть .1
                        if not curr_num.startswith(prev_num + ".1"):
                            issues.append(
                                self._create_issue(
                                    rule_id=14,
                                    rule_name="Нумерация разделов",
                                    description=(
                                        f"Неправильная нумерация "
                                        f"подраздела: {curr_num} "
                                        f"(ожидалось {prev_num}.1)"
                                    ),
                                    severity=Severity.WARNING,
                                    location=f"Раздел {curr_num}",
                                    can_autocorrect=False,
                                )
                            )

                prev_num = curr_num
                prev_level = curr_level

        except Exception as e:
            logger.warning(f"Error checking numbering: {e}")

        return issues

    def _find_cross_references(self, document: Any) -> List[Dict[str, Any]]:
        """
        Найти все перекрестные ссылки в документе.

        Returns:
            List of cross-reference information
        """
        references = []

        # Паттерны для поиска перекрестных ссылок
        patterns = [
            # "см. раздел 1.2.3" или "смотрите раздел 1"
            (r"(?:см\.|смотрите|см)\s+раздел\s+([\d.]+)", "section"),
            # "на странице 10" или "в главе 2"
            (r"(?:на странице|на стр|на стр\.)\s+(\d+)", "page"),
            # "в таблице 3" или "на рисунке 4"
            (r"(?:в таблице|в рисунке|в формуле)\s+(\d+)", "object"),
        ]

        try:
            full_text = self._get_full_text(document)

            for pattern, ref_type in patterns:
                for match in re.finditer(pattern, full_text, re.IGNORECASE):
                    ref_info = {
                        "type": ref_type,
                        "target": match.group(1),
                        "context": match.group(0),
                    }
                    references.append(ref_info)

            return references

        except Exception as e:
            logger.warning(f"Error finding cross-references: {e}")
            return []

    def _check_cross_reference_validity(
        self, references: List[Dict[str, Any]], sections: List[Dict[str, Any]]
    ) -> List[ValidationIssue]:
        """
        Проверить корректность перекрестных ссылок.

        Returns:
            List of validation issues
        """
        issues = []

        if not references:
            return issues

        try:
            # Создадим словарь существующих разделов
            section_numbers = {s["number"]: s for s in sections}

            for ref in references:
                if ref["type"] != "section":
                    continue

                section_num = ref["target"]

                # Проверим что раздел существует
                if section_num not in section_numbers:
                    issues.append(
                        self._create_issue(
                            rule_id=27,
                            rule_name="Перекрестные ссылки",
                            description=(f"Ссылка на несуществующий раздел: " f"{section_num}"),
                            severity=Severity.ERROR,
                            location="Основной текст",
                            can_autocorrect=False,
                        )
                    )

        except Exception as e:
            logger.warning(f"Error checking reference validity: {e}")

        return issues

    def _check_reference_targets(
        self, document: Any, references: List[Dict[str, Any]]
    ) -> List[ValidationIssue]:
        """
        Проверить что все ссылки указывают на существующие элементы.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            full_text = self._get_full_text(document)

            # Найдём все таблицы и рисунки
            table_count = len(document.tables)
            # Ищем рисунки в тексте
            figure_pattern = re.compile(r"рисунок\s+(\d+)", re.IGNORECASE)
            figures = set(m.group(1) for m in figure_pattern.finditer(full_text))

            for ref in references:
                if ref["type"] == "object":
                    obj_num = int(ref["target"])

                    # Проверим что таблица/рисунок существует
                    if "таблице" in ref["context"].lower():
                        if obj_num > table_count:
                            issues.append(
                                self._create_issue(
                                    rule_id=26,
                                    rule_name="Ссылки на объекты",
                                    description=(
                                        f"Ссылка на таблицу {obj_num}, "
                                        f"но таблиц всего {table_count}"
                                    ),
                                    severity=Severity.ERROR,
                                    location="Основной текст",
                                    can_autocorrect=False,
                                )
                            )

                    elif "рисунке" in ref["context"].lower():
                        if str(obj_num) not in figures:
                            issues.append(
                                self._create_issue(
                                    rule_id=26,
                                    rule_name="Ссылки на объекты",
                                    description=(
                                        f"Ссылка на рисунок {obj_num}, " f"но такого рисунка нет"
                                    ),
                                    severity=Severity.WARNING,
                                    location="Основной текст",
                                    can_autocorrect=False,
                                )
                            )

        except Exception as e:
            logger.warning(f"Error checking reference targets: {e}")

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
