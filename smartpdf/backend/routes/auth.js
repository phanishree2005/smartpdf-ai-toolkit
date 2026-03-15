const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, register)

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, login)

router.get('/me', protect, getMe)

router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().isLength({ max: 60 }),
  body('email').optional().isEmail().normalizeEmail(),
], validate, updateProfile)

router.put('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validate, changePassword)

module.exports = router
