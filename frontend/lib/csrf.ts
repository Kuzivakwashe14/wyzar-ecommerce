// frontend/lib/csrf.ts

let csrfToken: string | null = null;

/**
 * Fetch CSRF token from backend
 */
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await fetch('http://localhost:5000/api/csrf-token', {
      method: 'GET',
      credentials: 'include' // Important: Include cookies
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken as string;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
};

/**
 * Get current CSRF token (fetch if not available)
 */
export const getCsrfToken = async (): Promise<string> => {
  if (!csrfToken) {
    return await fetchCsrfToken();
  }
  return csrfToken;
};

/**
 * Clear CSRF token (call on logout or token expiry)
 */
export const clearCsrfToken = (): void => {
  csrfToken = null;
};
