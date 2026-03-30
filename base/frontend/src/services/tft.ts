import api from './api'

export const getPlayer = (region: string, gameName: string, tagLine: string): Promise<unknown> =>
  api.get(`/api/tft/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, { params: { region } }).then(r => r.data)

export const getLiveGame = (region: string, gameName: string, tagLine: string): Promise<unknown> =>
  api.get(`/api/tft/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/live`, { params: { region } })
    .then(r => r.data)
    .catch((err: any) => { if (err?.response?.status === 404) return null; throw err })

export const getMatches = (region: string, puuid: string): Promise<unknown> =>
  api.get(`/api/tft/matches/${puuid}`, { params: { region } }).then(r => r.data)

export const getMatchDetail = (region: string, matchId: string): Promise<unknown> =>
  api.get(`/api/tft/matches/${matchId}/detail`, { params: { region } }).then(r => r.data)

export const getRankingApex = (region: string, tier: string): Promise<unknown> =>
  api.get(`/api/tft/ranking/apex/${tier}`, { params: { region } }).then(r => r.data)

export const getServer = (region: string): Promise<unknown> =>
  api.get('/api/tft/server', { params: { region } }).then(r => r.data)
