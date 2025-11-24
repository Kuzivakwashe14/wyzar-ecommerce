const express = require('express');
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Load environment variables

// Security configuration
const {
  helmetConfig,
  getCorsConfig,
  generalLimiter,
  mongoSanitizeConfig,
  hppConfig,
  securityHeaders
} = require('./config/security');

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

// --- Static Files ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB Compass!");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

// --- Basic Test Route ---
app.get('/', (req, res) => {
  res.send('Welcome to the WyZar Backend API!');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/products', require('./routes/product'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/search', require('./routes/search'));

// Admin routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/sellers', require('./routes/adminSellers'));
app.use('/api/admin/products', require('./routes/adminProducts'));
app.use('/api/admin/orders', require('./routes/adminOrders'));
app.use('/api/admin/access-control', require('./routes/adminAccessControl'));

// --- Start the Server ---
if (USE_HTTPS) {
  // Load SSL certificates
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
  };

  // Create HTTPS server
  const httpsServer = https.createServer(sslOptions, app);

  httpsServer.listen(HTTPS_PORT, () => {
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
  app.listen(PORT, () => {
    console.log(`📡 HTTP Server running on http://localhost:${PORT}`);
    console.log(`⚠️  Warning: Running without SSL/TLS encryption`);
    console.log(`   Set USE_HTTPS=true in .env to enable HTTPS`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});