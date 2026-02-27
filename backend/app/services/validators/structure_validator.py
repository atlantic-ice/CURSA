"""
Валидатор для проверки структуры документа.
"""

from typing import Dict, Any, List
import time
import re
from . import BaseValidator, ValidationResult, ValidationIssue, Severity


class StructureValidator(BaseValidator):
    """
    Валидатор для проверки структуры документа.

    Проверяет:
    - Наличие обязательных разделов (Титульный лист, Содержание, Введение, и т.д.)
    - Порядок разделов
    - Наличие нумерации страниц
    - Правильность оглавления/содержания
    - Общий объем документа
    """

    # Типичная структура научной работы
    DEFAULT_REQUIRED_SECTIONS = [
        'содержание',
        'введение',
        'заключение',
        'список литературы'
    ]

    DEFAULT_RECOMMENDED_SECTIONS = [
        'реферат',
        'аннотация'
    ]

    @property
    def name(self) -> str:
        return "StructureValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет структуру документа.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        # Получаем требования из профиля
        structure_config = self._get_rule_config('structure', {})

        required_sections = structure_config.get(
            'required_sections',
            self.DEFAULT_REQUIRED_SECTIONS
        )
        recommended_sections = structure_config.get(
            'recommended_sections',
            self.DEFAULT_RECOMMENDED_SECTIONS
        )
        min_pages = structure_config.get('min_pages', 20)
        max_pages = structure_config.get('max_pages', 100)

        # Извлекаем разделы из документа
        found_sections = self._extract_sections(document)

        # Проверка наличия обязательных разделов
        issues.extend(self._check_required_sections(
            required_sections, found_sections
        ))

        # Проверка рекомендуемых разделов
        issues.extend(self._check_recommended_sections(
            recommended_sections, found_sections
        ))

        # Проверка порядка разделов
        issues.extend(self._check_section_order(
            found_sections, required_sections
        ))

        # Проверка объема документа
        issues.extend(self._check_document_length(
            document, min_pages, max_pages
        ))

        # Проверка нумерации страниц
        issues.extend(self._check_page_numbering(document))

        # Проверка содержания/оглавления
        issues.extend(self._check_table_of_contents(
            document, found_sections
        ))

        execution_time = time.time() - start_time
        passed = len([i for i in issues if i.severity in [Severity.CRITICAL, Severity.ERROR]]) == 0

        return ValidationResult(
            validator_name=self.name,
            passed=passed,
            issues=issues,
            execution_time=execution_time
        )

    def _extract_sections(self, document: Any) -> List[Dict[str, Any]]:
        """
        Извлекает разделы из документа.

        Args:
            document: Document объект

        Returns:
            Список найденных разделов с их позициями
        """
        sections = []

        # Ключевые слова для разделов
        section_keywords = [
            'содержание', 'оглавление',
            'введение',
            'глава', 'раздел',
            'заключение',
            'выводы',
            'список литературы', 'список использованных источников',
            'библиография',
            'приложение', 'приложения',
            'реферат', 'аннотация',
            'определения', 'обозначения и сокращения'
        ]

        for idx, paragraph in enumerate(document.paragraphs):
            text = paragraph.text.strip()
            text_lower = text.lower()

            # Проверяем, является ли это заголовком раздела
            is_heading = False

            # Проверка по стилю
            style_name = paragraph.style.name.lower() if paragraph.style else ""
            if 'heading' in style_name or 'заголовок' in style_name:
                is_heading = True

            # Проверка по контенту
            for keyword in section_keywords:
                if keyword in text_lower:
                    # Должно быть близко к началу строки или быть всей строкой
                    if text_lower == keyword or text_lower.startswith(keyword):
                        is_heading = True
                        break
                    # Или быть в верхнем регистре
                    if text.isupper() and keyword.upper() in text:
                        is_heading = True
                        break

            # Проверка нумерованных разделов: ГЛАВА 1, 1. НАЗВАНИЕ
            if re.match(r'^(глава|раздел)\s+\d+', text_lower):
                is_heading = True
            elif re.match(r'^\d+\.?\s+[А-ЯЁ]', text):
                is_heading = True

            if is_heading:
                sections.append({
                    'text': text,
                    'text_lower': text_lower,
                    'paragraph_index': idx,
                    'style': style_name
                })

        return sections

    def _check_required_sections(
        self,
        required: List[str],
        found_sections: List[Dict[str, Any]]
    ) -> List[ValidationIssue]:
        """
        Проверяет наличие обязательных разделов.

        Args:
            required: Список обязательных разделов
            found_sections: Найденные разделы

        Returns:
            Список проблем
        """
        issues = []

        found_section_names = [s['text_lower'] for s in found_sections]

        for required_section in required:
            required_lower = required_section.lower()

            # Проверяем различные варианты названия
            found = False
            for found_name in found_section_names:
                if required_lower in found_name or found_name in required_lower:
                    found = True
                    break

            if not found:
                issues.append(self._create_issue(
                    rule_id=28,
                    rule_name="Обязательные разделы",
                    description=f"Отсутствует обязательный раздел: {required_section}",
                    severity=Severity.CRITICAL,
                    location="Документ в целом",
                    expected=f"Наличие раздела '{required_section}'",
                    actual="Раздел не найден",
                    suggestion=f"Добавьте раздел '{required_section}' в документ",
                    can_autocorrect=False
                ))

        return issues

    def _check_recommended_sections(
        self,
        recommended: List[str],
        found_sections: List[Dict[str, Any]]
    ) -> List[ValidationIssue]:
        """
        Проверяет наличие рекомендуемых разделов.

        Args:
            recommended: Список рекомендуемых разделов
            found_sections: Найденные разделы

        Returns:
            Список проблем
        """
        issues = []

        found_section_names = [s['text_lower'] for s in found_sections]

        for recommended_section in recommended:
            recommended_lower = recommended_section.lower()

            found = False
            for found_name in found_section_names:
                if recommended_lower in found_name:
                    found = True
                    break

            if not found:
                issues.append(self._create_issue(
                    rule_id=28,
                    rule_name="Рекомендуемые разделы",
                    description=f"Рекомендуется добавить раздел: {recommended_section}",
                    severity=Severity.INFO,
                    location="Документ в целом",
                    expected=f"Наличие раздела '{recommended_section}'",
                    actual="Раздел не найден",
                    suggestion=f"Рекомендуется добавить раздел '{recommended_section}'",
                    can_autocorrect=False
                ))

        return issues

    def _check_section_order(
        self,
        found_sections: List[Dict[str, Any]],
        required_sections: List[str]
    ) -> List[ValidationIssue]:
        """
        Проверяет правильность порядка разделов.

        Args:
            found_sections: Найденные разделы
            required_sections: Обязательные разделы в правильном порядке

        Returns:
            Список проблем
        """
        issues = []

        # Определяем ожидаемый порядок
        expected_order = ['содержание', 'введение', 'основная часть', 'заключение', 'список литературы']

        # Находим позиции ключевых разделов
        section_positions = {}

        for section in found_sections:
            text_lower = section['text_lower']

            if 'содержание' in text_lower or 'оглавление' in text_lower:
                section_positions['содержание'] = section['paragraph_index']
            elif 'введение' in text_lower:
                section_positions['введение'] = section['paragraph_index']
            elif 'глава' in text_lower or 'раздел' in text_lower or re.match(r'^\d+\.', text_lower):
                if 'основная часть' not in section_positions:
                    section_positions['основная часть'] = section['paragraph_index']
            elif 'заключение' in text_lower:
                section_positions['заключение'] = section['paragraph_index']
            elif 'список литературы' in text_lower or 'библиография' in text_lower:
                section_positions['список литературы'] = section['paragraph_index']

        # Проверяем порядок
        order_violations = []

        for i in range(len(expected_order) - 1):
            current = expected_order[i]
            next_section = expected_order[i + 1]

            if current in section_positions and next_section in section_positions:
                if section_positions[current] > section_positions[next_section]:
                    order_violations.append((current, next_section))

        for current, next_section in order_violations:
            issues.append(self._create_issue(
                rule_id=28,
                rule_name="Порядок разделов",
                description=f"Неправильный порядок разделов: '{current}' должен быть перед '{next_section}'",
                severity=Severity.ERROR,
                location="Структура документа",
                expected=f"'{current}' перед '{next_section}'",
                actual=f"'{next_section}' перед '{current}'",
                suggestion="Переупорядочите разделы согласно требованиям",
                can_autocorrect=False
            ))

        return issues

    def _check_document_length(
        self,
        document: Any,
        min_pages: int,
        max_pages: int
    ) -> List[ValidationIssue]:
        """
        Проверяет объем документа.

        Args:
            document: Document объект
            min_pages: Минимальное количество страниц
            max_pages: Максимальное количество страниц

        Returns:
            Список проблем
        """
        issues = []

        # Примерный расчет страниц (1 страница ≈ 1800 символов с пробелами)
        chars_per_page = 1800

        total_chars = sum(len(p.text) for p in document.paragraphs)
        estimated_pages = total_chars / chars_per_page

        if estimated_pages < min_pages:
            issues.append(self._create_issue(
                rule_id=28,
                rule_name="Объем документа",
                description=f"Объем документа меньше минимального",
                severity=Severity.WARNING,
                location="Документ в целом",
                expected=f"Минимум {min_pages} страниц",
                actual=f"Примерно {estimated_pages:.1f} страниц",
                suggestion=f"Увеличьте объем работы до {min_pages} страниц",
                can_autocorrect=False
            ))
        elif estimated_pages > max_pages:
            issues.append(self._create_issue(
                rule_id=28,
                rule_name="Объем документа",
                description=f"Объем документа превышает максимальный",
                severity=Severity.WARNING,
                location="Документ в целом",
                expected=f"Максимум {max_pages} страниц",
                actual=f"Примерно {estimated_pages:.1f} страниц",
                suggestion=f"Сократите объем работы до {max_pages} страниц",
                can_autocorrect=False
            ))

        return issues

    def _check_page_numbering(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет наличие нумерации страниц.

        Args:
            document: Document объект

        Returns:
            Список проблем
        """
        issues = []

        # Проверяем наличие нумерации в секциях
        has_page_numbers = False

        for section in document.sections:
            # Проверяем footer (нижний колонтитул)
            if section.footer and section.footer.paragraphs:
                for paragraph in section.footer.paragraphs:
                    text = paragraph.text.strip()
                    # Если есть цифры или поле PAGE
                    if text.isdigit() or 'PAGE' in text or 'page' in text.lower():
                        has_page_numbers = True
                        break

            # Проверяем header (верхний колонтитул)
            if not has_page_numbers and section.header and section.header.paragraphs:
                for paragraph in section.header.paragraphs:
                    text = paragraph.text.strip()
                    if text.isdigit() or 'PAGE' in text or 'page' in text.lower():
                        has_page_numbers = True
                        break

        if not has_page_numbers:
            issues.append(self._create_issue(
                rule_id=8,
                rule_name="Нумерация страниц",
                description="Не обнаружена нумерация страниц",
                severity=Severity.WARNING,
                location="Колонтитулы",
                expected="Наличие нумерации страниц",
                actual="Нумерация не найдена",
                suggestion="Добавьте нумерацию страниц в колонтитулы",
                can_autocorrect=False
            ))

        return issues

    def _check_table_of_contents(
        self,
        document: Any,
        found_sections: List[Dict[str, Any]]
    ) -> List[ValidationIssue]:
        """
        Проверяет наличие и правильность оглавления/содержания.

        Args:
            document: Document объект
            found_sections: Найденные разделы

        Returns:
            Список проблем
        """
        issues = []

        # Ищем оглавление
        toc_found = False
        toc_paragraph_index = None

        for section in found_sections:
            if 'содержание' in section['text_lower'] or 'оглавление' in section['text_lower']:
                toc_found = True
                toc_paragraph_index = section['paragraph_index']
                break

        if not toc_found:
            issues.append(self._create_issue(
                rule_id=28,
                rule_name="Оглавление/Содержание",
                description="Не найдено оглавление/содержание",
                severity=Severity.ERROR,
                location="Документ в целом",
                expected="Наличие оглавления с перечислением разделов",
                actual="Оглавление не найдено",
                suggestion="Добавьте оглавление в начало документа",
                can_autocorrect=False
            ))
        else:
            # Проверяем, что оглавление в начале документа (в первых 10 параграфах)
            if toc_paragraph_index > 10:
                issues.append(self._create_issue(
                    rule_id=28,
                    rule_name="Позиция оглавления",
                    description="Оглавление находится слишком далеко от начала документа",
                    severity=Severity.WARNING,
                    location=self._format_location(paragraph_index=toc_paragraph_index),
                    expected="Оглавление в начале документа",
                    actual=f"Оглавление на позиции {toc_paragraph_index}",
                    suggestion="Переместите оглавление в начало документа",
                    can_autocorrect=False
                ))

        return issues
