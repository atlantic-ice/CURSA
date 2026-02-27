"""
Движок валидации документов - оркестрирует работу всех валидаторов.
"""

from typing import Dict, Any, List, Optional, Type
import time
import logging
from pathlib import Path
import json

from docx import Document

from .validators import BaseValidator, ValidationResult, ValidationIssue, Severity
from .validators.font_validator import FontValidator
from .validators.margin_validator import MarginValidator
from .validators.bibliography_validator import BibliographyValidator
from .validators.heading_validator import HeadingValidator
from .validators.paragraph_validator import ParagraphValidator
from .validators.structure_validator import StructureValidator
from .validators.table_validator import TableValidator
from .validators.formula_validator import FormulaValidator
from .validators.image_validator import ImageValidator
from .validators.appendix_validator import AppendixValidator
from .validators.advanced_format_validator import (
    AdvancedFormatValidator,
)
from .validators.cross_reference_validator import (
    CrossReferenceValidator,
)
from .validators.header_footer_validator import (
    HeaderFooterValidator,
)
from .validators.footnote_validator import FootnoteValidator
from .validators.page_break_validator import PageBreakValidator


logger = logging.getLogger(__name__)


class ValidationEngine:
    """
    Движок валидации документов.

    Управляет запуском валидаторов, агрегирует результаты,
    генерирует итоговый отчет о проверке документа.
    """

    # Реестр доступных валидаторов
    VALIDATORS: List[Type[BaseValidator]] = [
        StructureValidator,  # Сначала проверяем структуру
        FontValidator,
        MarginValidator,
        ParagraphValidator,
        HeadingValidator,
        BibliographyValidator,
        TableValidator,
        FormulaValidator,
        ImageValidator,
        AppendixValidator,
        AdvancedFormatValidator,  # Stage 4
        CrossReferenceValidator,  # Stage 4
        HeaderFooterValidator,  # Stage 5
        FootnoteValidator,  # Stage 5
        PageBreakValidator,  # Stage 5
    ]

    def __init__(self, profile: Optional[Dict[str, Any]] = None):
        """
        Инициализация движка валидации.

        Args:
            profile: Профиль требований (JSON конфигурация)
        """
        self.logger = logger  # Инициализируем логгер ДО инициализации валидаторов
        self.profile = profile or self._load_default_profile()
        self.validators = self._initialize_validators()

    def validate_document(
        self, document_path: str, document_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Выполняет полную валидацию документа.

        Args:
            document_path: Путь к DOCX файлу
            document_data: Предварительно извлечённые данные (опционально)

        Returns:
            Словарь с результатами валидации
        """
        start_time = time.time()

        try:
            # Загружаем документ
            document = Document(document_path)
            self.logger.info(f"Начало валидации документа: {document_path}")

            # Если данные не переданы, извлекаем их
            if document_data is None:
                from .document_processor import DocumentProcessor

            # Запускаем все валидаторы
            validation_results = []

            for validator in self.validators:
                if validator.enabled:
                    self.logger.info(f"Запуск валидатора: {validator.name}")
                    try:
                        result = validator.validate(document, document_data)
                        validation_results.append(result)

                        self.logger.info(
                            f"{validator.name}: {len(result.issues)} проблем найдено "
                            f"(время: {result.execution_time:.3f}с)"
                        )
                    except Exception as e:
                        self.logger.error(
                            f"Ошибка в валидаторе {validator.name}: {str(e)}", exc_info=True
                        )
                        # Продолжаем с другими валидаторами

            # Агрегируем результаты
            total_time = time.time() - start_time
            report = self._generate_report(validation_results, document_path, total_time)

            self.logger.info(
                f"Валидация завершена: {report['summary']['total_issues']} проблем "
                f"за {total_time:.3f}с"
            )

            return report

        except Exception as e:
            self.logger.error(f"Критическая ошибка при валидации: {str(e)}", exc_info=True)
            return {"status": "error", "error": str(e), "document_path": document_path}

    def _initialize_validators(self) -> List[BaseValidator]:
        """
        Инициализирует все валидаторы с текущим профилем.

        Returns:
            Список инициализированных валидаторов
        """
        validators = []

        for ValidatorClass in self.VALIDATORS:
            try:
                validator = ValidatorClass(profile=self.profile)
                validators.append(validator)
                self.logger.debug(f"Инициализирован валидатор: {validator.name}")
            except Exception as e:
                self.logger.error(f"Ошибка при инициализации {ValidatorClass.__name__}: {str(e)}")

        return validators

    def _generate_report(
        self, validation_results: List[ValidationResult], document_path: str, total_time: float
    ) -> Dict[str, Any]:
        """
        Генерирует итоговый отчет о проверке.

        Args:
            validation_results: Результаты от всех валидаторов
            document_path: Путь к проверенному документу
            total_time: Общее время проверки

        Returns:
            Словарь с отчетом
        """
        # Собираем все проблемы
        all_issues = []
        for result in validation_results:
            all_issues.extend(result.issues)

        # Подсчитываем статистику
        total_issues = len(all_issues)
        critical_count = sum(1 for issue in all_issues if issue.severity == Severity.CRITICAL)
        error_count = sum(1 for issue in all_issues if issue.severity == Severity.ERROR)
        warning_count = sum(1 for issue in all_issues if issue.severity == Severity.WARNING)
        info_count = total_issues - critical_count - error_count - warning_count

        # Группируем по серьезности
        issues_by_severity = {
            "critical": [issue for issue in all_issues if issue.severity == Severity.CRITICAL],
            "error": [issue for issue in all_issues if issue.severity == Severity.ERROR],
            "warning": [issue for issue in all_issues if issue.severity == Severity.WARNING],
            "info": [issue for issue in all_issues if issue.severity == Severity.INFO],
        }

        # Подсчитываем проблемы которые можно автоисправить
        autocorrectable_count = sum(1 for issue in all_issues if issue.can_autocorrect)

        # Определяем общий статус
        if critical_count > 0:
            overall_status = "critical"
            passed = False
        elif error_count > 0:
            overall_status = "failed"
            passed = False
        elif warning_count > 0:
            overall_status = "warning"
            passed = True
        else:
            overall_status = "passed"
            passed = True

        # Формируем отчет
        report = {
            "status": overall_status,
            "passed": passed,
            "document": {"path": document_path, "filename": Path(document_path).name},
            "profile": {
                "name": self.profile.get("name", "Default"),
                "version": self.profile.get("version", "1.0"),
            },
            "summary": {
                "total_issues": total_issues,
                "critical": critical_count,
                "errors": error_count,
                "warnings": warning_count,
                "info": info_count,
                "autocorrectable": autocorrectable_count,
                "completion_percentage": self._calculate_completion(all_issues),
            },
            "execution": {
                "total_time": round(total_time, 3),
                "validators_run": len(validation_results),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            },
            "validators": [result.to_dict() for result in validation_results],
            "issues_by_severity": {
                severity: [issue.to_dict() for issue in issues]
                for severity, issues in issues_by_severity.items()
            },
            "recommendations": self._generate_recommendations(all_issues),
        }

        return report

    def _calculate_completion(self, issues: List[ValidationIssue]) -> float:
        """
        Вычисляет процент соответствия требованиям.

        Args:
            issues: Список проблем

        Returns:
            Процент (0-100)
        """
        # Простая формула: критические -10%, ошибки -5%, предупреждения -2%
        penalties = {
            Severity.CRITICAL: 10,
            Severity.ERROR: 5,
            Severity.WARNING: 2,
            Severity.INFO: 0,
        }

        total_penalty = sum(penalties[issue.severity] for issue in issues)
        completion = max(0, 100 - total_penalty)

        return round(completion, 1)

    def _generate_recommendations(self, issues: List[ValidationIssue]) -> List[str]:
        """
        Генерирует список рекомендаций по улучшению документа.

        Args:
            issues: Список проблем

        Returns:
            Список рекомендаций
        """
        recommendations = []

        # Группируем проблемы по правилам
        issues_by_rule = {}
        for issue in issues:
            rule_id = issue.rule_id
            if rule_id not in issues_by_rule:
                issues_by_rule[rule_id] = []
            issues_by_rule[rule_id].append(issue)

        # Генерируем рекомендации для наиболее частых проблем
        sorted_rules = sorted(issues_by_rule.items(), key=lambda x: len(x[1]), reverse=True)

        for rule_id, rule_issues in sorted_rules[:5]:  # Топ-5 проблем
            issue = rule_issues[0]  # Берем первую как образец
            count = len(rule_issues)

            recommendation = f"{issue.rule_name}: найдено {count} проблем(а). "

            if issue.suggestion:
                recommendation += issue.suggestion

            recommendations.append(recommendation)

        # Если много автоисправимых проблем
        autocorrectable = [i for i in issues if i.can_autocorrect]
        if len(autocorrectable) > 5:
            recommendations.append(
                f"Доступна автокоррекция для {len(autocorrectable)} проблем. "
                "Используйте функцию автоматического исправления."
            )

        return recommendations

    def _load_default_profile(self) -> Dict[str, Any]:
        """
        Загружает профиль по умолчанию (ГОСТ 7.32-2017).

        Returns:
            Словарь с профилем
        """
        try:
            profiles_dir = Path(__file__).parent.parent.parent / "profiles"
            default_profile_path = profiles_dir / "gost_7_32_2017.json"

            if default_profile_path.exists():
                with open(default_profile_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            self.logger.warning(f"Не удалось загрузить профиль по умолчанию: {e}")

        # Возвращаем минимальный профиль
        return {"name": "Default", "version": "1.0", "rules": {}}

    def get_available_validators(self) -> List[Dict[str, Any]]:
        """
        Возвращает список доступных валидаторов.

        Returns:
            Список словарей с информацией о валидаторах
        """
        return [
            {
                "name": validator.name,
                "enabled": validator.enabled,
                "class": validator.__class__.__name__,
            }
            for validator in self.validators
        ]
