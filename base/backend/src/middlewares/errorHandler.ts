import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, { stack: err.stack })

  const riotStatus = err?.response?.status
  // 401/403 da Riot são retornados como 502 para não disparar o interceptor de sessão do frontend
  if (riotStatus === 401) {
    res.status(502).json({ error: 'Chave da API Riot inválida ou expirada' })
    return
  }
  if (riotStatus === 403) {
    res.status(502).json({ error: 'Acesso negado pela API Riot — verifique a chave no .env' })
    return
  }
  if (riotStatus === 404) {
    res.status(404).json({ error: 'Recurso não encontrado' })
    return
  }
  if (riotStatus === 429) {
    res.status(429).json({ error: 'Rate limit da Riot atingido, tente novamente em instantes' })
    return
  }

  res.status(500).json({ error: 'Erro interno do servidor' })
}
