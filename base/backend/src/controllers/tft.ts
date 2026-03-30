import { Request, Response, NextFunction } from 'express'
import * as riot from '../services/riotApi'

function region(req: Request): string {
  return (req.query['region'] as string) ?? 'br1'
}

export async function getPlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }
    const account = await riot.getAccountByRiotId(r, gameName, tagLine)
    const [summoner, league] = await Promise.all([
      riot.getTftSummonerByPuuid(r, account.puuid),
      riot.getTftLeagueByPuuid(r, account.puuid),
    ])
    res.json({ account, summoner, league })
  } catch (err) { next(err) }
}

export async function getLiveGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const { gameName, tagLine } = req.params as { gameName: string; tagLine: string }
    const account = await riot.getAccountByRiotId(r, gameName, tagLine)
    const game = await riot.getTftLiveGame(r, account.puuid)
    res.json(game)
  } catch (err) { next(err) }
}

export async function getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const { puuid } = req.params as { puuid: string }
    const ids = await riot.getTftMatchIds(r, puuid) as string[]
    const matches = await Promise.all(ids.map(id => riot.getTftMatch(r, id)))
    res.json(matches)
  } catch (err) { next(err) }
}

export async function getMatchDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const { matchId } = req.params as { matchId: string }
    const match = await riot.getTftMatch(r, matchId)
    res.json(match)
  } catch (err) { next(err) }
}

export async function getRankingApex(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const { tier } = req.params as { tier: string }
    const data = await riot.getEnrichedTftRankingApex(r, tier)
    res.json(data)
  } catch (err) { next(err) }
}

export async function getServerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const status = await riot.getTftStatus(r)
    res.json(status)
  } catch (err) { next(err) }
}
