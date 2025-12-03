# Better Auth Frontend Integration - Test Guide

## Prerequisites
✅ Backend running on http://localhost:5000
✅ Frontend running on http://localhost:3000
✅ MongoDB connected
✅ Better Auth endpoint: http://localhost:5000/api/better-auth

---

## Test Steps

### 1. Test Session Endpoint
Open your browser console and run:
```javascript
fetch('http://localhost:5000/api/better-auth/get-session', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
```
Expected: Returns session data or null if not logged in

---

### 2. Test Signup Flow

1. **Navigate to Signup Page**
   - Go to: http://localhost:3000/sign-up
   - Should see signup form

2. **Enter Details**
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123

3. **Send OTP**
   - Click "Continue"
   - OTP should be sent to email (check backend logs)
   - Should move to OTP verification screen

4. **Verify OTP**
   - Enter the 6-digit OTP from email/logs
   - Click "Verify & Create Account"
   - Account should be created using Better Auth
   - Should redirect to home page

5. **Check Session**
   - Open browser console
   - Run: `document.cookie`
   - Should see Better Auth session cookies

---

### 3. Test Login Flow

1. **Navigate to Login Page**
   - Go to: http://localhost:3000/login
   - Should see login form

2. **Enter Credentials**
   - Email: test@example.com
   - Password: password123

3. **Submit Login**
   - Click "Sign In"
   - Should see success toast
   - Should redirect to home page

4. **Verify Session**
   - Check browser cookies (should have Better Auth session)
   - Refresh page - should stay logged in

---

### 4. Test Session Persistence

1. **After Login**
   - Open browser DevTools > Application > Cookies
   - Should see cookies from localhost:5000

2. **Refresh Page**
   - Reload http://localhost:3000
   - Should remain logged in
   - User data should persist

3. **Check Session Data**
   - Open browser console
   - Run:
   ```javascript
   fetch('http://localhost:5000/api/better-auth/get-session', {
     credentials: 'include'
   })
     .then(r => r.json())
     .then(data => console.log('Session:', data))
   ```
   - Should show your user data

---

### 5. Test Logout (When Implemented)

1. **Find Logout Button**
   - Usually in navbar or profile menu

2. **Click Logout**
   - Should clear session
   - Should redirect to login/home

3. **Verify Logout**
   - Cookies should be cleared
   - Accessing protected routes should redirect to login

---

## Debugging

### If Signup Fails

**Check Backend Logs**:
```powershell
# Backend terminal should show:
# POST /api/better-auth/sign-up/email
```

**Check Frontend Console**:
- Look for any error messages
- Check Network tab for failed requests

**Common Issues**:
- CORS errors → Check backend CORS config
- 404 errors → Verify Better Auth endpoint is mounted
- Database errors → Check MongoDB connection

### If Login Fails

**Check Request**:
- Open DevTools > Network
- Look for POST to `/api/better-auth/sign-in/email`
- Check request payload and response

**Check Cookies**:
- After login, check Application > Cookies
- Should see Better Auth session cookies
- Cookies should be httpOnly and secure

**Common Issues**:
- Invalid credentials → Check password
- No session cookie → Check backend CORS/credentials
- 401 errors → Check Better Auth secret and database

### If Session Not Persisting

**Check Cookie Settings**:
- Cookies should have domain: localhost
- Should have SameSite: Lax or None
- Should have httpOnly: true

**Check Backend CORS**:
```javascript
// backend/config/security.js
credentials: true, // Must be true
origin: 'http://localhost:3000' // Must match frontend
```

**Check Frontend Fetch**:
```typescript
// Must include credentials
fetch(url, { credentials: 'include' })
```

---

## Success Criteria

✅ Can create account via signup form
✅ OTP verification works
✅ Better Auth creates user in database
✅ Can login with email and password
✅ Session cookies are set correctly
✅ Session persists across page refresh
✅ User data is accessible via Better Auth context
✅ No console errors related to auth

---

## Next Steps After Testing

1. **Update Protected Routes**
   - Replace `useAuth()` with `useBetterAuth()`
   - Update authentication checks

2. **Update Navbar/Profile**
   - Show user data from Better Auth
   - Add logout functionality

3. **Migrate API Calls**
   - Remove `x-auth-token` headers
   - Use session cookies instead

4. **Remove Old Auth System**
   - After all routes migrated
   - Remove `AuthContext.tsx`
   - Remove JWT token logic

---

## Useful Commands

**Check Backend is Running**:
```powershell
Test-NetConnection localhost -Port 5000 -InformationLevel Quiet
```

**Check Frontend is Running**:
```powershell
Test-NetConnection localhost -Port 3000 -InformationLevel Quiet
```

**View Backend Logs**:
- Check the terminal where backend is running
- Look for Better Auth requests

**View Frontend Logs**:
- Open browser DevTools > Console
- Check for errors or warnings

---

## Browser Console Helpers

**Check if Better Auth is loaded**:
```javascript
console.log('Better Auth context available:', !!window.useBetterAuth)
```

**Check current session**:
```javascript
fetch('http://localhost:5000/api/better-auth/get-session', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(session => console.log('Current session:', session))
```

**Check all cookies**:
```javascript
console.log('Cookies:', document.cookie.split('; '))
```

---

**Ready to Test!** 🚀

Start with the signup flow, then test login, and verify session persistence.
