"""
Валидатор для проверки оформления списка литературы.
"""

from typing import Dict, Any, List
import time
import re
from datetime import datetime
from . import BaseValidator, ValidationResult, ValidationIssue, Severity


class BibliographyValidator(BaseValidator):
    """
    Валидатор для проверки оформления списка использованных источников.

    Проверяет:
    - Наличие раздела со списком литературы
    - Минимальное количество источников
    - Формат оформления (ГОСТ Р 7.0.5-2008)
    - Актуальность источников
    - Правильность библиографических ссылок в тексте
    """

    @property
    def name(self) -> str:
        return "BibliographyValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет оформление списка литературы.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        # Находим раздел со списком литературы
        bibliography_section = self._find_bibliography_section(document)

        if not bibliography_section:
            issues.append(self._create_issue(
                rule_id=29,
                rule_name="Список использованных источников",
                description="Не найден раздел 'Список использованных источников'",
                severity=Severity.CRITICAL,
                suggestion="Добавьте раздел 'Список использованных источников'",
                can_autocorrect=False
            ))

            execution_time = time.time() - start_time
            return ValidationResult(
                validator_name=self.name,
                passed=False,
                issues=issues,
                execution_time=execution_time
            )

        # Извлекаем источники
        sources = self._extract_sources(bibliography_section)

        # Проверка минимального количества источников
        min_sources = self._get_rule_config('bibliography.min_sources', 15)
        if len(sources) < min_sources:
            issues.append(self._create_issue(
                rule_id=29,
                rule_name="Количество источников",
                description=f"Недостаточное количество источников: {len(sources)}",
                severity=Severity.ERROR,
                expected=f"Не менее {min_sources}",
                actual=str(len(sources)),
                suggestion=f"Добавьте минимум {min_sources - len(sources)} источник(ов)",
                can_autocorrect=False
            ))

        # Проверка формата каждого источника
        patterns = self._get_bibliography_patterns()

        for idx, source in enumerate(sources, start=1):
            # Проверяем соответствие одному из паттернов
            matched = False
            source_text = source['text'].strip()

            for pattern_name, pattern in patterns.items():
                if re.search(pattern, source_text, re.IGNORECASE):
                    matched = True
                    break

            if not matched:
                issues.append(self._create_issue(
                    rule_id=29,
                    rule_name="Формат источника",
                    description=f"Источник №{idx} оформлен неверно",
                    severity=Severity.ERROR,
                    location=self._format_location(
                        paragraph_index=source['paragraph_index'],
                        source_number=idx,
                        text_preview=source_text[:100]
                    ),
                    expected="Формат ГОСТ Р 7.0.5-2008",
                    actual=source_text[:80] + "...",
                    suggestion=self._get_format_suggestion(source_text),
                    can_autocorrect=False
                ))

        # Проверка актуальности источников
        max_age_years = self._get_rule_config('bibliography.max_age_years', 5)
        if max_age_years:
            issues.extend(self._check_source_relevance(sources, max_age_years))

        # Проверка нумерации
        issues.extend(self._check_numbering(sources))

        # Проверка ссылок на источники в тексте
        issues.extend(self._check_citations(document, len(sources)))

        execution_time = time.time() - start_time
        passed = len([i for i in issues if i.severity in [Severity.CRITICAL, Severity.ERROR]]) == 0

        return ValidationResult(
            validator_name=self.name,
            passed=passed,
            issues=issues,
            execution_time=execution_time
        )

    def _find_bibliography_section(self, document: Any) -> Dict[str, Any]:
        """
        Находит раздел со списком литературы в документе.

        Args:
            document: Document объект

        Returns:
            Словарь с информацией о разделе или None
        """
        bibliography_keywords = [
            'список использованных источников',
            'список литературы',
            'библиография',
            'библиографический список'
        ]

        for idx, paragraph in enumerate(document.paragraphs):
            text_lower = paragraph.text.lower().strip()

            for keyword in bibliography_keywords:
                if keyword in text_lower:
                    return {
                        'paragraph_index': idx,
                        'start_index': idx,
                        'keyword': keyword
                    }

        return None

    def _extract_sources(self, bibliography_section: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Извлекает источники из раздела библиографии.

        Args:
            bibliography_section: Информация о разделе

        Returns:
            Список источников
        """
        # Простая реализация: считаем что каждый пронумерованный параграф - источник
        # В реальности может быть сложнее (многострочные источники и т.д.)
        sources = []

        # Паттерн для номера источника: 1. или [1] или 1)
        number_pattern = r'^\s*(\d+|[\[\(]\d+[\]\)])\s*\.?\s*'

        # Начинаем с параграфа после заголовка секции
        # В реальной реализации нужно знать где заканчивается раздел
        # Пока просто берем следующие 50 параграфов или до конца документа

        return sources  # Упрощенная версия

    def _get_bibliography_patterns(self) -> Dict[str, str]:
        """
        Возвращает паттерны для проверки библиографических записей.

        Returns:
            Словарь с паттернами
        """
        # Получаем паттерны из профиля или используем дефолтные
        profile_patterns = self._get_rule_config('bibliography.patterns', {})

        default_patterns = {
            'one_author': r'^[А-ЯЁ][а-яё]+,\s[А-ЯЁ]\.\s?[А-ЯЁ]?\.\s.*[–—-]\s.*,\s\d{4}',
            '2_3_authors': r'^[А-ЯЁ][а-яё]+,\s[А-ЯЁ]\.\s?[А-ЯЁ]?\.\?,\s[А-ЯЁ][а-яё]+.*[–—-]\s.*,\s\d{4}',
            'collective': r'.*\[и\sдр\.\].*',
            'web_resource': r'.*\[Электронный\sресурс\].*URL:.*\(дата\sобращения.*\)',
            'gost': r'^ГОСТ\s[\d\.]+[–—-]\d{4}',
            'law': r'^(Федеральный закон|Постановление|Указ).*от\s\d{2}\.\d{2}\.\d{4}.*№'
        }

        return {**default_patterns, **profile_patterns}

    def _get_format_suggestion(self, source_text: str) -> str:
        """
        Возвращает подсказку по правильному оформлению.

        Args:
            source_text: Текст источника

        Returns:
            Подсказка по оформлению
        """
        # Определяем тип источника и даем соответствующую подсказку
        if 'http' in source_text.lower() or 'www' in source_text.lower():
            return "Интернет-источник: Название [Электронный ресурс]. URL: адрес (дата обращения: ДД.ММ.ГГГГ)."
        elif 'гост' in source_text.lower():
            return "ГОСТ: ГОСТ Номер–Год. Название. – Город: Издательство, Год."
        elif any(word in source_text.lower() for word in ['закон', 'постановление', 'указ']):
            return "Нормативный акт: Название документа от ДД.ММ.ГГГГ № Номер"
        else:
            return "Книга: Фамилия, И.О. Название / И.О. Фамилия. – Город: Издательство, Год. – Страниц с."

    def _check_source_relevance(
        self,
        sources: List[Dict[str, Any]],
        max_age_years: int
    ) -> List[ValidationIssue]:
        """
        Проверяет актуальность источников.

        Args:
            sources: Список источников
            max_age_years: Максимальный возраст источника в годах

        Returns:
            Список проблем
        """
        issues = []
        current_year = datetime.now().year

        # Паттерн для извлечения года
        year_pattern = r'\b(19|20)\d{2}\b'

        for idx, source in enumerate(sources, start=1):
            years = re.findall(year_pattern, source['text'])
            if years:
                # Берем последний год в записи (обычно год издания)
                year = int(years[-1])
                age = current_year - year

                if age > max_age_years:
                    issues.append(self._create_issue(
                        rule_id=29,
                        rule_name="Актуальность источника",
                        description=f"Источник №{idx} устарел ({year} год, {age} лет назад)",
                        severity=Severity.WARNING,
                        location=self._format_location(
                            paragraph_index=source.get('paragraph_index'),
                            source_number=idx
                        ),
                        expected=f"Источники не старше {max_age_years} лет",
                        actual=f"{age} лет назад",
                        suggestion="Используйте более актуальные источники"
                    ))

        return issues

    def _check_numbering(self, sources: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """
        Проверяет правильность нумерации источников.

        Args:
            sources: Список источников

        Returns:
            Список проблем
        """
        issues = []

        for idx, source in enumerate(sources, start=1):
            # Извлекаем номер из текста источника
            number_match = re.match(r'^\s*(\d+|[\[\(]\d+[\]\)])', source['text'])
            if number_match:
                # Преобразуем в число
                number_str = re.sub(r'[\[\]\(\)]', '', number_match.group(1))
                try:
                    number = int(number_str)
                    if number != idx:
                        issues.append(self._create_issue(
                            rule_id=27,
                            rule_name="Нумерация источников",
                            description=f"Неправильная нумерация источника: {number} вместо {idx}",
                            severity=Severity.ERROR,
                            location=self._format_location(
                                paragraph_index=source.get('paragraph_index'),
                                source_number=idx
                            ),
                            expected=str(idx),
                            actual=str(number),
                            can_autocorrect=True
                        ))
                except ValueError:
                    pass

        return issues

    def _check_citations(self, document: Any, sources_count: int) -> List[ValidationIssue]:
        """
        Проверяет наличие ссылок на источники в тексте.

        Args:
            document: Document объект
            sources_count: Количество источников в списке

        Returns:
            Список проблем
        """
        issues = []

        # Паттерн для библиографических ссылок: [1], [5, с. 28], [1-3] и т.д.
        citation_pattern = r'\[(\d+)(?:\s*,\s*с\.\s*\d+)?\]'

        cited_sources = set()

        # Сканируем весь текст на предмет ссылок
        for idx, paragraph in enumerate(document.paragraphs):
            citations = re.findall(citation_pattern, paragraph.text)
            for citation in citations:
                try:
                    source_num = int(citation)
                    cited_sources.add(source_num)

                    # Проверяем что ссылка не выходит за пределы списка
                    if source_num > sources_count:
                        issues.append(self._create_issue(
                            rule_id=30,
                            rule_name="Библиографическая ссылка",
                            description=f"Ссылка на несуществующий источник [{source_num}]",
                            severity=Severity.ERROR,
                            location=self._format_location(
                                paragraph_index=idx,
                                text_preview=paragraph.text[:50]
                            ),
                            expected=f"Номер от 1 до {sources_count}",
                            actual=str(source_num),
                            suggestion="Проверьте номер источника в списке литературы"
                        ))
                except ValueError:
                    pass

        # Проверяем что все источники процитированы
        uncited = set(range(1, sources_count + 1)) - cited_sources
        if uncited:
            issues.append(self._create_issue(
                rule_id=26,
                rule_name="Ссылки на источники",
                description=f"Не все источники процитированы в тексте: {sorted(uncited)}",
                severity=Severity.WARNING,
                expected="Все источники должны быть процитированы",
                actual=f"Не процитировано {len(uncited)} источников",
                suggestion="Добавьте ссылки на источники в тексте или удалите неиспользуемые источники"
            ))

        return issues
