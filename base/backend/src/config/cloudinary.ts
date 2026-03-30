import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME']!,
  api_key: process.env['CLOUDINARY_API_KEY']!,
  api_secret: process.env['CLOUDINARY_API_SECRET']!,
})

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lendas/avatars',
    format: 'webp',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  } as any,
})

const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lendas/banners',
    format: 'webp',
    transformation: [{ width: 1200, height: 300, crop: 'fill' }],
  } as any,
})

function imageFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Apenas imagens são permitidas'))
  }
  cb(null, true)
}

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
})

export const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
})

export default cloudinary
