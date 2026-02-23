import requests
import io

BASE_URL = "http://localhost:5000"
REGISTER_URL = f"{BASE_URL}/api/auth/register"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
PRODUCTS_URL = f"{BASE_URL}/api/products"

seller_email = "tawandamhch@gmail.com"
seller_password = "AlPha21Thxkvng"

non_seller_email = "nonseller@example.com"
non_seller_password = "NoNse11@pass"

def login_user(email, password):
    resp = requests.post(
        LOGIN_URL,
        json={"email": email, "password": password},
        timeout=30
    )
    resp.raise_for_status()
    data = resp.json()
    token = data.get("token")
    seller = data.get("seller", None)
    assert isinstance(token, str) and token != '', "Login did not return a valid token"
    return token, seller

def create_sample_image_file():
    # Create an in-memory file for upload (1x1 px PNG)
    png_data = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\xdac\xf8\x0f'
        b'\x00\x01\x01\x01\x00\x18\xdd\x8e\xd9\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return ('image1.png', io.BytesIO(png_data), 'image/png')


def test_create_new_product_as_seller_and_non_seller():
    # Login as seller to get JWT
    seller_token, seller_info = login_user(seller_email, seller_password)
    assert seller_token, "Seller login failed, no token returned"

    # Login or register non-seller user
    non_seller_token = None

    non_seller_login_resp = requests.post(
        LOGIN_URL,
        json={"email": non_seller_email, "password": non_seller_password},
        timeout=30
    )

    if non_seller_login_resp.status_code == 200:
        non_seller_token = non_seller_login_resp.json().get("token")
    elif non_seller_login_resp.status_code == 401:
        # Register non-seller then login
        register_resp = requests.post(
            REGISTER_URL,
            json={
                "email": non_seller_email,
                "password": non_seller_password,
                "firstName": "Non",
                "lastName": "Seller"
            },
            timeout=30
        )
        assert register_resp.status_code == 201, f"Non-seller registration failed with status {register_resp.status_code}"
        login_resp = requests.post(
            LOGIN_URL,
            json={"email": non_seller_email, "password": non_seller_password},
            timeout=30
        )
        login_resp.raise_for_status()
        non_seller_token = login_resp.json().get("token")
    else:
        non_seller_login_resp.raise_for_status()

    assert non_seller_token, "Non-seller login failed, no token"

    product_id = None
    headers_seller = {"Authorization": f"Bearer {seller_token}"}
    product_data = {
        "name": "Test Product TC008",
        "description": "A test product description for TC008",
        "price": 19.99,  # number
        "category": "TestCategory",
        "quantity": 5  # number
    }

    files = {"images": create_sample_image_file()}
    try:
        # Create product as seller
        resp = requests.post(
            PRODUCTS_URL,
            headers=headers_seller,
            data={k: str(v) for k, v in product_data.items()},
            files=files,
            timeout=30
        )
        assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}"
        resp_json = resp.json()
        assert isinstance(resp_json, dict)
        assert resp_json.get("name") == product_data["name"]
        assert "id" in resp_json
        product_id = resp_json["id"]

        # Attempt create product as non-seller, expect 403
        headers_non_seller = {"Authorization": f"Bearer {non_seller_token}"}
        resp2 = requests.post(
            PRODUCTS_URL,
            headers=headers_non_seller,
            data={k: str(v) for k, v in product_data.items()},
            files=files,
            timeout=30
        )
        assert resp2.status_code == 403, f"Expected 403 Forbidden for non-seller, got {resp2.status_code}"

    finally:
        # Cleanup: Delete created product if any
        if product_id:
            del_resp = requests.delete(
                f"{PRODUCTS_URL}/{product_id}",
                headers=headers_seller,
                timeout=30
            )
            # Allow 200 or 404 if already deleted
            assert del_resp.status_code in (200, 404)


test_create_new_product_as_seller_and_non_seller()
