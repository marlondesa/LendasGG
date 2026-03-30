import { uploadAvatar, uploadBanner } from '../config/cloudinary'

export const avatarUpload = uploadAvatar.single('avatar')
export const bannerUpload = uploadBanner.single('banner')
