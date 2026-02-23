import requests

BASE_URL = "http://localhost:5000"
LOGIN_PATH = "/api/auth/login"
AUTH_ME_PATH = "/api/auth/me"

USERNAME = "tawandamhch@gmail.com"
PASSWORD = "AlPha21Thxkvng"
TIMEOUT = 30


def test_get_authenticated_user_profile():
    login_url = BASE_URL + LOGIN_PATH
    auth_me_url = BASE_URL + AUTH_ME_PATH

    # Login with valid credentials to get JWT token
    try:
        login_resp = requests.post(
            login_url,
            json={"email": USERNAME, "password": PASSWORD},
            timeout=TIMEOUT,
        )
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    assert login_resp.status_code == 200, f"Expected 200 on login, got {login_resp.status_code}"
    login_data = login_resp.json()
    assert "token" in login_data or "jwt" in login_data, "Login response missing JWT token"

    token = login_data.get("token") or login_data.get("jwt")
    assert isinstance(token, str) and len(token) > 0, "Invalid token received"

    headers_valid = {"Authorization": f"Bearer {token}"}
    # Test with valid token
    try:
        profile_resp = requests.get(auth_me_url, headers=headers_valid, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Get profile request failed with valid token: {e}"

    assert profile_resp.status_code == 200, f"Expected 200 for valid token, got {profile_resp.status_code}"
    profile_data = profile_resp.json()
    # Validate presence of user object keys and seller details
    assert "email" in profile_data, "User profile missing 'email'"
    # seller details may be nested, could be None or object
    seller_keys = ["seller", "sellerDetails"]
    assert any(key in profile_data for key in seller_keys), "User profile missing seller details"

    # Test with invalid token
    headers_invalid = {"Authorization": "Bearer invalid.token.value"}
    try:
        resp_invalid = requests.get(auth_me_url, headers=headers_invalid, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Get profile request failed with invalid token: {e}"

    assert resp_invalid.status_code == 401, f"Expected 401 for invalid token, got {resp_invalid.status_code}"

    # Test with missing token (no Authorization header)
    try:
        resp_no_auth = requests.get(auth_me_url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Get profile request failed with missing token: {e}"

    assert resp_no_auth.status_code == 401, f"Expected 401 for missing token, got {resp_no_auth.status_code}"


test_get_authenticated_user_profile()