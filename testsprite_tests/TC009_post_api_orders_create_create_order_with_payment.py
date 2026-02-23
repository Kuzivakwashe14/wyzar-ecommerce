import requests
import base64

BASE_URL = "http://localhost:5000"
AUTH_CREDENTIALS = {
    "username": "tawandamhch@gmail.com",
    "password": "AlPha21Thxkvng"
}
TIMEOUT = 30

def get_basic_auth_header(username: str, password: str):
    token = base64.b64encode(f"{username}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}

def login_buyer():
    url = f"{BASE_URL}/api/auth/login"
    body = {
        "email": AUTH_CREDENTIALS["username"],
        "password": AUTH_CREDENTIALS["password"]
    }
    resp = requests.post(url, json=body, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    assert "token" in data, "JWT token missing in login response"
    return data["token"]

def get_all_products():
    url = f"{BASE_URL}/api/products"
    resp = requests.get(url, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Failed to get products: {resp.text}"
    products = resp.json()
    assert isinstance(products, list), "Products response is not a list"
    return products

def create_order(token, order_body):
    url = f"{BASE_URL}/api/orders/create"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(url, json=order_body, headers=headers, timeout=TIMEOUT)
    return resp

def test_post_api_orders_create_create_order_with_payment():
    # Login as buyer
    token = login_buyer()

    # Get products list to find products and stock
    products = get_all_products()
    assert len(products) >= 1, "No products available to order"

    # Prepare order items - use first product with stock for success test
    first_product = None
    for p in products:
        if isinstance(p.get("quantity"), int) and p["quantity"] > 0:
            first_product = p
            break
    assert first_product is not None, "No product with positive stock found"

    # Prepare valid order bodies for the 3 payment methods
    payment_methods = ["ECOCASH", "BANK_TRANSFER", "CASH_ON_DELIVERY"]
    shipping_details = {
        "shippingFullName": "Test Buyer",
        "shippingAddress": "123 Test Street",
        "shippingCity": "Harare",
        "shippingPhone": "+263711111111"
    }

    # Test successful order creation for each payment method
    created_order_ids = []
    try:
        for payment_method in payment_methods:
            order_body = {
                "items": [
                    {
                        "productId": first_product["id"],
                        "quantity": 1
                    }
                ],
                **shipping_details,
                "paymentMethod": payment_method
            }
            resp = create_order(token, order_body)
            assert resp.status_code == 201, f"Failed to create order with paymentMethod {payment_method}: {resp.text}"
            order = resp.json()
            assert "id" in order, "Created order has no id"
            assert order.get("paymentMethod") == payment_method, "Payment method in response mismatch"
            created_order_ids.append(order["id"])

        # Test order creation with quantity exceeding available stock should fail 400
        excessive_qty = first_product["quantity"] + 10
        invalid_order_body = {
            "items": [
                {
                    "productId": first_product["id"],
                    "quantity": excessive_qty
                }
            ],
            **shipping_details,
            "paymentMethod": "CASH_ON_DELIVERY"
        }
        resp = create_order(token, invalid_order_body)
        assert resp.status_code == 400, f"Expected 400 for quantity exceeding stock, got {resp.status_code}"
    finally:
        # No cleanup for orders here
        pass

test_post_api_orders_create_create_order_with_payment()
