import os
import json
import datetime
import traceback
import logging
import uuid
import shutil
from werkzeug.utils import secure_filename
from app.services.document_processor import DocumentProcessor
from app.services.norm_control_checker import NormControlChecker
from app.services.document_corrector import DocumentCorrector

logger = logging.getLogger(__name__)


SESSION_TTL_SECONDS = 60 * 60


def _get_total_issues(check_results):
    """Извлекает total_issues из разных форматов ответа проверок."""
    if not isinstance(check_results, dict):
        return 0

    if isinstance(check_results.get('total_issues_count'), int):
        return check_results['total_issues_count']

    summary = check_results.get('summary')
    if isinstance(summary, dict) and isinstance(summary.get('total_issues'), int):
        return summary['total_issues']

    issues = check_results.get('issues')
    if isinstance(issues, list):
        return len(issues)

    return 0


def _get_completion_percentage(check_results):
    """Извлекает процент соответствия документа требованиям."""
    if not isinstance(check_results, dict):
        return None

    completion = check_results.get('completion_percentage')
    if isinstance(completion, (int, float)):
        return float(completion)

    summary = check_results.get('summary')
    if isinstance(summary, dict):
        summary_completion = summary.get('completion_percentage')
        if isinstance(summary_completion, (int, float)):
            return float(summary_completion)

    return None


def _build_graduation_readiness(after_total_issues, completion_percentage):
    """Возвращает статус готовности документа к финальной сдаче."""
    if completion_percentage is None:
        return {
            'status': 'unknown',
            'target_completion': 95.0,
            'target_issues_max': 3,
            'message': 'Недостаточно данных для оценки готовности.',
        }

    if completion_percentage >= 97 and after_total_issues <= 1:
        status = 'ready'
        message = 'Документ соответствует уровню финальной сдачи.'
    elif completion_percentage >= 95 and after_total_issues <= 3:
        status = 'almost_ready'
        message = 'Документ близок к финальной сдаче, нужна минимальная ручная вычитка.'
    else:
        status = 'needs_revision'
        message = 'Требуются дополнительные исправления перед финальной сдачей.'

    return {
        'status': status,
        'target_completion': 95.0,
        'target_issues_max': 3,
        'message': message,
    }

class WorkflowService:
    def __init__(self, corrections_dir):
        self.corrections_dir = corrections_dir
        self.document_sessions = {}
        os.makedirs(self.corrections_dir, exist_ok=True)

    def _cleanup_expired_sessions(self):
        now = datetime.datetime.utcnow()
        expired_tokens = []

        for token, session in self.document_sessions.items():
            created_at = session.get('created_at')
            if created_at is None:
                expired_tokens.append(token)
                continue

            session_age = (now - created_at).total_seconds()
            if session_age > SESSION_TTL_SECONDS:
                expired_tokens.append(token)

        for token in expired_tokens:
            self.complete_document_session(token)

    def create_document_session(
        self,
        file_path,
        original_filename,
        profile_id=None,
        temp_dir=None,
        check_results=None,
    ):
        self._cleanup_expired_sessions()

        token = uuid.uuid4().hex
        self.document_sessions[token] = {
            'file_path': file_path,
            'original_filename': original_filename,
            'profile_id': profile_id,
            'temp_dir': temp_dir,
            'check_results': check_results,
            'created_at': datetime.datetime.utcnow(),
        }
        return token

    def get_document_session(self, token):
        self._cleanup_expired_sessions()

        session = self.document_sessions.get(token)
        if not session:
            return None

        file_path = session.get('file_path')
        if not file_path or not os.path.exists(file_path):
            self.complete_document_session(token)
            return None

        return session.copy()

    def complete_document_session(self, token):
        session = self.document_sessions.pop(token, None)
        if not session:
            return False

        file_path = session.get('file_path')
        temp_dir = session.get('temp_dir')

        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        except OSError:
            logger.warning("Не удалось удалить временный файл сессии: %s", file_path)

        try:
            if temp_dir and os.path.isdir(temp_dir):
                os.rmdir(temp_dir)
        except OSError:
            logger.warning(
                "Не удалось удалить временную директорию сессии: %s",
                temp_dir,
            )

        return True

    def analyze_document(self, file_path, original_filename, profile_id=None):
        """
        Только анализ документа: извлечение структуры и проверка нормоконтроля.
        """
        result = {
            'success': False,
            'filename': original_filename,
            'temp_path': file_path,
            'check_results': None,
            'structure': None,
            'formatting': None,
            'errors': []
        }

        try:
            logger.info(f"Analyzing document: {original_filename}")

            # Шаг 1: Используем process_document для получения данных и структуры
            proc_result = DocumentProcessor.process_document(file_path)

            if proc_result.get('status') == 'error':
                result['errors'].append(proc_result.get('message', 'Unknown error'))
                return result

            result['structure'] = proc_result.get('structure')
            result['formatting'] = proc_result.get('formatting')
            document_data = proc_result.get('raw_data')

            if not document_data:
                result['errors'].append('Не удалось извлечь данные из документа')
                return result

            # Шаг 2: Проверка нормоконтроля
            logger.info(f"Using profile: {profile_id or 'default_gost'}")
            checker = NormControlChecker(profile_id=profile_id)
            check_results = checker.check_document(document_data)
            result['check_results'] = check_results

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            logger.error(traceback.format_exc())
            result['errors'].append(f"Критическая ошибка анализа: {str(e)}")
            return result

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
            before_total_issues = _get_total_issues(check_results)

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
                max_passes = 4 if before_total_issues >= 80 else 3
                attempt_passes = [max_passes]
                if before_total_issues > 0:
                    attempt_passes.append(min(max_passes + 1, 5))

                best_attempt = None
                attempts_meta = []

                for attempt_index, passes in enumerate(attempt_passes, start=1):
                    suffix = '' if attempt_index == 1 else f"_retry{attempt_index}"
                    corrected_filename = f"{safe_base}_corrected_{timestamp}{suffix}.docx"
                    permanent_path = os.path.join(self.corrections_dir, corrected_filename)

                    corrector.max_passes = passes
                    corrected_file_path, correction_report = corrector.correct_document_multipass(
                        file_path,
                        out_path=permanent_path,
                        max_passes=passes,
                    )

                    if not os.path.exists(corrected_file_path):
                        result['errors'].append(
                            f'Файл исправления не был создан (попытка {attempt_index}).'
                        )
                        continue

                    corrected_proc = DocumentProcessor.process_document(corrected_file_path)
                    if corrected_proc.get('status') == 'error' or not corrected_proc.get('raw_data'):
                        result['errors'].append(
                            f'Не удалось выполнить повторную проверку исправленного документа (попытка {attempt_index}).'
                        )
                        continue

                    corrected_check_results = checker.check_document(corrected_proc['raw_data'])
                    after_total_issues = _get_total_issues(corrected_check_results)
                    completion_percentage = _get_completion_percentage(corrected_check_results)
                    attempts_meta.append({
                        'attempt': attempt_index,
                        'passes': passes,
                        'after_total_issues': after_total_issues,
                        'completion_percentage': completion_percentage,
                    })

                    attempt_payload = {
                        'corrected_filename': corrected_filename,
                        'corrected_file_path': corrected_file_path,
                        'correction_report': correction_report,
                        'corrected_check_results': corrected_check_results,
                        'after_total_issues': after_total_issues,
                        'completion_percentage': completion_percentage,
                        'passes': passes,
                    }

                    is_better = False
                    if best_attempt is None:
                        is_better = True
                    elif after_total_issues < best_attempt['after_total_issues']:
                        is_better = True
                    elif after_total_issues == best_attempt['after_total_issues']:
                        best_completion = best_attempt.get('completion_percentage')
                        current_completion = completion_percentage
                        if current_completion is not None and (
                            best_completion is None or current_completion > best_completion
                        ):
                            is_better = True

                    if is_better:
                        if best_attempt and os.path.exists(best_attempt['corrected_file_path']):
                            try:
                                os.remove(best_attempt['corrected_file_path'])
                            except OSError:
                                logger.warning(
                                    "Не удалось удалить файл худшей попытки коррекции: %s",
                                    best_attempt['corrected_file_path'],
                                )
                        best_attempt = attempt_payload
                    else:
                        try:
                            os.remove(corrected_file_path)
                        except OSError:
                            logger.warning(
                                "Не удалось удалить файл невыбранной попытки коррекции: %s",
                                corrected_file_path,
                            )

                if best_attempt:
                    result['corrected_file_path'] = best_attempt['corrected_filename']
                    result['full_corrected_path'] = best_attempt['corrected_file_path']
                    result['corrected_check_results'] = best_attempt['corrected_check_results']

                    after_total_issues = best_attempt['after_total_issues']
                    completion_percentage = best_attempt['completion_percentage']
                    report = best_attempt['correction_report']

                    result['quality_metrics'] = {
                        'before_total_issues': before_total_issues,
                        'after_total_issues': after_total_issues,
                        'resolved_total_issues': max(0, before_total_issues - after_total_issues),
                        'completion_percentage': completion_percentage,
                        'passes_completed': report.passes_completed,
                        'remaining_issues_reported': report.remaining_issues,
                        'attempts': attempts_meta,
                        'fallback_applied': False,
                    }

                    result['quality_gate_passed'] = after_total_issues <= before_total_issues
                    if not result['quality_gate_passed']:
                        # Гарантия отсутствия деградации: если коррекция ухудшила результат,
                        # возвращаем безопасную копию исходного документа.
                        safe_filename = f"{safe_base}_safe_{timestamp}.docx"
                        safe_output_path = os.path.join(self.corrections_dir, safe_filename)
                        shutil.copy2(file_path, safe_output_path)

                        result['corrected_file_path'] = safe_filename
                        result['full_corrected_path'] = safe_output_path
                        result['corrected_check_results'] = check_results
                        result['quality_metrics'].update({
                            'after_total_issues': before_total_issues,
                            'resolved_total_issues': 0,
                            'completion_percentage': _get_completion_percentage(check_results),
                            'fallback_applied': True,
                        })
                        result['quality_gate_passed'] = True
                        result['errors'].append(
                            'Обнаружено ухудшение качества после автокоррекции; применен безопасный fallback без деградации.'
                        )

                    readiness = _build_graduation_readiness(
                        result['quality_metrics']['after_total_issues'],
                        result['quality_metrics']['completion_percentage'],
                    )
                    result['graduation_ready'] = readiness['status'] in {'ready', 'almost_ready'}
                    result['graduation_readiness'] = readiness

                    result['correction_success'] = True
                else:
                    result['errors'].append('Автокоррекция не смогла сформировать валидный улучшенный результат.')

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
