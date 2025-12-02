#!/usr/bin/env python
"""
Скрипт для последовательного запуска всех тестов.
Обходит проблему совместимости Python 3.14 с pytest при смешанном запуске.
"""
import subprocess
import sys
from pathlib import Path

def run_tests(test_dir: str, name: str) -> tuple[int, int, int]:
    """Запускает тесты из указанной директории и возвращает статистику."""
    print(f"\n{'='*60}")
    print(f"Запуск {name}...")
    print('='*60)
    
    result = subprocess.run(
        [sys.executable, '-m', 'pytest', test_dir, '--tb=short', '-q'],
        cwd=Path(__file__).parent,
        capture_output=False
    )
    
    return result.returncode


def main():
    """Запускает все тесты по категориям."""
    backend_dir = Path(__file__).parent
    
    test_suites = [
        ('tests/unit/', 'Unit тесты'),
        ('tests/functional/', 'Функциональные тесты'),
        ('tests/integration/', 'Интеграционные тесты'),
    ]
    
    results = {}
    
    for test_dir, name in test_suites:
        full_path = backend_dir / test_dir
        if full_path.exists():
            results[name] = run_tests(str(full_path), name)
        else:
            print(f"Директория {test_dir} не найдена, пропускаем")
    
    # Итоговый отчёт
    print(f"\n{'='*60}")
    print("ИТОГОВЫЙ ОТЧЁТ")
    print('='*60)
    
    all_passed = True
    for name, returncode in results.items():
        status = "✓ PASSED" if returncode == 0 else "✗ FAILED"
        print(f"{name}: {status}")
        if returncode != 0:
            all_passed = False
    
    print('='*60)
    
    return 0 if all_passed else 1


if __name__ == '__main__':
    sys.exit(main())
