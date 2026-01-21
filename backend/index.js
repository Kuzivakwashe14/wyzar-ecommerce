const express = require('express');
const prisma = require('./config/prisma');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const socketIO = require('socket.io');
require('dotenv').config(); // Load environment variables

// ✨ Validate environment variables on startup (if envValidator exists)
// const { validateOrExit } = require('./utils/envValidator');
// validateOrExit(); // Will exit if validation fails

// Security configuration
const {
  helmetConfig,
  getCorsConfig,
  generalLimiter,
  mongoSanitizeConfig,
  hppConfig,
  securityHeaders
} = require('./config/security');

// ✨ NEW: Error handling middleware
const {
  errorHandler,
  notFoundHandler
} = require('./middleware/errorMiddleware');

// ✨ NEW: Input validation and sanitization
const { sanitizeRequestBody, sanitizeQueryParams } = require('./utils/security/inputValidation');

// ✨ NEW: CSRF protection
const {
  csrfProtection,
  attachCsrfToken,
  csrfErrorHandler
} = require('./middleware/csrfProtection');

const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// --- Security Middleware (Applied First) ---
app.use(helmetConfig); // Security headers
app.use(securityHeaders); // Additional custom security headers
app.use(getCorsConfig()); // CORS with proper configuration
app.use(generalLimiter); // Rate limiting
// app.use(mongoSanitizeConfig); // TODO: Temporarily disabled - incompatible with Express 5
app.use(hppConfig); // Prevent HTTP Parameter Pollution

// --- Body Parsing Middleware ---
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (with size limit)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies

// ✨ NEW: Apply sanitization to all routes
app.use(sanitizeRequestBody);
app.use(sanitizeQueryParams);

// ✨ NEW: Apply CSRF protection to state-changing routes
// Temporarily disabled to fix 403 errors - TODO: Implement proper CSRF token flow
// app.use([
//   '/api/orders',
//   '/api/products',
//   '/api/reviews'
// ], csrfProtection, attachCsrfToken);

// --- Static Files ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
// PostgreSQL connection is handled by Prisma Client
// Prisma connects automatically on first query - no need for explicit connection
// Test connection on startup (optional - comment out if causing issues)
prisma.$connect()
  .then(() => {
    console.log("Successfully connected to PostgreSQL database!");
  })
  .catch((error) => {
    console.error("Error connecting to PostgreSQL:", error.message);
    // Don't exit - Prisma will retry on first query
  });

// --- Basic Test Route ---
app.get('/', (req, res) => {
  res.send('Welcome to the WyZar Backend API!');
});

// ✨ NEW: CSRF token endpoint for frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken()
  });
});

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/products', require('./routes/product'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/search', require('./routes/search'));
app.use('/api/messages', require('./routes/messages'));

// Admin routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/sellers', require('./routes/adminSellers'));
app.use('/api/admin/products', require('./routes/adminProducts'));
app.use('/api/admin/orders', require('./routes/adminOrders'));
app.use('/api/admin/access-control', require('./routes/adminAccessControl'));

// ✨ NEW: 404 Handler (must be after all routes)
app.use(notFoundHandler);

// ✨ NEW: CSRF Error Handler (before general error handler)
app.use(csrfErrorHandler);

// ✨ NEW: Global Error Handler (must be last)
app.use(errorHandler);

// --- Start the Server ---
let server;
let io;

if (USE_HTTPS) {
  // Load SSL certificates
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
  };

  // Create HTTPS server
  server = https.createServer(sslOptions, app);

  server.listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS Server running on https://localhost:${HTTPS_PORT}`);
    console.log(`🔐 SSL/TLS encryption enabled`);
  });

  // Optional: Redirect HTTP to HTTPS
  if (process.env.REDIRECT_HTTP === 'true') {
    const httpApp = express();
    httpApp.use('*', (req, res) => {
      res.redirect(`https://${req.hostname}:${HTTPS_PORT}${req.url}`);
    });
    httpApp.listen(PORT, () => {
      console.log(`📡 HTTP Server (redirect) running on http://localhost:${PORT}`);
    });
  }
} else {
  // Regular HTTP server (for development without SSL)
  server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`📡 HTTP Server running on http://localhost:${PORT}`);
    console.log(`⚠️  Warning: Running without SSL/TLS encryption`);
    console.log(`   Set USE_HTTPS=true in .env to enable HTTPS`);
  });
}

// --- Socket.IO Setup ---
io = socketIO(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', "https://wyzar-ecommerce.vercel.app"],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins with their user ID
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  // User sends a message
  socket.on('send_message', (data) => {
    const receiverSocketId = connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_message', data);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const receiverSocketId = connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        conversationId: data.conversationId,
        userId: socket.userId
      });
    }
  });

  // Stop typing indicator
  socket.on('stop_typing', (data) => {
    const receiverSocketId = connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', {
        conversationId: data.conversationId,
        userId: socket.userId
      });
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// Make io and connectedUsers accessible in routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

console.log('💬 Socket.IO initialized for real-time messaging');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});