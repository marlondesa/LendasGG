import { useParams } from 'react-router-dom'
import { useTftPlayer, useTftMatches } from '../../hooks/useTft'
import TFTMatchCard from '../../components/tft/TFTMatchCard'
import styles from './TftProfile.module.css'

export default function TftProfile() {
  const { region, gameName, tagLine } = useParams()
  const { data, isLoading, isError } = useTftPlayer(region!, gameName, tagLine)
  const { data: matches } = useTftMatches(region!, (data as any)?.account?.puuid)

  if (isLoading) return <p className={styles.loading}>Carregando...</p>
  if (isError) return <p className={styles.error}>Jogador não encontrado.</p>

  const { account, summoner, league } = data as any
  const ranked = league?.[0]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${summoner?.profileIconId}.png`}
          alt="icon"
          width={80}
          height={80}
          className={styles.avatar}
        />
        <div>
          <h1 style={{ margin: 0 }}>{account.gameName}<span className={styles.tagLine}>#{account.tagLine}</span></h1>
          <div className={styles.level}>TFT Nível {summoner?.summonerLevel}</div>
        </div>
      </div>

      {ranked && (
        <div className={styles.rankCard}>
          <div className={styles.rankTier}>{ranked.tier} {ranked.rank}</div>
          <div className={styles.rankLp}>{ranked.leaguePoints} LP</div>
          <div className={styles.rankStats}>
            {ranked.wins}W {ranked.losses}L — {Math.round(ranked.wins / (ranked.wins + ranked.losses) * 100)}%
          </div>
        </div>
      )}

      <h2>Últimas Partidas TFT</h2>
      {(matches as any[])?.map((match: any) => (
        <TFTMatchCard key={match?.metadata?.match_id} match={match} puuid={account.puuid} region={region!} />
      ))}
    </div>
  )
}
