import requests

BASE_URL = "http://localhost:5000"

AUTH_USERNAME = "tawandamhch@gmail.com"


def test_post_api_otp_resend_resend_otp_code():
    url = f"{BASE_URL}/api/otp/resend"
    payload = {
        "email": AUTH_USERNAME,
        "type": "registration"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert (
        ("message" in json_response and "resent" in json_response["message"].lower())
        or ("otp" in json_response and json_response.get("otp") is not None)
        or ("status" in json_response and json_response["status"].lower() in ["otp resent", "success"])
    ), f"Response JSON does not confirm OTP resent: {json_response}"

test_post_api_otp_resend_resend_otp_code()
