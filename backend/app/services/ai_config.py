"""Utility helpers for managing Gemini AI configuration stored in the project .env file."""
import os
import datetime
from typing import Dict

from dotenv import dotenv_values


ENV_KEY = "GEMINI_API_KEY"
TIMESTAMP_KEY = "GEMINI_CONFIGURED_AT"


def _get_env_path() -> str:
    """Return absolute path to the project-level .env file."""
    services_dir = os.path.abspath(os.path.dirname(__file__))
    project_root = os.path.abspath(os.path.join(services_dir, "..", "..", ".."))
    return os.path.join(project_root, ".env")


def _ensure_env_file(env_path: str) -> None:
    """Ensure that the .env file exists so we can safely write to it."""
    if os.path.exists(env_path):
        return
    with open(env_path, "w", encoding="utf-8") as env_file:
        env_file.write("")


def _load_env(env_path: str) -> Dict[str, str]:
    """Load variables from .env without altering process environment."""
    if not os.path.exists(env_path):
        return {}
    return dotenv_values(env_path)  # returns Dict[str, str]


def _write_env(env_path: str, values: Dict[str, str]) -> None:
    """Persist updated key/value mappings back to .env preserving other lines."""
    # Read original lines to retain comments and ordering where possible.
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as env_file:
            original_lines = env_file.readlines()
    else:
        original_lines = []

    seen_keys = set()
    target_keys = {ENV_KEY, TIMESTAMP_KEY}
    output_lines = []

    for line in original_lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            output_lines.append(line)
            continue

        key, _, _ = line.partition("=")
        key = key.strip()
        if key in target_keys:
            seen_keys.add(key)
            if key in values and values[key] is not None:
                output_lines.append(f"{key}={values[key]}\n")
        else:
            output_lines.append(line)

    # Append any new keys that were not present before.
    for key in target_keys - seen_keys:
        if key in values and values[key] is not None:
            output_lines.append(f"{key}={values[key]}\n")

    # Ensure trailing newline for POSIX friendliness.
    if output_lines and not output_lines[-1].endswith("\n"):
        output_lines[-1] = output_lines[-1] + "\n"

    with open(env_path, "w", encoding="utf-8") as env_file:
        env_file.writelines(output_lines)


def get_ai_status() -> Dict[str, str]:
    """Return current Gemini API key status without exposing the secret."""
    env_path = _get_env_path()
    env_data = _load_env(env_path)

    raw_key = env_data.get(ENV_KEY)
    configured_at = env_data.get(TIMESTAMP_KEY)

    masked_key = None
    if raw_key:
        # Mask everything except last 4 chars to help users verify the stored key.
        tail = raw_key[-4:]
        masked_key = f"{'*' * max(len(raw_key) - 4, 0)}{tail}"

    return {
        "has_key": bool(raw_key),
        "masked_key": masked_key,
        "configured_at": configured_at,
    }


def save_api_key(api_key: str) -> Dict[str, str]:
    """Persist API key and return updated status."""
    if not api_key or not api_key.strip():
        raise ValueError("API key must not be empty")

    cleaned_key = api_key.strip()
    env_path = _get_env_path()
    _ensure_env_file(env_path)

    env_data = _load_env(env_path)
    env_data[ENV_KEY] = cleaned_key
    env_data[TIMESTAMP_KEY] = datetime.datetime.utcnow().isoformat()

    _write_env(env_path, env_data)
    return get_ai_status()


def clear_api_key() -> Dict[str, str]:
    """Remove the stored API key and return the resulting status."""
    env_path = _get_env_path()
    if not os.path.exists(env_path):
        return {"has_key": False, "masked_key": None, "configured_at": None}

    env_data = _load_env(env_path)
    env_data.pop(ENV_KEY, None)
    env_data.pop(TIMESTAMP_KEY, None)

    _write_env(env_path, env_data)
    return get_ai_status()
