#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Анализ оставшихся ошибок после автоисправления"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))
from app.services.document_corrector import DocumentCorrector
from app.services.document_processor import DocumentProcessor
from app.services.norm_control_checker import NormControlChecker

print('=== АНАЛИЗ ОСТАВШИХСЯ ОШИБОК ===')
print()

test_file = os.path.join(os.path.dirname(__file__), 'tests', 'test_data', 'documents', 'all_errors.docx')

# 1. Проверяем оригинальный документ
processor = DocumentProcessor(test_file)
document_data = processor.extract_data()
checker = NormControlChecker()
check_results = checker.check_document(document_data)
original_issues = check_results.get('issues', [])

print(f'Оригинал: {len(original_issues)} ошибок')
print()

# 2. Исправляем документ
corrector = DocumentCorrector()
corrected_path = corrector.correct_document(test_file)

# 3. Проверяем исправленный документ
new_processor = DocumentProcessor(corrected_path)
new_data = new_processor.extract_data()
new_results = checker.check_document(new_data)
new_issues = new_results.get('issues', [])

print(f'После исправления: {len(new_issues)} ошибок')
print()
print('=' * 60)
print('ОСТАВШИЕСЯ ОШИБКИ:')
print('=' * 60)

for i, issue in enumerate(new_issues, 1):
    print(f'{i}. [{issue.get("severity", "?"):6}] [{issue.get("type", "?"):20}]')
    print(f'   {issue.get("description", "")[:80]}')
    print(f'   Локация: {issue.get("location", "?")[:50]}')
    print(f'   Автоисправ.: {"Да" if issue.get("auto_fixable") else "Нет"}')
    print()

# Группируем по типу
print('=' * 60)
print('ГРУППИРОВКА ПО ТИПУ:')
print('=' * 60)
by_type = {}
for issue in new_issues:
    t = issue.get('type', 'unknown')
    by_type[t] = by_type.get(t, 0) + 1

for t, count in sorted(by_type.items(), key=lambda x: -x[1]):
    print(f'  {t}: {count}')
