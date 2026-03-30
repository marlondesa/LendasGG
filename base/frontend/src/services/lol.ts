import api from './api'

export const getPlayer = (region: string, gameName: string, tagLine: string): Promise<unknown> =>
  api.get(`/api/lol/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, { params: { region } }).then(r => r.data)

export const getLiveGame = (region: string, gameName: string, tagLine: string): Promise<unknown> =>
  api.get(`/api/lol/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/live`, { params: { region } })
    .then(r => r.data)
    .catch((err: any) => { if (err?.response?.status === 404) return null; throw err })

export const getMatches = (region: string, puuid: string): Promise<unknown> =>
  api.get(`/api/lol/matches/${puuid}`, { params: { region } }).then(r => r.data)

export const getMatchDetail = (region: string, matchId: string): Promise<unknown> =>
  api.get(`/api/lol/matches/${matchId}/detail`, { params: { region } }).then(r => r.data)

export const getRankingApex = (region: string, queue: string, tier: string): Promise<unknown> =>
  api.get(`/api/lol/ranking/apex/${queue}/${tier}`, { params: { region } }).then(r => r.data)

export const getRankingEntries = (region: string, queue: string, tier: string, division: string): Promise<unknown> =>
  api.get(`/api/lol/ranking/${queue}/${tier}/${division}`, { params: { region } }).then(r => r.data)

export const getServer = (region: string): Promise<unknown> =>
  api.get('/api/lol/server', { params: { region } }).then(r => r.data)

export const getClashTournaments = (region: string): Promise<unknown> =>
  api.get('/api/lol/clash/tournaments', { params: { region } }).then(r => r.data)

export const getClash = (region: string, gameName: string, tagLine: string): Promise<unknown> =>
  api.get(`/api/lol/clash/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, { params: { region } }).then(r => r.data)
