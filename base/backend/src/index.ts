import 'dotenv/config'
import './config/env' // valida variáveis de ambiente — falha rápido se algo estiver ausente
import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import hpp from 'hpp'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import passport from './config/passport'

import { registerRoutes } from './routes'
import { errorHandler } from './middlewares'
import logger from './config/logger'

const app = express()

app.set('trust proxy', 1) // Corrige req.ip atrás de nginx/proxy
app.set('etag', false)   // Desabilita 304 — garante resposta completa sempre

app.use(helmet())
app.use(compression())
app.use(cors({ origin: process.env['FRONTEND_URL'], credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(passport.initialize())
app.use(hpp())
app.use(rateLimit({ windowMs: 15 * 60_000, max: 500, message: { error: 'Muitas requisições' } }))
app.use(slowDown({ windowMs: 15 * 60_000, delayAfter: 200, delayMs: () => 500 }))

registerRoutes(app)
app.use(errorHandler)

const PORT = process.env['PORT'] ?? 3000
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})
