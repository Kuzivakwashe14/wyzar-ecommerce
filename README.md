# WyZar E-commerce

A full-stack e-commerce platform built with Next.js and Express, featuring secure authentication, real-time updates, and comprehensive admin tools.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS with Radix UI components
- **Authentication**: Clerk
- **State Management**: React Hook Form with Zod validation
- **Real-time**: Socket.io Client
- **UI Components**: Radix UI, Framer Motion, Lucide Icons

### Backend
- **Framework**: Express 5
- **Database**: Prisma ORM
- **Authentication**: Clerk SDK, JWT
- **Security**: Helmet, CSRF protection, XSS-Clean, Rate Limiting
- **Payment**: PayNow integration
- **Notifications**: Africa's Talking, Nodemailer
- **Testing**: Jest with Supertest

## Project Structure

```
wyzar-ecommerce/
├── frontend/          # Next.js application
├── backend/           # Express API server
│   └── scripts/       # Database utility scripts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Database (PostgreSQL/MySQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wyzar-ecommerce
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment setup**

   Create `.env` files in both `backend/` and `frontend/` directories with the necessary environment variables (database connection, API keys, etc.).

4. **Database setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

### Running the Application

**Development mode:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production mode:**

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm start
```

## Developer Scripts

Database utility scripts are located in `backend/scripts/`:

### List Users
Lists all users from the database:
```bash
node backend/scripts/list_users.js
```

### Make Admin
Sets a user's role to `ADMIN`. Pass an email as an argument:
```bash
node backend/scripts/make_admin.js user@example.com
```

**⚠️ Warning**: These scripts modify the database directly. Do NOT run them against production unless you intend to modify production data.

## Available Scripts

### Backend
- `npm run dev` — Start development server with nodemon
- `npm start` — Start production server
- `npm test` — Run all tests with coverage
- `npm run test:watch` — Run tests in watch mode
- `npm run test:validation` — Run validation tests
- `npm run test:csrf` — Run CSRF protection tests
- `npm run test:security` — Run security tests

### Frontend
- `npm run dev` — Start Next.js development server
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint

## Features

- 🔐 Secure authentication with Clerk
- 🛡️ CSRF protection and security headers
- ⚡ Real-time updates with Socket.io
- 💳 Payment integration
- 📧 Email and SMS notifications
- 🎨 Modern UI with Radix components
- 📱 Responsive design
- 🧪 Comprehensive test coverage
- 🔒 Input validation with Zod
- 🚀 Rate limiting and security best practices

## License

ISC
