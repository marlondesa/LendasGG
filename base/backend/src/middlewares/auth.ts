import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { isTokenBlocked } from '../controllers/auth'

// Estende Express.User (usado pelo Passport) com os campos do JWT
declare global {
  namespace Express {
    interface User {
      id: string
      role: string
      email: string
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined
  if (!token) { res.status(401).json({ error: 'Não autenticado' }); return }
  try {
    const payload = jwt.verify(token, process.env['JWT_SECRET']!) as Express.User & { jti?: string }

    // Rejeita tokens invalidados pelo logout
    if (payload.jti && isTokenBlocked(payload.jti)) {
      res.status(401).json({ error: 'Sessão encerrada' })
      return
    }

    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}
