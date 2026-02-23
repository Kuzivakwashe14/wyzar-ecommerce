import requests
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_post_api_otp_send():
    email = "test.user@example.com"
    otp_send_url = f"{BASE_URL}/api/otp/send"
    types = ["registration", "login", "password-reset"]

    # Test successful sends for each valid type
    for otp_type in types:
        payload = {"email": email, "type": otp_type}
        response = requests.post(otp_send_url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 for otp_type='{otp_type}' but got {response.status_code}"
        resp_json = response.json()
        assert "OTP" in resp_json.get("message", "") or "success" in resp_json.get("message", "").lower() or resp_json, \
            f"Unexpected response content for otp_type='{otp_type}': {resp_json}"

    # Test invalid input: missing email and type
    invalid_payloads = [
        {},  # missing both
        {"email": "not-an-email"},  # missing type
        {"type": "registration"},  # missing email
        {"email": "", "type": "registration"},  # empty email
        {"email": "test.user@example.com", "type": "invalid-type"}  # invalid type
    ]
    for payload in invalid_payloads:
        response = requests.post(otp_send_url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400 for invalid payload {payload} but got {response.status_code}"

    # Test rate limiting on repeated requests for login type
    # To trigger 429, send multiple requests rapidly
    rate_limit_type = "login"
    max_requests = 20  # number attempts to reliably trigger rate limiting
    rate_limit_triggered = False
    for i in range(max_requests):
        payload = {"email": email, "type": rate_limit_type}
        response = requests.post(otp_send_url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        if response.status_code == 429:
            rate_limit_triggered = True
            break
        # Optional short sleep to not hammer too fast but rapid enough to trigger rate limit
        time.sleep(0.2)
    assert rate_limit_triggered, "Expected 429 rate limited error after repeated OTP send requests"

test_post_api_otp_send()
