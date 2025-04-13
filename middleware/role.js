// middleware/role.js

// Middleware to check if user has required role
module.exports = function(roles) {
  return function(req, res, next) {
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: 'Access denied: insufficient permissions' 
      });
    }
    
    next();
  };
};
