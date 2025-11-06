#!/usr/bin/env python
"""
Скрипт для одновременного запуска сервера и тестов
"""
import subprocess
import time
import sys
import signal
import os

def run_server():
    """Запуск сервера в отдельном процессе"""
    server_env = os.environ.copy()
    server_env['PYTHONIOENCODING'] = 'utf-8'
    server_proc = subprocess.Popen(
        [sys.executable, 'run.py'],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        env=server_env
    )
    return server_proc

def main():
    """Главная функция"""
    print("Запуск сервера...")
    server = run_server()
    
    try:
        # Ждем, пока сервер запустится
        print("Ожидание запуска сервера (3 сек)...")
        time.sleep(3)
        
        # Запуск тестов
        print("\nЗапуск E2E тестов...\n")
        test_proc = subprocess.run(
            [sys.executable, 'test_full_flow.py'],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        return test_proc.returncode
        
    finally:
        # Останавливаем сервер
        print("\nОстановка сервера...")
        server.terminate()
        server.wait(timeout=5)

if __name__ == '__main__':
    sys.exit(main())
