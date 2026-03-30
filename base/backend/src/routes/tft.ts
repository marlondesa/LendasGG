import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { tftController } from '../controllers'

const router = Router()

const limiter = rateLimit({ windowMs: 60_000, max: 120, message: { error: 'Muitas requisições' } })
router.use(limiter)

router.get('/player/:gameName/:tagLine', tftController.getPlayer)
router.get('/player/:gameName/:tagLine/live', tftController.getLiveGame)
router.get('/matches/:puuid', tftController.getMatches)
router.get('/matches/:matchId/detail', tftController.getMatchDetail)
router.get('/ranking/apex/:tier', tftController.getRankingApex)
router.get('/server', tftController.getServerStatus)

export default router
