import { z } from 'zod'

const envSchema = z.object({
  PORT:               z.string().default('3000'),
  NODE_ENV:           z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL:       z.string().url(),
  DATABASE_URL:       z.string().url(),
  RIOT_API_KEY:       z.string().min(1),
  JWT_SECRET:         z.string().min(32),
  JWT_EXPIRES_IN:     z.string().default('7d'),
  SESSION_SECRET:     z.string().min(32),
  GOOGLE_CLIENT_ID:   z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL:  z.string().url(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY:    z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  MP_ACCESS_TOKEN:    z.string().min(1),
  RESEND_API_KEY:     z.string().min(1),
  MAIL_FROM:          z.string().email(),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌  Variáveis de ambiente inválidas ou ausentes:')
  for (const [field, issues] of Object.entries(result.error.flatten().fieldErrors)) {
    console.error(`   ${field}: ${(issues as string[]).join(', ')}`)
  }
  process.exit(1)
}

export const env = result.data
