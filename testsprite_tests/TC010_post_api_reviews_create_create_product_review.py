import requests

BASE_URL = "http://localhost:5000"
USERNAME = "tawandamhch@gmail.com"
PASSWORD = "AlPha21Thxkvng"
TIMEOUT = 30

def test_post_api_reviews_create_create_product_review():
    session = requests.Session()

    # Step 1: Login to get JWT token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    jwt_token = login_data.get("token") or login_data.get("jwt") or login_data.get("accessToken")
    assert jwt_token, "JWT token not found in login response"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }

    # Step 2: Get buyer's orders to find a purchased productId
    myorders_url = f"{BASE_URL}/api/orders/myorders"
    orders_resp = session.get(myorders_url, headers=headers, timeout=TIMEOUT)
    assert orders_resp.status_code == 200, f"Failed to get user's orders: {orders_resp.text}"
    orders = orders_resp.json()

    # Find a productId from the first order's items
    product_id = None
    if isinstance(orders, list):
        for order in orders:
            items = order.get("items", [])
            if items and isinstance(items, list):
                for item in items:
                    if "productId" in item:
                        product_id = item["productId"]
                        break
                if product_id:
                    break
    assert product_id, "No purchased productId found in user's orders"

    review_url = f"{BASE_URL}/api/reviews"

    review_payload = {
        "productId": product_id,
        "rating": 5,
        "title": "Excellent product",
        "comment": "I am very happy with this product. Highly recommend!"
    }

    # Step 3: Create a new review - Expect 201 Created
    create_resp = session.post(review_url, headers=headers, json=review_payload, timeout=TIMEOUT)
    assert create_resp.status_code == 201, f"Creating review failed: {create_resp.text}"
    created_review = create_resp.json()
    review_id = created_review.get("id") or created_review.get("_id")
    assert review_id, "Created review ID not found in response"

    try:
        # Step 4: Attempt to create the same review again - Expect 400 error
        duplicate_resp = session.post(review_url, headers=headers, json=review_payload, timeout=TIMEOUT)
        assert duplicate_resp.status_code == 400, f"Duplicate review creation should fail with 400, got {duplicate_resp.status_code}"
    finally:
        # Cleanup: Delete the created review to keep test idempotent
        delete_url = f"{BASE_URL}/api/reviews/{review_id}"
        delete_resp = session.delete(delete_url, headers=headers, timeout=TIMEOUT)
        # Accept 200 OK or 204 No Content as successful deletion
        assert delete_resp.status_code in [200, 204], f"Failed to delete review: {delete_resp.text}"

test_post_api_reviews_create_create_product_review()