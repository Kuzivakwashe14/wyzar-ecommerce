import requests

BASE_URL = "http://localhost:5000"  # Fixed BASE_URL by removing '/backend'
AUTH_CREDENTIALS = {
    "username": "tawandamhch@gmail.com",
    "password": "AlPha21Thxkvng"
}
TIMEOUT = 30


def test_post_api_auth_clerk_sync_sync_clerk_user_data():
    login_url = f"{BASE_URL}/api/auth/login"
    clerk_sync_url = f"{BASE_URL}/api/auth/clerk-sync"

    # Login payload and headers
    login_payload = {
        "email": AUTH_CREDENTIALS["username"],
        "password": AUTH_CREDENTIALS["password"]
    }

    try:
        # Perform login to get JWT token
        login_response = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        assert "token" in login_data, "Login response missing 'token'"
        token = login_data["token"]

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # Perform clerk sync with JWT token
        clerk_sync_response = requests.post(clerk_sync_url, headers=headers, timeout=TIMEOUT)
        assert clerk_sync_response.status_code == 200, f"Clerk sync failed with status {clerk_sync_response.status_code}"
        clerk_sync_data = clerk_sync_response.json()
        # Basic validation that synced user data exists and is a dictionary or non-empty
        assert isinstance(clerk_sync_data, dict) and clerk_sync_data, "Clerk sync response data invalid or empty"

    except requests.RequestException as e:
        assert False, f"Request failed: {str(e)}"


test_post_api_auth_clerk_sync_sync_clerk_user_data()
