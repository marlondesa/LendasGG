import { Request, Response, NextFunction } from 'express'

export function roles(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowed.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado' }); return
    }
    next()
  }
}
