const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { createError } = require('../utils/errors')

const protect = async (req, res, next) => {
  try {
    let token
    const auth = req.headers.authorization

    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1]
    }

    if (!token) {
      return next(createError(401, 'Access denied. No token provided.'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return next(createError(401, 'User no longer exists.'))
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired. Please log in again.'))
    }
    if (err.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token.'))
    }
    next(err)
  }
}

// Optional auth – doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    }
    next()
  } catch {
    next()
  }
}

// Role-based access
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(createError(403, 'Insufficient permissions.'))
  }
  next()
}

// Pro plan required
const requirePro = (req, res, next) => {
  if (req.user?.plan === 'free' && process.env.NODE_ENV === 'production') {
    return next(createError(403, 'This feature requires a Pro plan.'))
  }
  next()
}

module.exports = { protect, optionalAuth, requireRole, requirePro }
