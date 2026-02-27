"""
Валидатор для проверки полей страницы документа.
"""

from typing import Dict, Any, List
import time
from docx.shared import Cm
from . import BaseValidator, ValidationResult, ValidationIssue, Severity


class MarginValidator(BaseValidator):
    """
    Валидатор для проверки полей страницы в соответствии с требованиями.

    Проверяет:
    - Левое поле (обычно 3.0 см)
    - Правое поле (обычно 1.5 см)
    - Верхнее поле (обычно 2.0 см)
    - Нижнее поле (обычно 2.0 см)
    - Поля колонтитулов
    """

    @property
    def name(self) -> str:
        return "MarginValidator"

    def validate(self, document: Any, document_data: Dict[str, Any]) -> ValidationResult:
        """
        Проверяет поля страницы в документе.

        Args:
            document: python-docx Document объект
            document_data: Извлечённые данные документа

        Returns:
            ValidationResult с найденными проблемами
        """
        start_time = time.time()
        issues: List[ValidationIssue] = []

        # Получаем требования к полям из профиля
        required_margins = {
            'left': self._get_rule_config('margins.left', 3.0),    # см
            'right': self._get_rule_config('margins.right', 1.5),  # см
            'top': self._get_rule_config('margins.top', 2.0),      # см
            'bottom': self._get_rule_config('margins.bottom', 2.0) # см
        }

        # Допустимое отклонение (в см)
        tolerance = 0.2

        # Проверяем каждую секцию документа
        for section_idx, section in enumerate(document.sections):
            # Проверка левого поля
            left_margin_cm = self._emu_to_cm(section.left_margin)
            if abs(left_margin_cm - required_margins['left']) > tolerance:
                issues.append(self._create_issue(
                    rule_id=6,
                    rule_name="Левое поле",
                    description=f"Неверное левое поле: {left_margin_cm:.2f} см",
                    severity=Severity.ERROR,
                    location=self._format_location(
                        section_index=section_idx,
                        section_name=f"Секция {section_idx + 1}"
                    ),
                    expected=f"{required_margins['left']:.2f} см",
                    actual=f"{left_margin_cm:.2f} см",
                    suggestion=f"Установите левое поле {required_margins['left']} см",
                    can_autocorrect=True
                ))

            # Проверка правого поля
            right_margin_cm = self._emu_to_cm(section.right_margin)
            if abs(right_margin_cm - required_margins['right']) > tolerance:
                issues.append(self._create_issue(
                    rule_id=6,
                    rule_name="Правое поле",
                    description=f"Неверное правое поле: {right_margin_cm:.2f} см",
                    severity=Severity.ERROR,
                    location=self._format_location(
                        section_index=section_idx,
                        section_name=f"Секция {section_idx + 1}"
                    ),
                    expected=f"{required_margins['right']:.2f} см",
                    actual=f"{right_margin_cm:.2f} см",
                    suggestion=f"Установите правое поле {required_margins['right']} см",
                    can_autocorrect=True
                ))

            # Проверка верхнего поля
            top_margin_cm = self._emu_to_cm(section.top_margin)
            if abs(top_margin_cm - required_margins['top']) > tolerance:
                issues.append(self._create_issue(
                    rule_id=6,
                    rule_name="Верхнее поле",
                    description=f"Неверное верхнее поле: {top_margin_cm:.2f} см",
                    severity=Severity.ERROR,
                    location=self._format_location(
                        section_index=section_idx,
                        section_name=f"Секция {section_idx + 1}"
                    ),
                    expected=f"{required_margins['top']:.2f} см",
                    actual=f"{top_margin_cm:.2f} см",
                    suggestion=f"Установите верхнее поле {required_margins['top']} см",
                    can_autocorrect=True
                ))

            # Проверка нижнего поля
            bottom_margin_cm = self._emu_to_cm(section.bottom_margin)
            if abs(bottom_margin_cm - required_margins['bottom']) > tolerance:
                issues.append(self._create_issue(
                    rule_id=6,
                    rule_name="Нижнее поле",
                    description=f"Неверное нижнее поле: {bottom_margin_cm:.2f} см",
                    severity=Severity.ERROR,
                    location=self._format_location(
                        section_index=section_idx,
                        section_name=f"Секция {section_idx + 1}"
                    ),
                    expected=f"{required_margins['bottom']:.2f} см",
                    actual=f"{bottom_margin_cm:.2f} см",
                    suggestion=f"Установите нижнее поле {required_margins['bottom']} см",
                    can_autocorrect=True
                ))

            # Проверка полей колонтитулов (если указаны в профиле)
            header_margin = self._get_rule_config('margins.header')
            footer_margin = self._get_rule_config('margins.footer')

            if header_margin is not None:
                header_margin_cm = self._emu_to_cm(section.header_distance)
                if abs(header_margin_cm - header_margin) > tolerance:
                    issues.append(self._create_issue(
                        rule_id=6,
                        rule_name="Поле колонтитула (верх)",
                        description=f"Неверное поле верхнего колонтитула: {header_margin_cm:.2f} см",
                        severity=Severity.WARNING,
                        location=self._format_location(
                            section_index=section_idx
                        ),
                        expected=f"{header_margin:.2f} см",
                        actual=f"{header_margin_cm:.2f} см",
                        can_autocorrect=True
                    ))

            if footer_margin is not None:
                footer_margin_cm = self._emu_to_cm(section.footer_distance)
                if abs(footer_margin_cm - footer_margin) > tolerance:
                    issues.append(self._create_issue(
                        rule_id=6,
                        rule_name="Поле колонтитула (низ)",
                        description=f"Неверное поле нижнего колонтитула: {footer_margin_cm:.2f} см",
                        severity=Severity.WARNING,
                        location=self._format_location(
                            section_index=section_idx
                        ),
                        expected=f"{footer_margin:.2f} см",
                        actual=f"{footer_margin_cm:.2f} см",
                        can_autocorrect=True
                    ))

        # Проверка консистентности полей между секциями
        if len(document.sections) > 1:
            issues.extend(self._check_margin_consistency(document))

        execution_time = time.time() - start_time
        passed = len(issues) == 0

        return ValidationResult(
            validator_name=self.name,
            passed=passed,
            issues=issues,
            execution_time=execution_time
        )

    def _emu_to_cm(self, emu_value: int) -> float:
        """
        Конвертирует EMU (English Metric Units) в сантиметры.

        Args:
            emu_value: Значение в EMU

        Returns:
            Значение в сантиметрах
        """
        if emu_value is None:
            return 0.0
        # 1 см = 360000 EMU
        return emu_value / 360000.0

    def _check_margin_consistency(self, document: Any) -> List[ValidationIssue]:
        """
        Проверяет консистентность полей между секциями документа.

        Args:
            document: Document объект

        Returns:
            Список найденных проблем
        """
        issues = []

        # Получаем поля первой секции как эталон
        first_section = document.sections[0]
        reference_margins = {
            'left': self._emu_to_cm(first_section.left_margin),
            'right': self._emu_to_cm(first_section.right_margin),
            'top': self._emu_to_cm(first_section.top_margin),
            'bottom': self._emu_to_cm(first_section.bottom_margin)
        }

        tolerance = 0.1

        # Сравниваем с остальными секциями
        for idx, section in enumerate(document.sections[1:], start=1):
            section_margins = {
                'left': self._emu_to_cm(section.left_margin),
                'right': self._emu_to_cm(section.right_margin),
                'top': self._emu_to_cm(section.top_margin),
                'bottom': self._emu_to_cm(section.bottom_margin)
            }

            for margin_name, margin_value in section_margins.items():
                if abs(margin_value - reference_margins[margin_name]) > tolerance:
                    issues.append(self._create_issue(
                        rule_id=6,
                        rule_name="Консистентность полей",
                        description=f"Поля секции {idx + 1} отличаются от первой секции",
                        severity=Severity.WARNING,
                        location=self._format_location(
                            section_index=idx,
                            margin_type=margin_name
                        ),
                        expected=f"{reference_margins[margin_name]:.2f} см",
                        actual=f"{margin_value:.2f} см",
                        suggestion="Установите одинаковые поля для всех секций",
                        can_autocorrect=True
                    ))

        return issues
