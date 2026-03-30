import { useQuery } from '@tanstack/react-query'
import * as lol from '../services/lol'

export const usePlayer = (region: string, gameName: string | undefined, tagLine: string | undefined) =>
  useQuery({
    queryKey: ['lol', 'player', region, gameName, tagLine],
    queryFn: () => lol.getPlayer(region, gameName!, tagLine!),
    enabled: !!gameName && !!tagLine,
    retry: false,
  })

export const useLiveGame = (region: string, gameName: string | undefined, tagLine: string | undefined) =>
  useQuery({
    queryKey: ['lol', 'live', region, gameName, tagLine],
    queryFn: () => lol.getLiveGame(region, gameName!, tagLine!),
    enabled: !!gameName && !!tagLine,
    retry: false,
  })

export const useMatches = (region: string, puuid: string | undefined) =>
  useQuery({
    queryKey: ['lol', 'matches', region, puuid],
    queryFn: () => lol.getMatches(region, puuid!),
    enabled: !!puuid,
    retry: false,
  })

export const useMatchDetail = (region: string, matchId: string | undefined) =>
  useQuery({
    queryKey: ['lol', 'match', region, matchId],
    queryFn: () => lol.getMatchDetail(region, matchId!),
    enabled: !!matchId,
  })

export const useRankingApex = (region: string, queue: string, tier: string) =>
  useQuery({
    queryKey: ['lol', 'ranking', region, queue, tier],
    queryFn: () => lol.getRankingApex(region, queue, tier),
    enabled: !!queue && !!tier,
    refetchInterval: (query) => {
      const entries: any[] = (query.state.data as any)?.entries ?? []
      return entries.length > 0 && entries.some(e => !e.gameName) ? 5_000 : false
    },
  })

export const useRankingEntries = (region: string, queue: string, tier: string, division: string, enabled = true) =>
  useQuery({
    queryKey: ['lol', 'rankingEntries', region, queue, tier, division],
    queryFn: () => lol.getRankingEntries(region, queue, tier, division),
    enabled: enabled && !!queue && !!tier && !!division,
    retry: false,
    refetchInterval: (query) => {
      const entries: any[] = (query.state.data as any[]) ?? []
      return entries.length > 0 && entries.some(e => !e.gameName) ? 5_000 : false
    },
  })

export const useServer = (region: string) =>
  useQuery({
    queryKey: ['lol', 'server', region],
    queryFn: () => lol.getServer(region),
  })

export const useClashTournaments = (region: string) =>
  useQuery({
    queryKey: ['lol', 'clashTournaments', region],
    queryFn: () => lol.getClashTournaments(region),
    staleTime: 5 * 60 * 1000,
  })

export const useClash = (region: string, gameName: string | undefined, tagLine: string | undefined) =>
  useQuery({
    queryKey: ['lol', 'clash', region, gameName, tagLine],
    queryFn: () => lol.getClash(region, gameName!, tagLine!),
    enabled: !!gameName && !!tagLine,
  })
