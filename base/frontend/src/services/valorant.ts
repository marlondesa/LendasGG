import api from './api'

export const getPlayer = (region: string, gameName: string, tagLine: string): Promise<unknown> =>
  api.get(`/api/valorant/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, { params: { region } }).then(r => r.data)

export const getMatchDetail = (region: string, matchId: string): Promise<unknown> =>
  api.get(`/api/valorant/matches/${matchId}/detail`, { params: { region } }).then(r => r.data)

export const getRanking = (region: string, actId: string): Promise<unknown> =>
  api.get(`/api/valorant/ranking/${actId}`, { params: { region } }).then(r => r.data)

export const getServer = (region: string): Promise<unknown> =>
  api.get('/api/valorant/server', { params: { region } }).then(r => r.data)
