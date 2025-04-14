// middleware/rateLimiter.js
/**
 * Basic rate limiting middleware
 * Limits the number of requests a user can make in a given time period
 */
const rateLimit = function(options = {}) {
  // Default options
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later'
  };

  // Merge provided options with defaults
  const opts = { ...defaultOptions, ...options };
  
  // Simple in-memory store for rate limiting
  const requestCounts = {};
  
  // Return middleware function
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    // Initialize or reset expired entries
    if (!requestCounts[ip] || requestCounts[ip].resetTime < now) {
      requestCounts[ip] = {
        count: 1,
        resetTime: now + opts.windowMs
      };
      return next();
    }
    
    // Increment request count
    requestCounts[ip].count++;
    
    // Check if over limit
    if (requestCounts[ip].count > opts.max) {
      return res.status(429).json({ 
        error: 'Too Many Requests',
        message: opts.message 
      });
    }
    
    next();
  };
};

module.exports = rateLimit;
