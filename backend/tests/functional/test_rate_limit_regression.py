"""Regression tests for global rate limiting behavior."""


def test_profiles_polling_does_not_block_login(client, test_user):
    """Frequent profile list requests should not trigger global 429 before login."""
    statuses = [client.get("/api/profiles/").status_code for _ in range(60)]

    assert all(status == 200 for status in statuses), statuses

    login_response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "TestPassword123!"},
    )

    assert login_response.status_code == 200, login_response.get_json()
