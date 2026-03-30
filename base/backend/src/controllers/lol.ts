import { Request, Response } from 'express'
import * as riot from '../services/riotApi'

// ─────────────────────────────────────────
// 🔐 REGION SEGURA
// ─────────────────────────────────────────
const ALLOWED_REGIONS = new Set([
  'br1','na1','euw1','eun1','kr','jp1','la1','la2'
])

function getRegion(req: Request): string {
  const r = req.query['region']
  if (typeof r === 'string' && ALLOWED_REGIONS.has(r)) return r
  return 'br1'
}

// ─────────────────────────────────────────
// ⚙️ HELPERS
// ─────────────────────────────────────────
function param(req: Request, key: string): string {
  const v = req.params[key]
  return Array.isArray(v) ? v[0] : v
}

function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next)
}

function safe404(p: Promise<any>) {
  return p.catch((e: any) =>
    e?.response?.status === 404 ? null : Promise.reject(e)
  )
}

// ─────────────────────────────────────────
// 🎮 GET PLAYER
// ─────────────────────────────────────────
export const getPlayer = asyncHandler(async (req: Request, res: Response) => {
  const r        = getRegion(req)
  const gameName = param(req, 'gameName')
  const tagLine  = param(req, 'tagLine')

  if (!gameName || !tagLine) {
    return res.status(400).json({ error: 'gameName e tagLine são obrigatórios' })
  }

  const account = await riot.getAccountByRiotId(r, gameName.trim(), tagLine.trim())

  const [summoner, league, mastery, champMap] = await Promise.all([
    safe404(riot.getSummonerByPuuid(r, account.puuid)),
    safe404(riot.getLeagueByPuuid(r, account.puuid)),
    safe404(riot.getTopMastery(r, account.puuid)),
    riot.getChampionMap(),
  ])

  const enrichedMastery = (mastery ?? []).map((m: any) => ({
    ...m,
    championName: champMap[String(m.championId)] ?? null,
  }))

  res.json({ account, summoner, league: league ?? [], mastery: enrichedMastery })
})

// ─────────────────────────────────────────
// 🔴 LIVE GAME
// ─────────────────────────────────────────
export const getLiveGame = asyncHandler(async (req: Request, res: Response) => {
  const r        = getRegion(req)
  const gameName = param(req, 'gameName')
  const tagLine  = param(req, 'tagLine')

  const [account, champMap] = await Promise.all([
    riot.getAccountByRiotId(r, gameName, tagLine),
    riot.getChampionMap(),
  ])

  const game = await riot.getLiveGame(r, account.puuid) as any

  if (game?.participants) {
    // Memo por request: dedup de puuids repetidos dentro desta requisição.
    // O Bottleneck já controla o rate limit global — sem delay artificial.
    const summonerMemo = new Map<string, Promise<any>>()
    const leagueMemo   = new Map<string, Promise<any>>()

    const getSummoner = (puuid: string) => {
      if (!summonerMemo.has(puuid))
        summonerMemo.set(puuid, riot.getSummonerByPuuid(r, puuid).catch(() => null))
      return summonerMemo.get(puuid)!
    }

    const getLeague = (puuid: string) => {
      if (!leagueMemo.has(puuid))
        leagueMemo.set(puuid, riot.getLeagueByPuuid(r, puuid).catch(() => []))
      return leagueMemo.get(puuid)!
    }

    const participants = game.participants as any[]
    const results = await Promise.allSettled(
      participants.map(async (p: any) => {
        const [summoner, league] = await Promise.all([
          getSummoner(p.puuid),
          getLeague(p.puuid),
        ])

        const soloQ = (league as any[])?.find((l: any) => l.queueType === 'RANKED_SOLO_5x5') ?? null
        const [pGameName = null, pTagLine = null] = (p.riotId ?? '').split('#')

        return {
          ...p,
          championName:  champMap[String(p.championId)] ?? null,
          summonerName:  pGameName,
          riotIdGameName: pGameName,
          riotIdTagline: pTagLine,
          summonerLevel: (summoner as any)?.summonerLevel ?? null,
          profileIconId: (summoner as any)?.profileIconId ?? p.profileIconId,
          soloQ,
        }
      })
    )

    game.participants = results.map((result, i) =>
      result.status === 'fulfilled'
        ? result.value
        : { ...participants[i], championName: champMap[String(participants[i].championId)] ?? null }
    )
  }

  if (game?.bannedChampions) {
    game.bannedChampions = game.bannedChampions.map((b: any) => ({
      ...b,
      championName: b.championId > 0 ? champMap[String(b.championId)] ?? null : null,
    }))
  }

  res.json(game)
})

// ─────────────────────────────────────────
// 📊 MATCHES
// ─────────────────────────────────────────
export const getMatches = asyncHandler(async (req: Request, res: Response) => {
  const r     = getRegion(req)
  const puuid = param(req, 'puuid')

  const ids = await riot.getMatchIds(r, puuid)

  // Bottleneck em riotApi.ts controla o rate limit — todas as requisições
  // são enfileiradas com maxConcurrent=5. Delay manual seria latência desperdiçada.
  const results = await Promise.allSettled(ids.map((id: string) => riot.getMatch(r, id)))
  res.json(results.map(r => r.status === 'fulfilled' ? r.value : null))
})

// ─────────────────────────────────────────
// 📄 MATCH DETAIL
// ─────────────────────────────────────────
export const getMatchDetail = asyncHandler(async (req: Request, res: Response) => {
  const r       = getRegion(req)
  const matchId = param(req, 'matchId')

  const [match, timeline] = await Promise.all([
    riot.getMatch(r, matchId),
    riot.getMatchTimeline(r, matchId),
  ])

  res.json({ match, timeline })
})

// ─────────────────────────────────────────
// 🏆 RANKINGS
// ─────────────────────────────────────────
export const getRankingApex = asyncHandler(async (req: Request, res: Response) => {
  const r     = getRegion(req)
  const queue = param(req, 'queue')
  const tier  = param(req, 'tier')

  const data = await riot.getEnrichedRankingApex(r, queue, tier)
  res.json(data)
})

export const getRankingEntries = asyncHandler(async (req: Request, res: Response) => {
  const r        = getRegion(req)
  const queue    = param(req, 'queue')
  const tier     = param(req, 'tier')
  const division = param(req, 'division')

  const data = await riot.getEnrichedRankingEntries(r, queue, tier.toUpperCase(), division.toUpperCase())
  res.json(data)
})

// ─────────────────────────────────────────
// 🌐 STATUS
// ─────────────────────────────────────────
export const getServerStatus = asyncHandler(async (req: Request, res: Response) => {
  const r = getRegion(req)

  const [status, rotations] = await Promise.all([
    riot.getLolStatus(r),
    riot.getChampionRotations(r),
  ])

  res.json({ status, rotations })
})

// ─────────────────────────────────────────
// 🧪 DEBUG
// ─────────────────────────────────────────
export const debugRawChallenger = asyncHandler(async (req: Request, res: Response) => {
  const r    = getRegion(req)
  const data = await riot.getChallengerLeague(r, 'RANKED_SOLO_5x5') as any
  const first = data?.entries?.[0]
  res.json({ fields: Object.keys(first ?? {}), sample: first })
})

// ─────────────────────────────────────────
// ⚔️ CLASH
// ─────────────────────────────────────────
export const getClashTournaments = asyncHandler(async (req: Request, res: Response) => {
  const r = getRegion(req)
  const data = await riot.getClashTournaments(r)
  res.json(data)
})

export const getClash = asyncHandler(async (req: Request, res: Response) => {
  const r        = getRegion(req)
  const gameName = param(req, 'gameName')
  const tagLine  = param(req, 'tagLine')

  const account = await riot.getAccountByRiotId(r, gameName, tagLine)

  const [players, tournaments] = await Promise.all([
    riot.getClashByPuuid(r, account.puuid),
    riot.getClashTournaments(r),
  ])

  const teams = await Promise.all(
    (players as { teamId: string }[]).map(p => riot.getClashTeam(r, p.teamId))
  )

  res.json({ players, teams, tournaments })
})
