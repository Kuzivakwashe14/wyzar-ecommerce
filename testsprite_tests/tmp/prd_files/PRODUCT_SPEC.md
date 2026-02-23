# WyZar E-Commerce Platform — Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** WyZar E-Commerce  
**Version:** 1.0.0  
**Platform:** Web Application (Desktop & Mobile Responsive)  
**Target Market:** Zimbabwe (with international seller support)  
**Description:** WyZar is a full-stack multi-vendor e-commerce marketplace that connects buyers and sellers in Zimbabwe. It features secure authentication, real-time messaging, seller verification, product management, order processing with local payment methods (EcoCash, bank transfer, cash on delivery), and a comprehensive admin dashboard.

---

## 2. Tech Stack

| Layer        | Technology                                      |
|--------------|--------------------------------------------------|
| Frontend     | Next.js 16, React 19, TypeScript, Tailwind CSS   |
| UI Library   | Radix UI, Framer Motion, Lucide Icons             |
| Backend      | Express 5 (Node.js), REST API                     |
| Database     | PostgreSQL with Prisma ORM                        |
| Auth         | Clerk (frontend + backend SDK), JWT, OTP          |
| Real-time    | Socket.io (client + server)                       |
| Payments     | PayNow (EcoCash), Bank Transfer, Cash on Delivery |
| Image Hosting| ImageKit                                          |
| Email        | Nodemailer                                        |
| Testing      | Jest, Supertest (backend); Playwright (frontend)  |
| Security     | Helmet, CSRF, XSS-Clean, Rate Limiting, HPP       |

---

## 3. User Roles

| Role   | Description                                                                 |
|--------|-----------------------------------------------------------------------------|
| USER   | Default role. Can browse products, place orders, leave reviews, send messages. |
| SELLER | Verified user who can list and manage products, fulfill orders, receive payments. |
| ADMIN  | Platform administrator with full access to user management, order management, analytics, reports, and seller verification. |

---

## 4. Core Features

### 4.1 Authentication & User Management

- **Clerk-based Authentication:** Sign up, sign in, and session management via Clerk.
- **OTP Verification:** Email-based OTP for registration, login, and password reset.
- **Phone Verification:** Users can verify phone numbers.
- **User Profiles:** First name, last name, email, phone, profile image.
- **Account Suspension:** Admins can suspend users with a reason.
- **User Blocking:** Users can block/unblock other users.

### 4.2 Product Catalog

- **Product Listing:** Sellers create products with name, description, images (via ImageKit), price, category, quantity, delivery time, country of origin, city, country, condition (New/Used/Refurbished), brand, and tags.
- **Product Search:** Full-text search with filters by category, price range, condition, city, and more.
- **Product Detail Page:** Displays product info, images, seller info, reviews, and average rating.
- **Featured Products:** Admin can mark products as featured; featured products appear prominently on the homepage.
- **View Tracking:** Product views are tracked.
- **CSV Bulk Upload:** Sellers can upload products in bulk via CSV files.

### 4.3 Shopping & Orders

- **Shopping Cart:** Users can add items to cart and proceed to checkout.
- **Checkout Flow:** Shipping details (full name, address, city, phone), payment method selection.
- **Payment Methods:**
  - **EcoCash** (mobile money via PayNow integration)
  - **Bank Transfer** (manual with proof of payment upload)
  - **Cash on Delivery**
- **Order Lifecycle:**
  - PENDING → CONFIRMED → PAID → SHIPPED → DELIVERED
  - Orders can be CANCELLED at appropriate stages.
- **Order Tracking:** Tracking number support; timestamps for paid, shipped, and delivered stages.
- **Order History:** Users can view their past orders.

### 4.4 Seller System

- **Become a Seller:** Users apply to become sellers by providing business details.
- **Seller Types:** Individual, Business, International.
- **Seller Verification:** Multi-step verification with document uploads:
  - Document types: National ID, Passport, Business Registration, Tax Certificate, Proof of Address, Bank Statement.
  - Verification statuses: PENDING → UNDER_REVIEW → APPROVED / REJECTED / INCOMPLETE.
  - Admin reviews and approves/rejects with notes.
- **Seller Details:** Business name, payment details (EcoCash number/name, bank account info), WhatsApp numbers, address, product category, annual revenue, etc.
- **Seller Dashboard:** Manage products, view orders, track sales.

### 4.5 Reviews & Ratings

- **Product Reviews:** Authenticated users can leave reviews with a rating (1-5), title, and comment.
- **Verified Purchase Badge:** Reviews from actual buyers are marked as verified purchases.
- **Helpful Votes:** Users can mark reviews as helpful.
- **Review Moderation:** Admin can approve/hide reviews.
- **Rating Aggregation:** Products display average rating and total review count.
- **One Review Per Product:** Each user can only leave one review per product (can edit).

### 4.6 Real-time Messaging

- **Buyer-Seller Chat:** Users can message sellers directly about products.
- **Conversations:** Organized by product context; tracks participants, unread counts.
- **Message Features:** Text messages with optional file attachments.
- **Read Receipts:** Messages show read/unread status with timestamps.
- **Real-time Updates:** Socket.io enables instant message delivery.
- **Template Messages:** Pre-defined message templates for common inquiries.

### 4.7 Reporting System

- **Report Users:** Users can report other users for: Spam, Harassment, Inappropriate Content, Scam, Fake Account, or Other.
- **Report Context:** Reports can be linked to specific messages or conversations.
- **Report Workflow:** PENDING → REVIEWED → RESOLVED / DISMISSED.
- **Admin Review:** Admins review reports, add notes, and take action.

### 4.8 Wishlist

- **Save Products:** Users can add products to their wishlist for later.
- **Wishlist Page:** Dedicated page to view and manage saved products.

---

## 5. Admin Dashboard

### 5.1 Admin Overview
- Dashboard with platform analytics and key metrics.

### 5.2 User Management
- View all users with filtering and search.
- Suspend/unsuspend users.
- Change user roles.
- View user details and activity.

### 5.3 Seller Management
- View all seller applications and their verification status.
- Review verification documents (ID, business registration, etc.).
- Approve or reject seller applications with notes.
- Access control for admin actions.

### 5.4 Product Management
- View all products across the platform.
- Feature/unfeature products.
- Remove products that violate policies.
- Bulk product operations via CSV.

### 5.5 Order Management
- View all orders across the platform.
- Filter orders by status, date, user.
- Update order statuses.
- View order details including items and payment info.

### 5.6 Review Management
- Moderate reviews across all products.
- Approve or hide reviews.

### 5.7 Access Control
- Role-based access control for admin routes.
- Audit logging for admin actions.

### 5.8 Settings
- Platform configuration settings.

---

## 6. Non-Functional Requirements

### 6.1 Security
- **HTTPS/TLS** encryption for all traffic.
- **Helmet** for HTTP security headers.
- **CSRF Protection** on all state-changing requests.
- **XSS Prevention** via input sanitization (xss-clean).
- **Rate Limiting** on API endpoints to prevent abuse.
- **HTTP Parameter Pollution (HPP)** protection.
- **Input Validation** using Zod schemas on both frontend and backend.
- **Password Hashing** with bcrypt.
- **JWT-based API Authentication** alongside Clerk sessions.
- **File Upload Validation** (type, size, hash-based duplicate detection).

### 6.2 Performance
- Database indexing on frequently queried fields (email, phone, category, price, dates).
- Optimized image delivery via ImageKit CDN.
- Paginated API responses for lists.
- Efficient Socket.io connection management.

### 6.3 Reliability
- Graceful error handling with centralized error middleware.
- Database connection pooling via Prisma.
- Comprehensive test suite (unit, integration, e2e).

### 6.4 Scalability
- Stateless API design for horizontal scaling.
- CDN-based image storage (ImageKit) to offload static assets.
- Database migrations managed via Prisma.

---

## 7. API Routes

| Route Group       | Base Path           | Description                                |
|--------------------|---------------------|--------------------------------------------|
| Authentication     | `/api/auth`         | Sign up, sign in, OTP, session management  |
| Products           | `/api/products`     | CRUD for products, search, filters         |
| Orders             | `/api/orders`       | Create, view, update orders                |
| Reviews            | `/api/reviews`      | Create, read, update reviews               |
| Messages           | `/api/messages`     | Conversations and messaging                |
| Search             | `/api/search`       | Product search with filters                |
| Seller             | `/api/seller`       | Seller registration and management         |
| OTP                | `/api/otp`          | OTP generation and verification            |
| ImageKit           | `/api/imagekit`     | Image upload authentication                |
| Admin              | `/api/admin`        | Admin dashboard and management             |
| Admin Users        | `/api/admin/users`  | User management                            |
| Admin Sellers      | `/api/admin/sellers`| Seller verification and management         |
| Admin Products     | `/api/admin/products`| Product moderation                        |
| Admin Orders       | `/api/admin/orders` | Order oversight                            |
| Admin Access Control| `/api/admin/access` | Role and permission management            |

---

## 8. Data Models

### Core Entities
- **User** — Account with roles (USER/SELLER/ADMIN), profile info, verification status.
- **SellerDetails** — Extended seller profile with business info, payment details, verification documents.
- **Product** — Listing with images, pricing, categorization, ratings.
- **Order** — Purchase record with shipping info, payment method, lifecycle status.
- **OrderItem** — Individual item within an order.
- **Review** — Product review with rating, verified purchase flag.
- **Conversation** — Chat thread between users, optionally linked to a product.
- **Message** — Individual message within a conversation.
- **Report** — User report with reason, status, and admin resolution.
- **OTP** — One-time password for email verification flows.
- **UserBlock** — Block relationship between users.
- **VerificationDocument** — Uploaded documents for seller verification.

---

## 9. Frontend Pages

| Page                     | Path                          | Description                                      |
|--------------------------|-------------------------------|--------------------------------------------------|
| Homepage                 | `/`                           | Featured products, categories, hero section       |
| Product Listing          | `/products`                   | Browse all products with search and filters       |
| Product Detail           | `/products/[id]`              | Full product info, images, reviews, seller info   |
| Checkout                 | `/dashboard/checkout`         | Shipping form, payment method, order summary      |
| My Orders                | `/dashboard/my-orders`        | User's order history                              |
| Order Detail             | `/dashboard/order/[id]`       | Single order details and status                   |
| Become a Seller          | `/dashboard/become-a-seller`  | Seller application and verification form          |
| Seller Dashboard         | `/dashboard/dashboard`        | Seller's product and order management             |
| Messages                 | `/messages`                   | Real-time chat with buyers/sellers                |
| Wishlist                 | `/wishlist`                   | Saved products                                    |
| Admin Dashboard          | `/admin`                      | Platform overview and analytics                   |
| Admin Users              | `/admin/users`                | User management                                   |
| Admin Sellers            | `/admin/sellers`              | Seller verification queue                         |
| Admin Products           | `/admin/products`             | Product moderation                                |
| Admin Orders             | `/admin/orders`               | Order management                                  |
| Admin Reviews            | `/admin/reviews`              | Review moderation                                 |
| Admin Analytics          | `/admin/analytics`            | Platform analytics and reports                    |
| Admin Access Control     | `/admin/access-control`       | Role and permission settings                      |
| Admin Settings           | `/admin/settings`             | Platform configuration                            |
| About Us                 | `/about-us`                   | Company information                               |
| Contact Us               | `/contact-us`                 | Contact form                                      |
| FAQ                      | `/faq`                        | Frequently asked questions                        |
| Help                     | `/help`                       | Help and support                                  |
| Privacy Policy           | `/privacy-policy`             | Privacy policy                                    |
| Terms & Conditions       | `/terms-conditions`           | Terms of service                                  |
| Shipping Info            | `/shipping`                   | Shipping policy and information                   |
| Returns                  | `/returns`                    | Return and refund policy                          |
| Payment Options          | `/payment-options`            | Available payment methods info                    |
| Cookie Policy            | `/cookies`                    | Cookie usage policy                               |

---

## 10. Payment Flow

### EcoCash (via PayNow)
1. User selects EcoCash at checkout.
2. Backend initiates PayNow transaction with user's EcoCash number.
3. User approves payment on their phone.
4. PayNow webhook confirms payment; order status updates to PAID.

### Bank Transfer
1. User selects Bank Transfer at checkout.
2. Platform displays bank account details.
3. User makes transfer and uploads proof of payment.
4. Admin/seller verifies payment; order status updates to PAID.

### Cash on Delivery
1. User selects Cash on Delivery at checkout.
2. Order is created with PENDING status.
3. Payment is collected upon delivery; order status updates to PAID + DELIVERED.

---

## 11. Notifications

- **Email Notifications:** Order confirmations, status updates, OTP codes (via Nodemailer).
- **Real-time Notifications:** New messages, order updates (via Socket.io).
- **SMS (planned):** Via Africa's Talking integration for order and delivery alerts.

---

## 12. Environment & Deployment

- **Development:** Local PostgreSQL + Prisma migrations, Nodemon for hot reload, self-signed SSL.
- **Production:** PostgreSQL database, ImageKit CDN for images, Nginx reverse proxy (optional), Let's Encrypt SSL.
- **Environment Variables:** Database URL, Clerk keys, ImageKit credentials, PayNow keys, SMTP config, JWT secret.

---

## 13. Testing Strategy

| Type        | Tool       | Scope                                          |
|-------------|------------|-------------------------------------------------|
| Unit        | Jest       | Validation schemas, utility functions, middleware |
| Integration | Supertest  | API endpoint testing                             |
| E2E         | Playwright | Full user flows (browse, purchase, admin)        |
| Security    | Jest       | CSRF, input validation, error handling           |

---

## 14. Success Metrics

- **User Registration Rate:** Number of new user sign-ups per month.
- **Seller Onboarding:** Time from application to verified seller status.
- **Order Completion Rate:** Percentage of orders that reach DELIVERED status.
- **Average Response Time:** Seller response time to buyer messages.
- **Platform Uptime:** Target 99.9% availability.
- **Page Load Time:** Target < 3 seconds for product pages.
