import { Router } from 'express'
import passport from '../config/passport'
import { authMiddleware, validate, loginRateLimit, forgotRateLimit, registerRateLimit } from '../middlewares'
import { authValidator } from '../validators'
import * as authController from '../controllers/auth'

const router = Router()

router.post('/register',        registerRateLimit, validate(authValidator.register),       authController.register)
router.post('/login',           loginRateLimit,    validate(authValidator.login),          authController.login)
router.post('/logout',          authMiddleware,                                             authController.logout)
router.get('/me',               authMiddleware,                                             authController.me)
router.post('/forgot-password', forgotRateLimit,   validate(authValidator.forgotPassword), authController.forgotPassword)
router.post('/reset-password',                     validate(authValidator.resetPassword),  authController.resetPassword)

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env['FRONTEND_URL']}/login?error=oauth_failed`,
  }),
  authController.googleCallback
)

export default router
