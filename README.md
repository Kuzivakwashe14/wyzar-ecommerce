# WyZar E-commerce

Full-stack marketplace platform with seller onboarding, admin moderation tools, real-time messaging, payments, and secure auth.

## Stack

### Frontend
- Next.js 16 (App Router) + React 19
- TypeScript + Tailwind CSS + Radix UI
- Clerk authentication
- Axios + React Hook Form + Zod
- Socket.IO client for real-time features

### Backend
- Express 5 + Prisma ORM
- PostgreSQL database
- Clerk/JWT auth middleware
- File uploads with Multer (product and verification docs)
- PayNow payment integration
- Jest + Supertest tests

## Repository Layout

```text
wyzar-ecommerce/
├── frontend/                  # Next.js app
├── backend/                   # Express API + Prisma
├── testsprite_tests/          # API scenario tests
├── list_users.js              # Root utility script
├── make_admin.js              # Root utility script
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL

### 1) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure environment variables

Create and fill:
- `backend/.env`
- `frontend/.env.local`

Minimum required values typically include:
- database connection (`DATABASE_URL`)
- Clerk keys/secrets
- frontend/backend base URLs
- payment provider settings

### 3) Prepare database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4) Run locally

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Frontend default: `http://localhost:3000`  
Backend default: `http://localhost:5000`

## Scripts

### Backend (`backend/package.json`)
- `npm run dev` - start API with nodemon
- `npm start` - start API in production mode
- `npm test` - run all tests with coverage
- `npm run test:watch` - run tests in watch mode
- `npm run test:validation` - validation tests
- `npm run test:csrf` - CSRF tests
- `npm run test:error` - error middleware tests
- `npm run test:security` - security-focused tests

### Frontend (`frontend/package.json`)
- `npm run dev` - start Next.js dev server
- `npm run build` - build production bundle
- `npm start` - run production server
- `npm run lint` - run ESLint

## Utility Scripts

Useful admin/dev scripts exist in both places:

- Root:
  - `node list_users.js`
  - `node make_admin.js <email>`
- Backend scripts folder (`backend/scripts/`), for example:
  - `node backend/scripts/list_users.js`
  - `node backend/scripts/make_admin.js <email>`

Use with care: these scripts can change roles/data directly.

## Key Product Flows

- Seller application and verification document upload
- Admin seller moderation (verify, suspend, delete constraints)
- Seller self-service profile updates from dashboard settings
- Product management and bulk CSV upload
- Checkout and payment flow (including proof-of-payment flows)
- Real-time buyer/seller messaging

## Notes

- Seller profile completeness fields are editable from seller dashboard settings and surface in admin seller detail views.
- Verification document viewing depends on stored file path/URL validity and backend file availability.

## License

ISC
