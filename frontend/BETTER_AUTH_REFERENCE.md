# Better Auth Quick Reference

## 🎯 Quick Start

### Using Better Auth in Components

```tsx
"use client";
import { useBetterAuth } from '@/context/BetterAuthContext';

export default function MyComponent() {
  const { user, isAuthenticated, isPending } = useBetterAuth();

  if (isPending) return <div>Loading...</div>;
  
  if (!isAuthenticated) return <div>Please login</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

---

## 🔐 Authentication Actions

### Sign Up
```tsx
import { signUp } from '@/lib/auth-client';

const { data, error } = await signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'User Name', // optional
});

if (error) {
  console.error('Signup failed:', error.message);
} else {
  console.log('User created:', data.user);
}
```

### Sign In
```tsx
import { signIn } from '@/lib/auth-client';

const { data, error } = await signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

if (error) {
  console.error('Login failed:', error.message);
} else {
  console.log('Logged in:', data.user);
}
```

### Sign Out
```tsx
import { signOut } from '@/lib/auth-client';

await signOut();
// User is now logged out
```

---

## 👤 Accessing User Data

### In React Components
```tsx
import { useBetterAuth } from '@/context/BetterAuthContext';

function ProfileComponent() {
  const { user, isAuthenticated } = useBetterAuth();

  if (!isAuthenticated) return null;

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Is Seller: {user.isSeller ? 'Yes' : 'No'}</p>
      {user.phone && <p>Phone: {user.phone}</p>}
    </div>
  );
}
```

### User Object Properties
```typescript
user = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: 'buyer' | 'seller' | 'admin';
  isSeller: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isSuspended: boolean;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🛡️ Protected Routes

### Client Component
```tsx
"use client";
import { useBetterAuth } from '@/context/BetterAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isAuthenticated, isPending } = useBetterAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isPending, router]);

  if (isPending) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected content</div>;
}
```

### Role-Based Access
```tsx
function AdminOnlyComponent() {
  const { user, isAuthenticated } = useBetterAuth();

  if (!isAuthenticated || user.role !== 'admin') {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

### Seller-Only Access
```tsx
function SellerOnlyComponent() {
  const { user, isAuthenticated } = useBetterAuth();

  if (!isAuthenticated || !user.isSeller) {
    return <div>Seller access required</div>;
  }

  return <div>Seller dashboard</div>;
}
```

---

## 🌐 Making API Calls

### With Session Cookies (Automatic)
```tsx
// Better Auth automatically includes session cookies
const response = await fetch('http://localhost:5000/api/products', {
  credentials: 'include', // Important: Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
```

### Creating Products (Seller)
```tsx
const { user } = useBetterAuth();

if (!user.isSeller) {
  throw new Error('Seller access required');
}

const response = await fetch('http://localhost:5000/api/seller/products', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Product Name',
    price: 29.99,
    // ... other fields
  }),
});
```

---

## 🔔 Loading States

### Show Loading While Checking Auth
```tsx
function MyComponent() {
  const { user, isAuthenticated, isPending } = useBetterAuth();

  if (isPending) {
    return <div className="flex justify-center p-4">
      <div className="animate-spin">Loading...</div>
    </div>;
  }

  return isAuthenticated ? (
    <div>Welcome {user.email}</div>
  ) : (
    <div>Please log in</div>
  );
}
```

---

## 🎨 UI Components

### Conditional Rendering
```tsx
function Navbar() {
  const { user, isAuthenticated } = useBetterAuth();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user.email}</span>
          <button onClick={() => signOut()}>Logout</button>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/sign-up">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

### User Avatar
```tsx
function UserAvatar() {
  const { user, isAuthenticated } = useBetterAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center gap-2">
      {user.image ? (
        <img 
          src={user.image} 
          alt={user.name} 
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          {user.email[0].toUpperCase()}
        </div>
      )}
      <span>{user.name || user.email}</span>
    </div>
  );
}
```

---

## 🔧 Common Patterns

### Check if User is Logged In
```tsx
const { isAuthenticated } = useBetterAuth();
if (isAuthenticated) {
  // User is logged in
}
```

### Check User Role
```tsx
const { user } = useBetterAuth();
if (user?.role === 'admin') {
  // User is admin
}
```

### Check if User is Seller
```tsx
const { user } = useBetterAuth();
if (user?.isSeller) {
  // User is seller
}
```

### Wait for Auth to Load
```tsx
const { isPending } = useBetterAuth();
if (isPending) {
  return <LoadingSpinner />;
}
```

---

## ⚠️ Error Handling

### Handle Auth Errors
```tsx
try {
  const { data, error } = await signIn.email({
    email: 'user@example.com',
    password: 'wrong-password',
  });

  if (error) {
    // Handle error
    switch (error.status) {
      case 401:
        toast.error('Invalid credentials');
        break;
      case 429:
        toast.error('Too many attempts. Try again later.');
        break;
      default:
        toast.error('Login failed');
    }
  }
} catch (err) {
  console.error('Unexpected error:', err);
}
```

---

## 🧪 Testing Helpers

### Check Session in Console
```javascript
fetch('http://localhost:5000/api/better-auth/get-session', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
```

### Check Cookies
```javascript
console.log('Cookies:', document.cookie.split('; '))
```

### Manually Sign Out
```javascript
fetch('http://localhost:5000/api/better-auth/sign-out', {
  method: 'POST',
  credentials: 'include'
})
  .then(() => console.log('Signed out'))
```

---

## 📚 Type Definitions

```typescript
// Import types
import type { Session, User } from '@/lib/auth-client';

// Use in your code
function myFunction(user: User) {
  console.log(user.email);
}

// Context return type
interface BetterAuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isPending: boolean;
  error: Error | null;
}
```

---

## 🚀 Migration from Old Auth

### Old Way (JWT)
```tsx
// ❌ Old
import { useAuth } from '@/context/AuthContent';
const { user, isAuthenticated, login, logout } = useAuth();
```

### New Way (Better Auth)
```tsx
// ✅ New
import { useBetterAuth } from '@/context/BetterAuthContext';
import { signIn, signOut } from '@/lib/auth-client';

const { user, isAuthenticated } = useBetterAuth();
// Use signIn.email() for login
// Use signOut() for logout
```

---

**Need Help?** Check:
- `INTEGRATION_COMPLETE.md` - Full integration details
- `test-better-auth.md` - Testing guide
- Better Auth Docs: https://www.better-auth.com/docs
