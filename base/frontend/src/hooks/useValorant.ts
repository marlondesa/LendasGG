import { useQuery } from '@tanstack/react-query'
import * as valorant from '../services/valorant'

export const useValPlayer = (region: string, gameName: string | undefined, tagLine: string | undefined) =>
  useQuery({
    queryKey: ['valorant', 'player', region, gameName, tagLine],
    queryFn: () => valorant.getPlayer(region, gameName!, tagLine!),
    enabled: !!gameName && !!tagLine,
  })

export const useValMatchDetail = (region: string, matchId: string | undefined) =>
  useQuery({
    queryKey: ['valorant', 'match', region, matchId],
    queryFn: () => valorant.getMatchDetail(region, matchId!),
    enabled: !!matchId,
  })

export const useValRanking = (region: string, actId: string | undefined) =>
  useQuery({
    queryKey: ['valorant', 'ranking', region, actId],
    queryFn: () => valorant.getRanking(region, actId!),
    enabled: !!actId,
  })

export const useValServer = (region: string) =>
  useQuery({
    queryKey: ['valorant', 'server', region],
    queryFn: () => valorant.getServer(region),
  })
