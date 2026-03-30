import { Request, Response, NextFunction } from 'express'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { randomBytes, createHash } from 'crypto'
import prisma from '../config/database'
import { sendPasswordReset } from '../services/email'

// ─── BLOCKLIST DE TOKENS (logout seguro) ─────────────────────────────────────
// In-memory: protege na mesma instância. Para multi-instância, usar Redis.
const tokenBlocklist = new Set<string>()
export function blockToken(jti: string) { tokenBlocklist.add(jti) }
export function isTokenBlocked(jti: string) { return tokenBlocklist.has(jti) }

// SHA-256 do token antes de salvar no banco
function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex')
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const SAFE_SELECT = {
  id: true, email: true, username: true, avatarUrl: true, bannerUrl: true,
  role: true, authProvider: true, emailVerified: true,
  twitterUrl: true, discordTag: true, twitchUrl: true, youtubeUrl: true,
  riotPuuid: true, riotGameName: true, riotTagLine: true,
  riotRegion: true, riotVerified: true,
  createdAt: true,
}

function signToken(user: { id: string; role: string; email: string }) {
  const jti = randomBytes(16).toString('hex') // ID único por token — usado na blocklist
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, jti },
    process.env['JWT_SECRET']!,
    { expiresIn: (process.env['JWT_EXPIRES_IN'] ?? '7d') as any }
  )
}

// POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, username } = req.body

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (exists) {
      res.status(409).json({ error: 'Email ou username já cadastrado' })
      return
    }

    const hash = await argon2.hash(password)
    const user = await prisma.user.create({
      data: { email, password: hash, username },
      select: SAFE_SELECT,
    })

    const token = signToken(user as any)
    res.cookie('token', token, COOKIE_OPTS)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const valid = await argon2.verify(user.password, password)
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const token = signToken(user)
    res.cookie('token', token, COOKIE_OPTS)

    const { password: _p, googleId: _g, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.token as string | undefined
  if (raw) {
    try {
      const decoded = jwt.decode(raw) as { jti?: string } | null
      if (decoded?.jti) blockToken(decoded.jti)
    } catch { /* token mal-formado — ignora */ }
  }
  res.clearCookie('token')
  res.json({ message: 'Logout realizado' })
}

// GET /api/auth/google/callback
export async function googleCallback(req: Request, res: Response) {
  const user = req.user as any
  const token = signToken(user)
  res.cookie('token', token, COOKIE_OPTS)
  res.redirect(`${process.env['FRONTEND_URL']}/`) // era /dashboard (rota inexistente)
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body

    const user = await prisma.user.findUnique({ where: { email } })

    // Sempre retorna sucesso — nunca revelar se o email existe ou não
    if (!user || !user.password) {
      res.json({ message: 'Se o email existir, você receberá um link em breve.' })
      return
    }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)       // salva o hash no banco
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExpiresAt: expiresAt },
    })

    // Envia o token original (não o hash) no email
    await sendPasswordReset(user.email, user.username, rawToken)

    res.json({ message: 'Se o email existir, você receberá um link em breve.' })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body

    // Busca pelo hash — nunca pelo token puro
    const tokenHash = hashToken(token)
    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    })

    if (!user) {
      res.status(400).json({ error: 'Link inválido ou expirado.' })
      return
    }

    const hash = await argon2.hash(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    })

    res.json({ message: 'Senha redefinida com sucesso.' })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: SAFE_SELECT,
    })
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return }
    res.json({ user })
  } catch (err) {
    next(err)
  }
}
