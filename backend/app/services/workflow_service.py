import os
import json
import datetime
import traceback
import logging
import uuid
from werkzeug.utils import secure_filename
from app.services.document_processor import DocumentProcessor
from app.services.norm_control_checker import NormControlChecker
from app.services.document_corrector import DocumentCorrector

logger = logging.getLogger(__name__)

class WorkflowService:
    def __init__(self, corrections_dir):
        self.corrections_dir = corrections_dir
        os.makedirs(self.corrections_dir, exist_ok=True)

    def process_document(self, file_path, original_filename, profile_id=None):
        """
        Полный цикл обработки документа: извлечение, проверка, исправление, отчет.
        """
        result = {
            'success': False,
            'filename': original_filename,
            'temp_path': file_path,
            'check_results': None,
            'correction_success': False,
            'corrected_file_path': None,
            'corrected_check_results': None,
            'report_path': None,
            'errors': []
        }

        try:
            # Шаг 1: Создание DocumentProcessor
            logger.info(f"Processing document: {original_filename}")
            doc_processor = DocumentProcessor(file_path)
            
            # Шаг 2: Извлечение данных
            document_data = doc_processor.extract_data()
            if not document_data:
                result['errors'].append('Не удалось извлечь данные из документа')
                return result

            # Шаг 3: Проверка нормоконтроля
            logger.info(f"Using profile: {profile_id or 'default_gost'}")
            checker = NormControlChecker(profile_id=profile_id)
            check_results = checker.check_document(document_data)
            result['check_results'] = check_results

            # Шаг 4: Автоисправление
            try:
                # Загружаем профиль
                profile_filename = f"{profile_id}.json" if profile_id else 'default_gost.json'
                profile_data = None
                
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                profile_path = os.path.join(base_dir, 'profiles', profile_filename)
                
                if not os.path.exists(profile_path):
                    profile_path = os.path.join(base_dir, 'profiles', 'default_gost.json')

                if os.path.exists(profile_path):
                    with open(profile_path, 'r', encoding='utf-8') as f:
                        profile_data = json.load(f)

                corrector = DocumentCorrector(profile_data=profile_data)

                # Генерируем имя исправленного файла
                base_name, _ = os.path.splitext(original_filename)
                safe_base = secure_filename(base_name) or "document"
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                corrected_filename = f"{safe_base}_corrected_{timestamp}.docx"
                permanent_path = os.path.join(self.corrections_dir, corrected_filename)

                # Исправляем
                corrected_file_path = corrector.correct_document(file_path, None, out_path=permanent_path)
                
                if os.path.exists(corrected_file_path):
                    result['correction_success'] = True
                    result['corrected_file_path'] = corrected_filename
                    result['full_corrected_path'] = corrected_file_path
                else:
                    result['errors'].append('Файл исправления не был создан')

            except Exception as e:
                logger.error(f"Correction failed: {e}")
                result['errors'].append(f"Ошибка автоисправления: {str(e)}")

            # Шаг 5: Генерация отчета
            try:
                report_path = doc_processor.generate_report_document(check_results, original_filename)
                result['report_path'] = report_path
            except Exception as e:
                logger.error(f"Report generation failed: {e}")
                result['errors'].append(f"Ошибка генерации отчета: {str(e)}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            logger.error(traceback.format_exc())
            result['errors'].append(f"Критическая ошибка обработки: {str(e)}")
            return result
