import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import prisma from './database'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
      callbackURL: process.env['GOOGLE_CALLBACK_URL']!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id
        const email = profile.emails?.[0]?.value
        const avatarUrl = profile.photos?.[0]?.value ?? null

        if (!email) return done(new Error('Email não fornecido pelo Google'), false as any)

        // 1. Já tem conta vinculada ao googleId → retorna
        let user = await prisma.user.findUnique({ where: { googleId } })
        if (user) return done(null, user)

        // 2. Tem conta com mesmo email → vincula googleId à conta existente
        user = await prisma.user.findUnique({ where: { email } })
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatarUrl: user.avatarUrl ?? avatarUrl },
          })
          return done(null, user)
        }

        // 3. Conta nova → cria com authProvider GOOGLE
        const username = `${email.split('@')[0]}_${googleId.slice(0, 6)}`
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            avatarUrl,
            username,
            emailVerified: true,
            authProvider: 'GOOGLE',
            password: null,
          },
        })
        return done(null, user)
      } catch (err) {
        return done(err as Error, false as any)
      }
    }
  )
)

export default passport
