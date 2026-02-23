import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_login_user_login():
    # Valid login credentials (from PRD instructions)
    valid_email = "tawandamhch@gmail.com"
    valid_password = "AlPha21Thxkvng"  # strong password

    login_url = f"{BASE_URL}/api/auth/login"
    headers = {"Content-Type": "application/json"}

    # Test: Login with valid credentials
    valid_payload = {
        "email": valid_email,
        "password": valid_password
    }
    try:
        valid_response = requests.post(login_url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during valid login attempt: {e}"

    assert valid_response.status_code == 200, f"Expected 200 but got {valid_response.status_code} for valid login"
    try:
        valid_json = valid_response.json()
    except ValueError:
        assert False, "Response is not valid JSON for valid login"

    assert "token" in valid_json, "JWT token missing in response for valid login"
    assert "seller" in valid_json, "Seller details missing in response for valid login"
    # Optionally, verify token is a non-empty string
    token = valid_json.get("token")
    assert isinstance(token, str) and token.strip(), "Invalid JWT token format"

    # Test: Login with invalid credentials (wrong password)
    invalid_payload = {
        "email": valid_email,
        "password": "WrongPass123!"
    }
    try:
        invalid_response = requests.post(login_url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed during invalid login attempt: {e}"

    assert invalid_response.status_code == 401, f"Expected 401 but got {invalid_response.status_code} for invalid login"

test_post_api_auth_login_user_login()
