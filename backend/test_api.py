import requests
import os
import json
from create_test_docx import create_test_document

def test_document_upload():
    """
    Тестирует загрузку документа через API
    """
    # Создаем тестовый документ
    test_doc_path = create_test_document()
    print(f"Тестовый документ создан: {test_doc_path}")
    
    # Открываем файл для отправки
    with open(test_doc_path, 'rb') as doc_file:
        # Создаем данные формы
        files = {'file': (os.path.basename(test_doc_path), doc_file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        
        # Отправляем запрос на API
        url = 'http://localhost:5000/api/document/upload'
        print(f"Отправка запроса на {url}")
        
        try:
            response = requests.post(url, files=files)
            
            # Выводим информацию о запросе
            print(f"Статус ответа: {response.status_code}")
            if response.status_code == 200:
                print("Успех! Документ успешно загружен и обработан")
                print("Ответ сервера:")
                print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            else:
                print("Ошибка при загрузке документа")
                try:
                    error_data = response.json()
                    print(f"Сообщение об ошибке: {error_data.get('error', 'Неизвестная ошибка')}")
                    print(f"Тип ошибки: {error_data.get('error_type', 'Не указан')}")
                except Exception as e:
                    print(f"Ошибка при разборе ответа: {str(e)}")
                    print(f"Текст ответа: {response.text}")
        
        except requests.exceptions.ConnectionError:
            print("Ошибка подключения. Убедитесь, что сервер Flask запущен.")
        except Exception as e:
            print(f"Произошла ошибка при отправке запроса: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    test_document_upload() 