import { RateLimiterMemory } from 'rate-limiter-flexible'
import { Request, Response, NextFunction } from 'express'

// ─── LIMITADORES ─────────────────────────────────────────────────────────────

// Login: 5 tentativas por IP a cada 15 minutos
const loginLimiterIp = new RateLimiterMemory({
  points: 5,
  duration: 900,
  blockDuration: 900,
})

// Login: 10 tentativas por email a cada 15 minutos (defende conta específica)
const loginLimiterEmail = new RateLimiterMemory({
  points: 10,
  duration: 900,
  blockDuration: 900,
})

// Recuperação de senha: 3 tentativas por IP por hora
const forgotLimiter = new RateLimiterMemory({
  points: 3,
  duration: 3600,
  blockDuration: 3600,
})

// Cadastro: 5 contas por IP por hora
const registerLimiter = new RateLimiterMemory({
  points: 5,
  duration: 3600,
  blockDuration: 3600,
})

// ─── HELPER ──────────────────────────────────────────────────────────────────

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip ?? 'unknown'
  return ip
}

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────

export function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const email = (req.body?.email as string | undefined) ?? ''
  Promise.all([
    loginLimiterIp.consume(clientIp(req)),
    email ? loginLimiterEmail.consume(`login_email_${email}`) : Promise.resolve(),
  ])
    .then(() => next())
    .catch(() => {
      res.status(429).json({ error: 'Muitas tentativas de login. Aguarde 15 minutos.' })
    })
}

export function forgotRateLimit(req: Request, res: Response, next: NextFunction): void {
  forgotLimiter.consume(clientIp(req))
    .then(() => next())
    .catch(() => {
      res.status(429).json({ error: 'Muitas solicitações de recuperação de senha. Aguarde 1 hora.' })
    })
}

export function registerRateLimit(req: Request, res: Response, next: NextFunction): void {
  registerLimiter.consume(clientIp(req))
    .then(() => next())
    .catch(() => {
      res.status(429).json({ error: 'Muitas tentativas de cadastro. Aguarde 1 hora.' })
    })
}
