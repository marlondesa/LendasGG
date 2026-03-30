import { Express } from 'express'
import lolRoutes from './lol'
import tftRoutes from './tft'
import valorantRoutes from './valorant'
import authRoutes from './auth'
import userRoutes from './user'

export function registerRoutes(app: Express): void {
  app.use('/api/lol',      lolRoutes)
  app.use('/api/tft',      tftRoutes)
  app.use('/api/valorant', valorantRoutes)
  app.use('/api/auth',     authRoutes)
  app.use('/api/user',     userRoutes)
}
