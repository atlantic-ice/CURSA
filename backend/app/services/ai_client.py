"""Thin Gemini client wrapper for generating suggestions and completions.

This module loads the API key from the project .env (managed by ai_config)
and exposes helper functions that return safe, structured results.
"""
from __future__ import annotations

import os
from typing import Any, Dict, Optional

from .ai_config import _get_env_path, _load_env, ENV_KEY


def _get_api_key() -> Optional[str]:
    # Prefer environment variable already loaded via dotenv; fall back to .env read
    key = os.environ.get(ENV_KEY)
    if key:
        return key
    env_path = _get_env_path()
    env_data = _load_env(env_path)
    return env_data.get(ENV_KEY)


def is_configured() -> bool:
    return bool(_get_api_key())


def _ensure_sdk():
    try:
        import google.generativeai  # noqa: F401
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "google-generativeai is not installed. Install it from requirements.txt"
        ) from e


def _get_model(model_name: str = "gemini-1.5-flash"):
    _ensure_sdk()
    import google.generativeai as genai

    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("Gemini API key is not configured")
    genai.configure(api_key=api_key)

    # Default generation config tuned for concise suggestions
    generation_config = {
        "temperature": 0.2,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 1024,
    }
    safety_settings = None  # Use default
    return genai.GenerativeModel(model_name, generation_config=generation_config, safety_settings=safety_settings)


def suggest_for_check_results(check_results: Dict[str, Any], filename: Optional[str] = None, language: str = "ru") -> str:
    """Generate practical, concise suggestions for given check_results.

    Returns a plain text string. Handles empty inputs gracefully.
    """
    if not check_results:
        return "Не найдено данных для анализа."

    issues = check_results.get("issues", [])
    total = check_results.get("total_issues_count", len(issues))
    stats = check_results.get("statistics", {})

    # Build a compact prompt in Russian by default
    name = filename or "документ"
    prompt = [
        f"Ты помощник по нормоконтролю оформления Word-документов.",
        f"Файл: {name}.",
        f"Всего несоответствий: {total}.",
        "Ниже — список проблем в JSON. Верни краткий план исправлений (5–10 пунктов максимум),",
        "сгруппируй по темам (интервалы, заголовки, списки, таблицы, рисунки),",
        "добавь только конкретные действия и значения параметров (например, межстрочный 1.5, отступы 0 пт, интервалы до/после для Heading 1/2).",
        "Если часть проблем уже автоисправима, отметь это. Пиши по-русски, кратко и по делу.",
        "JSON проблем:",
        str({
            "issues": issues[:50],  # cap to avoid huge payloads
            "statistics": stats,
        }),
    ]

    model = _get_model()
    response = model.generate_content("\n".join(prompt))
    text = getattr(response, "text", None) or ""
    return text.strip() or "Нет рекомендаций."


def complete_prompt(prompt: str) -> str:
    if not prompt or not prompt.strip():
        return ""
    model = _get_model()
    response = model.generate_content(prompt.strip())
    return getattr(response, "text", None) or ""
