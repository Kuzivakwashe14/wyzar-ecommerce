import requests
import uuid

BASE_URL = "http://localhost:5000"
REGISTER_ENDPOINT = "/api/auth/register"
TIMEOUT = 30

def test_post_api_auth_register_user_registration():
    # Generate a unique email to avoid conflicts unless testing duplicate
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    strong_password = "StrongP@ssw0rd1!"
    first_name = "Test"
    last_name = "User"

    headers = {
        "Content-Type": "application/json"
    }

    # Payload for registration
    payload = {
        "email": unique_email,
        "password": strong_password,
        "firstName": first_name,
        "lastName": last_name
    }

    # Register new user - expect 201 and response contains user object & JWT token
    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        data = response.json()
        # Assert presence of expected fields in user object and JWT token
        assert isinstance(data, dict), "Response is not a JSON object"
        assert "user" in data or "token" in data, "Response missing user object or JWT token"
        # Basic checks
        if "user" in data:
            user = data["user"]
            assert isinstance(user, dict), "User object is not a dictionary"
            assert user.get("email") == unique_email.lower()
            # Optionally check for firstName and lastName presence if returned
            assert "firstName" in user
            assert "lastName" in user
        if "token" in data:
            token = data["token"]
            assert isinstance(token, str) and len(token) > 0
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Attempt to register again with the same email - expect 409 Conflict
    try:
        response_dup = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response_dup.status_code == 409, f"Expected 409, got {response_dup.status_code}"
        # Optionally check for error message in response body
        resp_dup_json = response_dup.json()
        if resp_dup_json:
            # Could be error string or object with message
            if isinstance(resp_dup_json, dict):
                msg = resp_dup_json.get("message") or resp_dup_json.get("error")
                assert msg is not None and "exists" in msg.lower()
            elif isinstance(resp_dup_json, str):
                assert "exists" in resp_dup_json.lower()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_post_api_auth_register_user_registration()
