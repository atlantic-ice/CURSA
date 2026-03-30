# ПРИЛОЖЕНИЕ А. ЛИСТИНГИ ИСХОДНОГО КОДА

---

## А.1. Главный файл приложения Flask

**Файл:** `backend/app/__init__.py`

```python
"""
Модуль инициализации приложения Flask.
"""

import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from .config import config

db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)


def create_app(config_name: str = "development") -> Flask:
    """
    Фабрика приложения Flask.
    
    Args:
        config_name: Название конфигурации (development, testing, production)
        
    Returns:
        Экземпляр приложения Flask
    """
    app = Flask(__name__)
    
    # Загрузка конфигурации
    app.config.from_object(config[config_name])
    
    # Инициализация расширений
    db.init_app(app)
    jwt.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("FRONTEND_ORIGINS", "*")}},
        supports_credentials=True
    )
    limiter.init_app(app)
    
    # Настройка логирования
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Регистрация blueprints
    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")
    
    # Создание таблиц БД
    with app.app_context():
        db.create_all()
    
    return app
```

---

## А.2. Validation Engine

**Файл:** `backend/app/services/validation_engine.py`

```python
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
        AdvancedFormatValidator,
        CrossReferenceValidator,
        HeaderFooterValidator,
        FootnoteValidator,
        PageBreakValidator,
    ]

    def __init__(self, profile: Optional[Dict[str, Any]] = None):
        """
        Инициализация движка валидации.

        Args:
            profile: Профиль требований (JSON конфигурация)
        """
        self.logger = logger
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
        """Инициализирует все валидаторы с текущим профилем."""
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
        """Генерирует итоговый отчет о проверке."""
        # Собираем все проблемы
        all_issues = []
        for result in validation_results:
            all_issues.extend(result.issues)

        # Подсчитываем статистику
        total_issues = len(all_issues)
        critical_count = sum(1 for issue in all_issues if issue.severity == Severity.CRITICAL)
        error_count = sum(1 for issue in all_issues if issue.severity == Severity.ERROR)
        warning_count = sum(1 for issue in all_issues if issue.severity == Severity.WARNING)

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
            "summary": {
                "total_issues": total_issues,
                "critical": critical_count,
                "errors": error_count,
                "warnings": warning_count,
                "completion_percentage": self._calculate_completion(all_issues),
            },
            "execution": {
                "total_time": round(total_time, 3),
                "validators_run": len(validation_results),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            },
            "validators": [result.to_dict() for result in validation_results],
        }

        return report

    def _calculate_completion(self, issues: List[ValidationIssue]) -> float:
        """Вычисляет процент соответствия требованиям."""
        penalties = {
            Severity.CRITICAL: 10,
            Severity.ERROR: 5,
            Severity.WARNING: 2,
            Severity.INFO: 0,
        }

        total_penalty = sum(penalties[issue.severity] for issue in issues)
        completion = max(0, 100 - total_penalty)

        return round(completion, 1)

    def _load_default_profile(self) -> Dict[str, Any]:
        """Загружает профиль по умолчанию (ГОСТ 7.32-2017)."""
        try:
            profiles_dir = Path(__file__).parent.parent.parent / "profiles"
            default_profile_path = profiles_dir / "gost_7_32_2017.json"

            if default_profile_path.exists():
                with open(default_profile_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            self.logger.warning(f"Не удалось загрузить профиль по умолчанию: {e}")

        return {"name": "Default", "version": "1.0", "rules": {}}
```

---

## А.3. Font Validator

**Файл:** `backend/app/services/validators/font_validator.py`

```python
"""
Валидатор проверки шрифтов.
"""

from typing import List, Dict, Any, Optional
from docx import Document
from docx.shared import Pt, Twips
from docx.text.paragraph import Paragraph
from docx.text.run import Run

from .base import BaseValidator, ValidationIssue, Severity


class FontValidator(BaseValidator):
    """
    Валидатор проверки шрифтов.

    Проверяет соответствие шрифтов и их размеров требованиям профиля.
    """

    type = "font"

    def __init__(self, profile: Optional[Dict[str, Any]] = None):
        """
        Инициализация валидатора.

        Args:
            profile: Профиль с настройками шрифтов
        """
        super().__init__(profile)
        self.required_fonts = self.profile.get("allowed_fonts", ["Times New Roman"])
        self.required_size = self.profile.get("size", 14)
        self.size_tolerance = self.profile.get("size_tolerance", 0.5)
        self.enabled = self.profile.get("enabled", True)

    def validate(
        self, doc: Document, document_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """
        Проверить шрифты в документе.

        Args:
            doc: Объект документа python-docx
            document_data: Дополнительные данные документа

        Returns:
            Результат валидации
        """
        self.issues = []

        for idx, paragraph in enumerate(doc.paragraphs):
            # Пропускаем пустые параграфы
            if not paragraph.text.strip():
                continue

            # Проверка каждого run (фрагмента текста)
            for run_idx, run in enumerate(paragraph.runs):
                if not run.text.strip():
                    continue

                self._check_font_name(run, idx, run_idx)
                self._check_font_size(run, idx, run_idx)

        return ValidationResult(
            validator_name=self.name,
            issues=self.issues,
            execution_time=0.0
        )

    def _check_font_name(self, run: Run, para_idx: int, run_idx: int) -> None:
        """Проверить имя шрифта."""
        font_name = run.font.name

        if font_name:
            font_name = font_name.strip()

        if font_name and font_name not in self.required_fonts:
            self.issues.append(self._create_issue(
                rule_id="font_name",
                rule_name="Проверка шрифта",
                severity=Severity.ERROR,
                description=f"Шрифт '{font_name}' не соответствует "
                           f"требованиям. Ожидается: {', '.join(self.required_fonts)}",
                position={
                    "paragraph": para_idx,
                    "run": run_idx,
                    "text_preview": run.text[:50] if run.text else ""
                },
                can_autocorrect=True,
                suggestion=f"Изменить шрифт на {self.required_fonts[0]}"
            ))

    def _check_font_size(self, run: Run, para_idx: int, run_idx: int) -> None:
        """Проверить размер шрифта."""
        font_size = run.font.size

        if font_size is None:
            return

        # Размер в python-docx хранится в EMU, конвертируем в пункты
        actual_size_pt = font_size.pt

        if abs(actual_size_pt - self.required_size) > self.size_tolerance:
            self.issues.append(self._create_issue(
                rule_id="font_size",
                rule_name="Размер шрифта",
                severity=Severity.ERROR,
                description=f"Размер шрифта {actual_size_pt}pt не соответствует "
                           f"требуемому {self.required_size}pt",
                position={
                    "paragraph": para_idx,
                    "run": run_idx
                },
                can_autocorrect=True,
                suggestion=f"Изменить размер шрифта на {self.required_size}pt"
            ))
```

---

## А.4. Главный компонент Frontend

**Файл:** `frontend/src/App.tsx` (фрагмент, 200 строк)

```typescript
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
    ArrowUpRight,
    BookOpen,
    FilePlus2,
    FolderOpen,
    KeyRound,
    LayoutDashboard,
    LucideIcon,
    Search,
    Settings,
    User,
} from "lucide-react";
import {
    FC,
    ReactNode,
    Suspense,
    createContext,
    lazy,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Navigate,
    Outlet,
    Route,
    BrowserRouter as Router,
    Routes,
    useNavigate,
} from "react-router-dom";
import { authApi, type AuthUser } from "./api/client";
import ErrorBoundary from "./components/ErrorBoundary";

// ============================================================================
// Type Definitions
// ============================================================================

type ColorMode = "light" | "dark";

interface UIActionsContextType {
  openShortcuts: () => void;
  openPalette: () => void;
}

interface PaletteNavItem {
  label: string;
  to: string;
  shortcut: string;
  icon: LucideIcon;
}

// ============================================================================
// Contexts
// ============================================================================

export const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
});

export const CheckHistoryContext = createContext<CheckHistoryContextType>({
  history: [],
  addToHistory: () => {},
  removeFromHistory: () => {},
  clearHistory: () => {},
});

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// ============================================================================
// Page Components (Lazy Loaded)
// ============================================================================

const UploadPage = lazy(() => import("./pages/UploadPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

// ============================================================================
// Layout Components
// ============================================================================

const PageLoader: FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        className="size-14 rounded-2xl border bg-card"
      />
      <p className="text-sm text-muted-foreground">CURSA — Загружаем...</p>
    </div>
  </div>
);

const ProtectedRoute: FC<{ children?: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children ?? <Outlet />;
};

// ============================================================================
// Main App Component
// ============================================================================

const App: FC = () => {
  const [mode, setMode] = useState<ColorMode>(() => {
    const stored = localStorage.getItem("colorMode");
    return (stored as ColorMode) || "light";
  });
  const [checkHistory, setCheckHistory] = useState<CheckHistoryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("checkHistory") || "[]");
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setAuthLoading(false);
      return;
    }
    authApi.me(token)
      .then((data) => {
        // ... обработка данных пользователя
      })
      .finally(() => setAuthLoading(false));
  }, []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <CheckHistoryContext.Provider value={historyContextValue}>
        <AuthContext.Provider value={authContextValue}>
          <ThemeProvider theme={muiTheme}>
            <ErrorBoundary>
              <Router>
                <AppContent />
              </Router>
            </ErrorBoundary>
          </ThemeProvider>
        </AuthContext.Provider>
      </CheckHistoryContext.Provider>
    </ColorModeContext.Provider>
  );
};

export default App;
```

---

## А.5. API Routes (Backend)

**Файл:** `backend/app/api/document_routes.py` (фрагмент)

```python
"""
API routes для работы с документами.
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from docx import Document
import os
import uuid

from app.services.validation_engine import ValidationEngine
from app.services.correction_service import CorrectionService
from app.models import Document as DocumentModel
from app import db

api = Blueprint('documents', __name__, url_prefix='/documents')

ALLOWED_EXTENSIONS = {'docx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@api.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    """Загрузить и проверить документ."""
    
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': {'code': 'NO_FILE', 'message': 'Файл не загружен'}
        }), 400
    
    file = request.files['file']
    if not file.filename.endswith('.docx'):
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_FORMAT', 'message': 'Требуется формат DOCX'}
        }), 400
    
    profile_id = request.form.get('profile_id', 'gost_7_32_2017')
    
    filename = secure_filename(file.filename)
    file_id = str(uuid.uuid4())
    file_path = os.path.join('uploads', f"{file_id}_{filename}")
    os.makedirs('uploads', exist_ok=True)
    file.save(file_path)
    
    try:
        doc = Document(file_path)
        engine = ValidationEngine()
        result = engine.validate_document(file_path)
        
        return jsonify({
            'success': True,
            'data': {
                'document_id': file_id,
                'filename': filename,
                'result': {
                    'score': result['summary'].get('completion_percentage', 0),
                    'passed': result['passed'],
                    'total_issues': result['summary']['total_issues'],
                    'issues': result.get('issues', [])
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'PROCESSING_ERROR', 'message': str(e)}
        }), 500


@api.route('/<document_id>/report', methods=['GET'])
@jwt_required()
def get_report(document_id: str):
    """Получить отчёт о проверке."""
    
    doc_model = DocumentModel.query.get(document_id)
    if not doc_model:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Документ не найден'}
        }), 404
    
    return jsonify({
        'success': True,
        'data': {
            'document_id': doc_model.id,
            'filename': doc_model.filename,
            'status': doc_model.status,
            'created_at': doc_model.created_at.isoformat()
        }
    })
```

---

*Продолжение листингов в Приложении Б...*
