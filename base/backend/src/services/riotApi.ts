import axios, { AxiosInstance } from 'axios'
import NodeCache from 'node-cache'
import Bottleneck from 'bottleneck'

// ─────────────────────────────────────────────────────────────
// 🔐 ENV VALIDATION
// ─────────────────────────────────────────────────────────────
const API_KEY = process.env.RIOT_API_KEY
if (!API_KEY) {
  throw new Error('RIOT_API_KEY não definida')
}

// ─────────────────────────────────────────────────────────────
// ⚙️ CONFIG
// ─────────────────────────────────────────────────────────────
const cache = new NodeCache()
const pending = new Map<string, Promise<any>>()

const PROFILE_TTL  = 300
const MATCH_TTL    = 60
const ENRICHED_TTL = 3600
const MAX_PLAYERS  = 50

// ─────────────────────────────────────────────────────────────
// 🚦 RATE LIMITERS (por grupo de endpoint — dev key)
// ─────────────────────────────────────────────────────────────

// App rate limit global: 20 req/s e 100 req/2min
// Todas as chamadas passam por aqui via .chain()
const globalLimiter = new Bottleneck({
  maxConcurrent: 10,
  minTime: 55,               // ~18 req/s — margem segura abaixo de 20/s
  reservoir: 98,             // margem segura abaixo de 100/2min
  reservoirRefreshAmount: 98,
  reservoirRefreshInterval: 120_000,
})

// Endpoints restritivos: challenger/grandmaster/master/rotations
// Limite: 30/10s e 500/10min
// 30/10s → burst de até 28 a cada 10s
// 500/10min → minTime de 1200ms para sustentado (sobreposto ao globalLimiter que já limita mais)
const apexLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 350,              // ~2.8 req/s — seguro abaixo de 3/s (30/10s)
  reservoir: 28,             // margem segura abaixo de 30/10s
  reservoirRefreshAmount: 28,
  reservoirRefreshInterval: 10_000,
})
apexLimiter.chain(globalLimiter)

// Clash tournaments: limite crítico de 10/min
const clashTournamentLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 6100,             // ~9.8 req/min — seguro abaixo de 10/min
})
clashTournamentLimiter.chain(globalLimiter)

// ─────────────────────────────────────────────────────────────
// 🌍 REGIÕES
// ─────────────────────────────────────────────────────────────
const REGION_TO_ROUTING: Record<string, string> = {
  br1: 'americas', na1: 'americas', la1: 'americas', la2: 'americas',
  euw1: 'europe',  eun1: 'europe',  tr1: 'europe',   ru: 'europe',   me1: 'europe',
  kr: 'asia',      jp1: 'asia',
  oc1: 'sea',      sg2: 'sea',      tw2: 'sea',       vn2: 'sea',
}

const VAL_REGION_MAP: Record<string, string> = {
  br1: 'br',  na1: 'na',    euw1: 'eu', eun1: 'eu', kr: 'ap', jp1: 'ap',
  oc1: 'ap',  sg2: 'ap',    tw2: 'ap',  vn2: 'ap',  tr1: 'eu', ru: 'eu',
  la1: 'latam', la2: 'latam', me1: 'eu',
}

// ─────────────────────────────────────────────────────────────
// 🔁 AXIOS CLIENT CACHE
// ─────────────────────────────────────────────────────────────
const clients = new Map<string, AxiosInstance>()

function getClient(type: 'platform' | 'regional' | 'val', region: string): AxiosInstance {
  const key = `${type}:${region}`
  if (clients.has(key)) return clients.get(key)!

  let baseURL = ''
  if (type === 'platform') baseURL = `https://${region}.api.riotgames.com`
  if (type === 'regional') baseURL = `https://${REGION_TO_ROUTING[region] ?? 'americas'}.api.riotgames.com`
  if (type === 'val')      baseURL = `https://${VAL_REGION_MAP[region] ?? 'br'}.api.riotgames.com`

  const instance = axios.create({
    baseURL,
    timeout: 5000,
    headers: { 'X-Riot-Token': API_KEY },
  })

  clients.set(key, instance)
  return instance
}

// ─────────────────────────────────────────────────────────────
// 🛠️ HELPERS
// ─────────────────────────────────────────────────────────────
function safe(value: string) {
  return encodeURIComponent(value)
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─────────────────────────────────────────────────────────────
// 🔁 REQUEST WRAPPER
// ─────────────────────────────────────────────────────────────
async function riotFetch<T>(fn: () => Promise<T>, limiter = globalLimiter, retries = 3): Promise<T> {
  try {
    return await limiter.schedule(fn)
  } catch (err: any) {
    if (err?.response?.status === 429 && retries > 0) {
      const retryAfter = parseInt(err.response.headers?.['retry-after'] ?? '2', 10)
      await delay(retryAfter * 1000)
      return riotFetch(fn, limiter, retries - 1)
    }
    throw err
  }
}


// ─────────────────────────────────────────────────────────────
// ⚡ CACHE SEM RACE CONDITION
// ─────────────────────────────────────────────────────────────
async function cached<T>(key: string, ttl: number, fn: () => Promise<T>, limiter = globalLimiter): Promise<T> {
  const hit = cache.get<T>(key)
  if (hit !== undefined) return hit

  if (pending.has(key)) return pending.get(key)!

  const promise = riotFetch(fn, limiter)
  pending.set(key, promise)

  try {
    const data = await promise
    cache.set(key, data, ttl)
    return data
  } finally {
    pending.delete(key)
  }
}

// ─────────────────────────────────────────────────────────────
// 📦 TIPAGEM BASE
// ─────────────────────────────────────────────────────────────
interface LeagueEntry {
  puuid?: string
  summonerId?: string
  leaguePoints: number
  summonerName?: string
  gameName?: string | null
  tagLine?: string | null
  profileIconId?: number
}

// ─────────────────────────────────────────────────────────────
// 🔑 CONTA
// ─────────────────────────────────────────────────────────────
export async function getAccountByRiotId(region: string, gameName: string, tagLine: string) {
  return cached(
    `account:${region}:${gameName}:${tagLine}`,
    PROFILE_TTL,
    () => getClient('regional', region).get(`/riot/account/v1/accounts/by-riot-id/${safe(gameName)}/${safe(tagLine)}`).then(r => r.data)
  )
}

export async function getAccountByPuuid(region: string, puuid: string) {
  return cached(
    `accountPuuid:${region}:${puuid}`,
    PROFILE_TTL,
    () => getClient('regional', region).get(`/riot/account/v1/accounts/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

// ─────────────────────────────────────────────────────────────
// 🎮 LOL — SUMMONER
// ─────────────────────────────────────────────────────────────
export async function getSummonerByPuuid(region: string, puuid: string, skipCache = false) {
  const key = `summoner:${region}:${puuid}`
  if (skipCache) cache.del(key)
  return cached(
    key,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/summoner/v4/summoners/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

export async function getSummonerById(region: string, summonerId: string) {
  return cached(
    `summonerById:${region}:${summonerId}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/summoner/v4/summoners/${safe(summonerId)}`).then(r => r.data)
  )
}

// ─────────────────────────────────────────────────────────────
// 🎮 LOL — LEAGUE
// ─────────────────────────────────────────────────────────────
export async function getLeagueByPuuid(region: string, puuid: string) {
  return cached(
    `league:${region}:${puuid}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/league/v4/entries/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

export async function getTopMastery(region: string, puuid: string) {
  return cached(
    `mastery:${region}:${puuid}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/champion-mastery/v4/champion-masteries/by-puuid/${safe(puuid)}/top`).then(r => r.data)
  )
}

// ─────────────────────────────────────────────────────────────
// 🎮 LOL — MATCHES
// ─────────────────────────────────────────────────────────────
export async function getMatchIds(region: string, puuid: string, count = 20) {
  return cached(
    `matchIds:${region}:${puuid}:${count}`,
    MATCH_TTL,
    () => getClient('regional', region).get(`/lol/match/v5/matches/by-puuid/${safe(puuid)}/ids?count=${count}`).then(r => r.data)
  )
}

export async function getMatch(region: string, matchId: string) {
  return cached(
    `match:${region}:${matchId}`,
    MATCH_TTL,
    () => getClient('regional', region).get(`/lol/match/v5/matches/${safe(matchId)}`).then(r => r.data)
  )
}

export async function getMatchTimeline(region: string, matchId: string) {
  return cached(
    `timeline:${region}:${matchId}`,
    MATCH_TTL,
    () => getClient('regional', region).get(`/lol/match/v5/matches/${safe(matchId)}/timeline`).then(r => r.data)
  )
}

export async function getLiveGame(region: string, puuid: string) {
  return riotFetch(() =>
    getClient('platform', region).get(`/lol/spectator/v5/active-games/by-summoner/${safe(puuid)}`).then(r => r.data)
  )
}

// ─────────────────────────────────────────────────────────────
// 🏆 LOL — RANKING APEX (Challenger / Grandmaster / Master)
// ─────────────────────────────────────────────────────────────
export async function getChallengerLeague(region: string, queue: string) {
  return cached(
    `challenger:${region}:${queue}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/league/v4/challengerleagues/by-queue/${queue}`).then(r => r.data),
    apexLimiter
  )
}

export async function getGrandmasterLeague(region: string, queue: string) {
  return cached(
    `grandmaster:${region}:${queue}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/league/v4/grandmasterleagues/by-queue/${queue}`).then(r => r.data),
    apexLimiter
  )
}

export async function getMasterLeague(region: string, queue: string) {
  return cached(
    `master:${region}:${queue}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/league/v4/masterleagues/by-queue/${queue}`).then(r => r.data),
    apexLimiter
  )
}

async function enrichOne(region: string, entry: LeagueEntry): Promise<LeagueEntry> {
  const puuid = entry.puuid ?? (await getSummonerById(region, entry.summonerId!)).puuid
  const [summoner, account] = await Promise.all([
    getSummonerByPuuid(region, puuid),
    getAccountByPuuid(region, puuid),
  ])
  return {
    ...entry,
    puuid,
    gameName:      account.gameName,
    tagLine:       account.tagLine,
    profileIconId: summoner.profileIconId,
  }
}

async function enrichAllBackground(region: string, allEntries: LeagueEntry[], cacheKey: string, raw: any): Promise<void> {
  const working = [...allEntries]

  await Promise.allSettled(
    working.map(async (entry, i) => {
      try {
        working[i] = await enrichOne(region, entry)
      } catch {
        working[i] = { ...entry, gameName: entry.summonerName ?? null, tagLine: null }
      }
      cache.set(cacheKey, { ...raw, entries: [...working] }, ENRICHED_TTL)
    })
  )
}

async function getRawLeague(region: string, queue: string, tier: string): Promise<any> {
  if (tier === 'challenger')  return getChallengerLeague(region, queue)
  if (tier === 'grandmaster') return getGrandmasterLeague(region, queue)
  return getMasterLeague(region, queue)
}

export async function getEnrichedRankingApex(region: string, queue: string, tier: string): Promise<any> {
  const key = `rankingEnriched:${region}:${queue}:${tier}`
  const hit = cache.get<any>(key)
  if (hit) return hit

  const raw = await getRawLeague(region, queue, tier)
  const sorted = [...(raw.entries ?? [])]
    .sort((a: LeagueEntry, b: LeagueEntry) => b.leaguePoints - a.leaguePoints)
    .slice(0, MAX_PLAYERS)

  const withFallback = sorted.map((e: LeagueEntry) => ({ ...e, gameName: e.summonerName ?? null, tagLine: null }))
  cache.set(key, { ...raw, entries: withFallback }, ENRICHED_TTL)

  enrichAllBackground(region, withFallback, key, raw).catch(() => {})

  return { ...raw, entries: withFallback }
}

// ─────────────────────────────────────────────────────────────
// 🏆 LOL — RANKING ENTRIES (Diamond e abaixo)
// ─────────────────────────────────────────────────────────────
async function enrichEntriesBackground(region: string, entries: LeagueEntry[], cacheKey: string): Promise<void> {
  const working = [...entries]

  await Promise.allSettled(
    working.map(async (entry, i) => {
      try {
        working[i] = await enrichOne(region, entry)
      } catch {
        working[i] = { ...entry, gameName: entry.summonerName ?? null, tagLine: null }
      }
      cache.set(cacheKey, [...working], ENRICHED_TTL)
    })
  )
}

export async function getEnrichedRankingEntries(region: string, queue: string, tier: string, division: string): Promise<any[]> {
  const key = `entriesEnriched:${region}:${queue}:${tier}:${division}`
  const hit = cache.get<any[]>(key)
  if (hit) return hit

  const raw: LeagueEntry[] = await riotFetch(() =>
    getClient('platform', region).get(`/lol/league/v4/entries/${queue}/${tier}/${division}`).then(r => r.data)
  )

  const withFallback = raw.map(e => ({ ...e, gameName: e.summonerName ?? null, tagLine: null }))
  cache.set(key, withFallback, ENRICHED_TTL)

  enrichEntriesBackground(region, withFallback, key).catch(() => {})

  return withFallback
}

// ─────────────────────────────────────────────────────────────
// 🌀 LOL — MISC
// ─────────────────────────────────────────────────────────────
export async function getChampionRotations(region: string) {
  return cached(
    `rotations:${region}`,
    PROFILE_TTL,
    () => getClient('platform', region).get('/lol/platform/v3/champion-rotations').then(r => r.data),
    apexLimiter
  )
}

export async function getLolStatus(region: string) {
  return cached(
    `lolStatus:${region}`,
    60,
    () => getClient('platform', region).get('/lol/status/v4/platform-data').then(r => r.data)
  )
}

export async function getClashByPuuid(region: string, puuid: string) {
  return cached(
    `clash:${region}:${puuid}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/clash/v1/players/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

export async function getClashTeam(region: string, teamId: string) {
  return cached(
    `clashTeam:${region}:${teamId}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/lol/clash/v1/teams/${safe(teamId)}`).then(r => r.data)
  )
}

export async function getClashTournaments(region: string) {
  return cached(
    `clashTournaments:${region}`,
    PROFILE_TTL,
    () => getClient('platform', region).get('/lol/clash/v1/tournaments').then(r => r.data),
    clashTournamentLimiter
  )
}

export async function getChampionMap(): Promise<Record<string, string>> {
  return cached('championMap', 86400, async () => {
    const { data } = await axios.get('https://ddragon.leagueoflegends.com/cdn/14.24.1/data/en_US/champion.json')
    const map: Record<string, string> = {}
    for (const champ of Object.values(data.data as Record<string, any>)) {
      map[(champ as any).key] = (champ as any).id
    }
    return map
  })
}

// ─────────────────────────────────────────────────────────────
// 🤖 TFT
// ─────────────────────────────────────────────────────────────
export async function getTftSummonerByPuuid(region: string, puuid: string) {
  return cached(
    `tftSummoner:${region}:${puuid}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/tft/summoner/v1/summoners/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

export async function getTftLeagueByPuuid(region: string, puuid: string) {
  return cached(
    `tftLeague:${region}:${puuid}`,
    PROFILE_TTL,
    () => getClient('platform', region).get(`/tft/league/v1/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

export async function getTftMatchIds(region: string, puuid: string, count = 20) {
  return cached(
    `tftMatchIds:${region}:${puuid}:${count}`,
    MATCH_TTL,
    () => getClient('regional', region).get(`/tft/match/v1/matches/by-puuid/${safe(puuid)}/ids?count=${count}`).then(r => r.data)
  )
}

export async function getTftMatch(region: string, matchId: string) {
  return cached(
    `tftMatch:${region}:${matchId}`,
    MATCH_TTL,
    () => getClient('regional', region).get(`/tft/match/v1/matches/${safe(matchId)}`).then(r => r.data)
  )
}

export async function getTftLiveGame(region: string, puuid: string) {
  return riotFetch(() =>
    getClient('platform', region).get(`/lol/spectator/tft/v5/active-games/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

export async function getTftChallenger(region: string) {
  return cached(
    `tftChallenger:${region}`,
    PROFILE_TTL,
    () => getClient('platform', region).get('/tft/league/v1/challenger').then(r => r.data),
    apexLimiter
  )
}

export async function getTftGrandmaster(region: string) {
  return cached(
    `tftGrandmaster:${region}`,
    PROFILE_TTL,
    () => getClient('platform', region).get('/tft/league/v1/grandmaster').then(r => r.data),
    apexLimiter
  )
}

export async function getTftMaster(region: string) {
  return cached(
    `tftMaster:${region}`,
    PROFILE_TTL,
    () => getClient('platform', region).get('/tft/league/v1/master').then(r => r.data),
    apexLimiter
  )
}

export async function getTftStatus(region: string) {
  return cached(
    `tftStatus:${region}`,
    60,
    () => getClient('platform', region).get('/tft/status/v1/platform-data').then(r => r.data)
  )
}

async function getRawTftLeague(region: string, tier: string): Promise<any> {
  if (tier === 'challenger')  return getTftChallenger(region)
  if (tier === 'grandmaster') return getTftGrandmaster(region)
  return getTftMaster(region)
}

export async function getEnrichedTftRankingApex(region: string, tier: string): Promise<any> {
  const key = `tftRankingEnriched:${region}:${tier}`
  const hit = cache.get<any>(key)
  if (hit) return hit

  const raw = await getRawTftLeague(region, tier)
  const sorted = [...(raw.entries ?? [])]
    .sort((a: LeagueEntry, b: LeagueEntry) => b.leaguePoints - a.leaguePoints)
    .slice(0, MAX_PLAYERS)

  const withFallback = sorted.map((e: LeagueEntry) => ({ ...e, gameName: e.summonerName ?? null, tagLine: null }))
  cache.set(key, { ...raw, entries: withFallback }, ENRICHED_TTL)

  enrichAllBackground(region, withFallback, key, raw).catch(() => {})

  return { ...raw, entries: withFallback }
}

// ─────────────────────────────────────────────────────────────
// 🔫 VALORANT
// ─────────────────────────────────────────────────────────────
export async function getValMatchList(region: string, puuid: string) {
  return cached(
    `valMatches:${region}:${puuid}`,
    MATCH_TTL,
    () => getClient('val', region).get(`/val/match/v1/matchlists/by-puuid/${safe(puuid)}`).then(r => r.data)
  )
}

export async function getValMatch(region: string, matchId: string) {
  return cached(
    `valMatch:${region}:${matchId}`,
    MATCH_TTL,
    () => getClient('val', region).get(`/val/match/v1/matches/${safe(matchId)}`).then(r => r.data)
  )
}

export async function getValRanking(region: string, actId: string) {
  return cached(
    `valRanking:${region}:${actId}`,
    PROFILE_TTL,
    () => getClient('val', region).get(`/val/ranked/v1/leaderboards/by-act/${safe(actId)}`).then(r => r.data)
  )
}

export async function getValStatus(region: string) {
  return cached(
    `valStatus:${region}`,
    60,
    () => getClient('val', region).get('/val/status/v1/platform-data').then(r => r.data)
  )
}

export async function getValContent(region: string) {
  return cached(
    `valContent:${region}`,
    PROFILE_TTL,
    () => getClient('val', region).get('/val/content/v1/contents').then(r => r.data)
  )
}

// ─────────────────────────────────────────────────────────────
// 🔥 WARMUP
// ─────────────────────────────────────────────────────────────
export function warmupCache(): void {
  setTimeout(async () => {
    try {
      await getEnrichedRankingApex('br1', 'RANKED_SOLO_5x5', 'challenger')
      console.log('[warmup] BR1 Challenger carregado')
    } catch { /* silencioso */ }
  }, 5000)
}
