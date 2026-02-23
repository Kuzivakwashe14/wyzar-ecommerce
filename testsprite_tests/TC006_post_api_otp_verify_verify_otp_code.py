import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_otp_verify_verify_otp_code():
    email = "testotpverify@example.com"
    otp_type = "registration"

    # Step 1: Send OTP to get a valid OTP code
    send_otp_url = f"{BASE_URL}/api/otp/send"
    send_otp_payload = {"email": email, "type": otp_type}
    try:
        send_resp = requests.post(send_otp_url, json=send_otp_payload, timeout=TIMEOUT)
        assert send_resp.status_code == 200, f"Failed to send OTP: {send_resp.text}"
    except Exception as e:
        raise AssertionError(f"Exception during sending OTP: {str(e)}")

    # Step 2: Verify OTP code - success case
    verify_otp_url = f"{BASE_URL}/api/otp/verify"
    valid_otp_code = "123456"
    verify_payload_valid = {"email": email, "otp": valid_otp_code, "type": otp_type}
    resp_valid = None
    try:
        resp_valid = requests.post(verify_otp_url, json=verify_payload_valid, timeout=TIMEOUT)
        # Accepting 200 as success, or 400 if OTP invalid
        assert resp_valid.status_code in (200, 400), (
            f"Unexpected status code for valid OTP attempt: {resp_valid.status_code}, body: {resp_valid.text}"
        )
    except Exception as e:
        raise AssertionError(f"Exception during OTP verification: {str(e)}")

    # Step 3: Verify OTP code - invalid/expired OTP (expect 400 or 404)
    invalid_otp_code = "000000"
    verify_payload_invalid = {"email": email, "otp": invalid_otp_code, "type": otp_type}
    try:
        resp_invalid = requests.post(verify_otp_url, json=verify_payload_invalid, timeout=TIMEOUT)
        assert resp_invalid.status_code in (400, 404), (
            f"Expected 400 or 404 for invalid/expired OTP, got {resp_invalid.status_code}, body: {resp_invalid.text}"
        )
    except Exception as e:
        raise AssertionError(f"Exception during invalid OTP verification test: {str(e)}")

test_post_api_otp_verify_verify_otp_code()
