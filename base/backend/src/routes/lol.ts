import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { lolController } from '../controllers'

const router = Router()

const limiter = rateLimit({ windowMs: 60_000, max: 120, message: { error: 'Muitas requisições' } })
router.use(limiter)

router.get('/player/:gameName/:tagLine', lolController.getPlayer)
router.get('/player/:gameName/:tagLine/live', lolController.getLiveGame)
router.get('/matches/:puuid', lolController.getMatches)
router.get('/matches/:matchId/detail', lolController.getMatchDetail)
router.get('/ranking/apex/:queue/:tier', lolController.getRankingApex)
router.get('/ranking/:queue/:tier/:division', lolController.getRankingEntries)
router.get('/server', lolController.getServerStatus)
router.get('/clash/tournaments', lolController.getClashTournaments)
router.get('/clash/:gameName/:tagLine', lolController.getClash)

export default router
