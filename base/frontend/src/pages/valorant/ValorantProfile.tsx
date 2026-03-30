import { useParams } from 'react-router-dom'
import { useValPlayer } from '../../hooks/useValorant'
import styles from './ValorantProfile.module.css'

export default function ValorantProfile() {
  const { region, gameName, tagLine } = useParams()
  const { data, isLoading, isError } = useValPlayer(region!, gameName, tagLine)

  if (isLoading) return <p className={styles.loading}>Carregando...</p>
  if (isError) return <p className={styles.error}>Jogador não encontrado.</p>

  const { account, matchList } = data as any
  const matches = matchList?.history ?? []

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 style={{ margin: 0 }}>{account.gameName}<span className={styles.tagLine}>#{account.tagLine}</span></h1>
        <div className={styles.game}>Valorant</div>
      </div>

      <h2>Histórico de Partidas</h2>
      <p className={styles.hint}>
        Clique em uma partida para ver os detalhes completos.
      </p>
      {matches.length === 0 && <p className={styles.noMatches}>Nenhuma partida encontrada.</p>}
      {matches.map((m: any) => (
        <div key={m.matchId} className={styles.matchRow}>
          <span className={styles.matchId}>ID: {m.matchId}</span>
          <a href={`/valorant/${region}/partida/${m.matchId}`} className={styles.matchLink}>Ver detalhes →</a>
        </div>
      ))}
    </div>
  )
}
