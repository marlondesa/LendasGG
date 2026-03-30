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
    const matchList = await riot.getValMatchList(r, account.puuid)
    res.json({ account, matchList })
  } catch (err) { next(err) }
}

export async function getMatchDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const { matchId } = req.params as { matchId: string }
    const match = await riot.getValMatch(r, matchId)
    res.json(match)
  } catch (err) { next(err) }
}

export async function getRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const { actId } = req.params as { actId: string }
    const data = await riot.getValRanking(r, actId)
    res.json(data)
  } catch (err) { next(err) }
}

export async function getServerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const r = region(req)
    const [status, content] = await Promise.all([
      riot.getValStatus(r),
      riot.getValContent(r),
    ])
    res.json({ status, content })
  } catch (err) { next(err) }
}
