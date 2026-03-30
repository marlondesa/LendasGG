import { Router } from 'express'
import { authMiddleware, validate, avatarUpload, bannerUpload } from '../middlewares'
import { userValidator } from '../validators'
import * as userController from '../controllers/user'

const router = Router()

router.use(authMiddleware)

router.put('/profile',      validate(userValidator.updateProfile),  userController.updateProfile)
router.put('/password',     validate(userValidator.changePassword), userController.changePassword)
router.post('/avatar',      avatarUpload,                          userController.updateAvatar)
router.post('/banner',      bannerUpload,                          userController.updateBanner)
router.post('/riot/init',   validate(userValidator.riotInit),      userController.riotInit)
router.post('/riot/verify', validate(userValidator.riotVerify),    userController.riotVerify)
router.delete('/riot',                                             userController.riotUnlink)

export default router
