"""Regression tests for global rate limiting behavior."""


def test_profiles_polling_does_not_block_login(client, test_user):
    """Profiles polling should not trigger global 429 before login."""
    statuses = [client.get("/api/profiles/").status_code for _ in range(60)]

    assert all(status == 200 for status in statuses), statuses

    login_response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "TestPassword123!"},
    )

    assert login_response.status_code == 200, login_response.get_json()


def test_login_rate_limit_returns_json_error(client):
    """Login rate limit responses should stay JSON for SPA clients."""
    last_response = None

    for _ in range(12):
        last_response = client.post(
            "/api/auth/login",
            json={
                "email": "missing@example.com",
                "password": "wrong-password",
            },
        )

    assert last_response is not None
    assert last_response.status_code == 429
    assert last_response.is_json
    assert last_response.get_json()["error"] == ("Слишком много запросов. Повторите попытку позже.")
