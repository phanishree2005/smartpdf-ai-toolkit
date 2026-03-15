const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { asyncHandler, createError } = require('../utils/errors')

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  })
}

// POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body

  const existing = await User.findOne({ email })
  if (existing) return next(createError(409, 'Email already registered'))

  const user = await User.create({ name, email, password })
  sendTokenResponse(user, 201, res)
})

// POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return next(createError(401, 'Invalid email or password'))
  }

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  sendTokenResponse(user, 200, res)
})

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  res.json({ success: true, user: user.toPublicJSON() })
})

// PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  const updates = {}
  if (name) updates.name = name
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: req.user.id } })
    if (existing) throw createError(409, 'Email already in use')
    updates.email = email
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true, runValidators: true,
  })
  res.json({ success: true, user: user.toPublicJSON() })
})

// PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user.id).select('+password')

  if (!(await user.comparePassword(currentPassword))) {
    return next(createError(401, 'Current password is incorrect'))
  }

  user.password = newPassword
  await user.save()
  sendTokenResponse(user, 200, res)
})
