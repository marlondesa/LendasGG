import { useQuery } from '@tanstack/react-query'
import * as tft from '../services/tft'

export const useTftPlayer = (region: string, gameName: string | undefined, tagLine: string | undefined) =>
  useQuery({
    queryKey: ['tft', 'player', region, gameName, tagLine],
    queryFn: () => tft.getPlayer(region, gameName!, tagLine!),
    enabled: !!gameName && !!tagLine,
  })

export const useTftMatches = (region: string, puuid: string | undefined) =>
  useQuery({
    queryKey: ['tft', 'matches', region, puuid],
    queryFn: () => tft.getMatches(region, puuid!),
    enabled: !!puuid,
  })

export const useTftMatchDetail = (region: string, matchId: string | undefined) =>
  useQuery({
    queryKey: ['tft', 'match', region, matchId],
    queryFn: () => tft.getMatchDetail(region, matchId!),
    enabled: !!matchId,
  })

export const useTftRankingApex = (region: string, tier: string) =>
  useQuery({
    queryKey: ['tft', 'ranking', region, tier],
    queryFn: () => tft.getRankingApex(region, tier),
    enabled: !!tier,
    refetchInterval: (query) => {
      const entries: any[] = (query.state.data as any)?.entries ?? []
      return entries.length > 0 && entries.some(e => !e.gameName) ? 20_000 : false
    },
  })

export const useTftServer = (region: string) =>
  useQuery({
    queryKey: ['tft', 'server', region],
    queryFn: () => tft.getServer(region),
  })
