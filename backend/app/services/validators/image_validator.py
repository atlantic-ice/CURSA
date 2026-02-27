"""
Валидатор изображений - проверяет правила оформления рисунков.
Проверяет наличие подписей, нумерацию и ссылки на рисунки.
"""

from typing import Dict, Any, List
import time
import logging
import re

from . import BaseValidator, ValidationResult, ValidationIssue, Severity


logger = logging.getLogger(__name__)


class ImageValidator(BaseValidator):
    """
    Валидатор для проверки правил оформления изображений (ГОСТ 20).

    Проверяет:
    - Наличие нумерации и подписей для изображений
    - Правильность ссылок на изображения в тексте
    """

    @property
    def name(self) -> str:
        return "ImageValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет оформление изображений в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        try:
            # Извлечём подписи и ссылки
            image_captions = self._extract_image_captions(document)
            text_references = self._find_image_references_in_text(document)

            # Найдём количество изображений в документе
            image_count = len(list(document.part.rels.values()))

            if not image_captions and image_count == 0:
                # Нет изображений - проверка не требуется
                execution_time = time.time() - start_time
                return ValidationResult(
                    validator_name=self.name,
                    passed=True,
                    issues=[],
                    execution_time=execution_time,
                )

            # Проверим нумерацию подписей
            issues.extend(self._check_caption_numbering(image_captions))

            # Проверим согласованность нумерации в тексте
            consistency_issues = self._check_text_reference_consistency(
                text_references, len(image_captions)
            )
            issues.extend(consistency_issues)

            # Проверим наличие оглавления рисунков
            if len(image_captions) > 1:
                issues.extend(self._check_list_of_figures(document))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=len(issues) == 0,
                issues=issues,
                execution_time=execution_time,
            )

        except Exception as e:
            logger.error(f"Error validating images: {e}")
            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=[
                    self._create_issue(
                        rule_id=20,
                        rule_name="Рисунки и диаграммы",
                        description=(f"Критическая ошибка при проверке " f"изображений: {str(e)}"),
                        severity=Severity.ERROR,
                        location="Document",
                        can_autocorrect=False,
                    )
                ],
                execution_time=execution_time,
            )

    def _extract_image_captions(self, document: Any) -> Dict[int, str]:
        """
        Извлечь подписи для всех изображений.
        Ищет текст вида "Рисунок X - Описание"

        Returns:
            Dict mapping figure number to caption text
        """
        captions = {}
        figure_pattern = re.compile(
            r"[Рр]исунок\s+(\d+)\s*[-–—]\s*(.+?)(?:\n|$)",
            re.MULTILINE | re.IGNORECASE,
        )

        try:
            full_text = self._get_full_text(document)

            for match in figure_pattern.finditer(full_text):
                try:
                    fig_num = int(match.group(1))
                    caption = match.group(2).strip()
                    captions[fig_num] = caption
                except (ValueError, IndexError):
                    continue

            return captions

        except Exception as e:
            logger.warning(f"Error extracting captions: {e}")
            return {}

    def _find_image_references_in_text(self, document: Any) -> List[int]:
        """
        Найти все ссылки на изображения в тексте документа.

        Returns:
            List of figure numbers referenced in text
        """
        references = []

        # Паттерны для поиска ссылок на рисунки
        patterns = [
            r"[Рр]исунок\s+(\d+)",
            r"[Рр]ис\.\s*(\d+)",
            r"[Фф]иг\.\s*(\d+)",
            r"[Ff]ig\.\s*(\d+)",
            r"(?:на|см)\s+[Рр]исунок\s+(\d+)",
        ]

        try:
            full_text = self._get_full_text(document)

            for pattern in patterns:
                for match in re.finditer(pattern, full_text, re.IGNORECASE):
                    try:
                        fig_num = int(match.group(1))
                        if fig_num not in references:
                            references.append(fig_num)
                    except (ValueError, IndexError):
                        continue

            return sorted(references)

        except Exception as e:
            logger.warning(f"Error finding references: {e}")
            return []

    def _check_caption_numbering(self, captions: Dict[int, str]) -> List[ValidationIssue]:
        """
        Проверить правильность нумерации подписей.

        Returns:
            List of validation issues
        """
        issues = []

        if not captions:
            return issues

        try:
            fig_numbers = sorted(captions.keys())

            # Проверим последовательность
            for i, num in enumerate(fig_numbers, 1):
                if num != i:
                    desc = (
                        f"Нарушена последовательность "
                        f"нумерации: ожидалося {i}, "
                        f"найдено {num}"
                    )
                    issues.append(
                        self._create_issue(
                            rule_id=20,
                            rule_name="Рисунки и диаграммы",
                            description=desc,
                            severity=Severity.WARNING,
                            location=f"Рисунок {num}",
                            can_autocorrect=False,
                        )
                    )
                    break

        except Exception as e:
            logger.warning(f"Error checking numbering: {e}")

        return issues

    def _check_text_reference_consistency(
        self, references: List[int], total_images: int
    ) -> List[ValidationIssue]:
        """
        Проверить что все ссылки в тексте согласуются.

        Returns:
            List of validation issues
        """
        issues = []

        if not references:
            if total_images > 0:
                desc = f"В документе {total_images} рисунков, " f"но они не упоминаются в тексте"
                issues.append(
                    self._create_issue(
                        rule_id=20,
                        rule_name="Рисунки и диаграммы",
                        description=desc,
                        severity=Severity.WARNING,
                        location="Document",
                        can_autocorrect=False,
                    )
                )
            return issues

        try:
            # Проверим что все ссылки корректны
            for ref in references:
                if ref > total_images:
                    desc = f"Ссылка на рисунок {ref}, " f"но в документе всего {total_images}"
                    issues.append(
                        self._create_issue(
                            rule_id=20,
                            rule_name="Рисунки и диаграммы",
                            description=desc,
                            severity=Severity.ERROR,
                            location="Document",
                            can_autocorrect=False,
                        )
                    )
                    break

        except Exception as e:
            logger.warning(f"Error checking references: {e}")

        return issues

    def _check_list_of_figures(self, document: Any) -> List[ValidationIssue]:
        """
        Проверить наличие оглавления рисунков.

        Returns:
            List of validation issues
        """
        issues = []

        try:
            full_text = self._get_full_text(document)

            #  Ищем оглавление рисунков
            has_list_of_figures = bool(
                re.search(
                    r"(?:Список|Содержание)\s+" r"(?:рисунков|[Рр]исунков)",
                    full_text,
                    re.IGNORECASE,
                )
            )

            if not has_list_of_figures:
                desc = "При наличии нескольких рисунков " "рекомендуется 'Список рисунков'"
                issues.append(
                    self._create_issue(
                        rule_id=20,
                        rule_name="Рисунки и диаграммы",
                        description=desc,
                        severity=Severity.WARNING,
                        location="Document",
                        can_autocorrect=False,
                    )
                )

        except Exception as e:
            logger.warning(f"Error checking list: {e}")

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
