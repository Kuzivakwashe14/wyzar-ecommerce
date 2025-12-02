// frontend/lib/api.ts

import { getCsrfToken, clearCsrfToken } from './csrf';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Make authenticated API request with CSRF protection
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const authToken = localStorage.getItem('authToken'); // or however you store it

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Add auth token if available
    if (authToken) {
      headers['x-auth-token'] = authToken;
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
      const csrfToken = await getCsrfToken();
      headers['x-csrf-token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Important for cookies
    });

    // Handle CSRF token errors
    if (response.status === 403) {
      const data = await response.json();
      if (data.msg?.includes('CSRF')) {
        // Token expired or invalid, fetch new one and retry
        clearCsrfToken();
        const newCsrfToken = await getCsrfToken();
        headers['x-csrf-token'] = newCsrfToken;

        // Retry the request
        return fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include'
        }).then(res => res.json());
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Example usage functions
export const createOrder = async (orderData: any) => {
  return apiRequest('/orders/create', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

export const createProduct = async (productData: FormData) => {
  const authToken = localStorage.getItem('authToken');
  const csrfToken = await getCsrfToken();

  return fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'x-auth-token': authToken || '',
      'x-csrf-token': csrfToken
    },
    credentials: 'include',
    body: productData // Don't set Content-Type for FormData
  }).then(res => res.json());
};

export const updateProduct = async (productId: string, productData: FormData) => {
  const authToken = localStorage.getItem('authToken');
  const csrfToken = await getCsrfToken();

  return fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'PUT',
    headers: {
      'x-auth-token': authToken || '',
      'x-csrf-token': csrfToken
    },
    credentials: 'include',
    body: productData
  }).then(res => res.json());
};

export const deleteProduct = async (productId: string) => {
  return apiRequest(`/products/${productId}`, {
    method: 'DELETE'
  });
};

export const createReview = async (reviewData: any) => {
  return apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });
};

export const updateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
  return apiRequest(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, trackingNumber })
  });
};
