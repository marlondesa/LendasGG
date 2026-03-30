import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { valorantController } from '../controllers'

const router = Router()

const limiter = rateLimit({ windowMs: 60_000, max: 120, message: { error: 'Muitas requisições' } })
router.use(limiter)

router.get('/player/:gameName/:tagLine', valorantController.getPlayer)
router.get('/matches/:matchId/detail', valorantController.getMatchDetail)
router.get('/ranking/:actId', valorantController.getRanking)
router.get('/server', valorantController.getServerStatus)

export default router
