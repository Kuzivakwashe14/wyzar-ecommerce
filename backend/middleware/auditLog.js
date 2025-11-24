// backend/middleware/auditLog.js
const fs = require('fs');
const path = require('path');

/**
 * Audit Logging Middleware for PCI Compliance
 * Logs security-relevant events for compliance and security monitoring
 */

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log security events to file and console
 */
const logSecurityEvent = (event) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  // Log to file
  const logFile = path.join(logsDir, `security-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logLine);

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', logEntry);
  }
};

/**
 * Middleware to log all authentication attempts
 */
const logAuthAttempt = (req, res, next) => {
  // Store original res.json to intercept response
  const originalJson = res.json;

  res.json = function(data) {
    const success = data.success !== false && !data.error;

    logSecurityEvent({
      event: 'AUTH_ATTEMPT',
      success,
      identifier: req.body.email || req.body.phone || 'unknown',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Log successful authentication
 */
const logAuthSuccess = (userId, email, req) => {
  logSecurityEvent({
    event: 'AUTH_SUCCESS',
    userId,
    email,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

/**
 * Log failed authentication
 */
const logAuthFailure = (identifier, reason, req) => {
  logSecurityEvent({
    event: 'AUTH_FAILURE',
    identifier,
    reason,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
};

/**
 * Log admin actions
 */
const logAdminAction = (req, res, next) => {
  // Only log if user is admin
  if (req.user && req.user.role === 'admin') {
    logSecurityEvent({
      event: 'ADMIN_ACTION',
      userId: req.user.id,
      email: req.user.email,
      action: `${req.method} ${req.path}`,
      ip: req.ip || req.connection.remoteAddress,
      body: sanitizeLogData(req.body),
      params: req.params
    });
  }
  next();
};

/**
 * Log user account changes
 */
const logAccountChange = (action, userId, changes, req) => {
  logSecurityEvent({
    event: 'ACCOUNT_CHANGE',
    action, // 'CREATE', 'UPDATE', 'DELETE', 'PASSWORD_CHANGE', etc.
    userId,
    changes: sanitizeLogData(changes),
    performedBy: req.user ? req.user.id : 'system',
    ip: req.ip || req.connection.remoteAddress
  });
};

/**
 * Log authorization failures
 */
const logAuthorizationFailure = (req, requiredRole) => {
  logSecurityEvent({
    event: 'AUTHORIZATION_FAILURE',
    userId: req.user ? req.user.id : 'anonymous',
    requiredRole,
    userRole: req.user ? req.user.role : 'none',
    path: req.path,
    ip: req.ip || req.connection.remoteAddress
  });
};

/**
 * Log rate limit violations
 */
const logRateLimitViolation = (req) => {
  logSecurityEvent({
    event: 'RATE_LIMIT_EXCEEDED',
    ip: req.ip || req.connection.remoteAddress,
    path: req.path,
    userAgent: req.get('user-agent')
  });
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = (type, details, req) => {
  logSecurityEvent({
    event: 'SUSPICIOUS_ACTIVITY',
    type, // 'SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT', etc.
    details,
    ip: req.ip || req.connection.remoteAddress,
    path: req.path,
    userAgent: req.get('user-agent'),
    body: sanitizeLogData(req.body)
  });
};

/**
 * Sanitize sensitive data before logging
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'cvv', 'cardNumber', 'pin'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Express middleware to log all requests to protected routes
 */
const logProtectedRouteAccess = (req, res, next) => {
  if (req.user) {
    logSecurityEvent({
      event: 'PROTECTED_ROUTE_ACCESS',
      userId: req.user.id,
      path: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress
    });
  }
  next();
};

/**
 * Get audit logs (admin only)
 */
const getAuditLogs = (startDate, endDate, eventType) => {
  // This is a simple implementation - in production, use a proper log aggregation service
  const logs = [];
  const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));

  files.forEach(file => {
    const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);

        // Filter by date range if specified
        if (startDate && new Date(entry.timestamp) < new Date(startDate)) return;
        if (endDate && new Date(entry.timestamp) > new Date(endDate)) return;

        // Filter by event type if specified
        if (eventType && entry.event !== eventType) return;

        logs.push(entry);
      } catch (e) {
        // Skip malformed lines
      }
    });
  });

  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

module.exports = {
  logAuthAttempt,
  logAuthSuccess,
  logAuthFailure,
  logAdminAction,
  logAccountChange,
  logAuthorizationFailure,
  logRateLimitViolation,
  logSuspiciousActivity,
  logProtectedRouteAccess,
  getAuditLogs
};
