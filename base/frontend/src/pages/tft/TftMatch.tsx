import { useParams } from 'react-router-dom'
import { useTftMatchDetail } from '../../hooks/useTft'
import styles from './TftMatch.module.css'

export default function TftMatch() {
  const { region, matchId } = useParams()
  const { data, isLoading, isError } = useTftMatchDetail(region!, matchId)

  if (isLoading) return <p className={styles.loading}>Carregando...</p>
  if (isError) return <p className={styles.error}>Partida não encontrada.</p>

  const matchData = data as any
  const participants = matchData?.info?.participants?.sort((a: any, b: any) => a.placement - b.placement) ?? []

  return (
    <div className={styles.container}>
      <h1>Detalhes da Partida TFT</h1>
      <p className={styles.subtitle}>{participants.length} jogadores</p>

      {participants.map((p: any) => {
        const placementColor = p.placement === 1 ? '#f59e0b' : p.placement <= 4 ? '#22c55e' : '#ef4444'
        return (
          <div key={p.puuid} className={styles.participantCard}>
            <div className={styles.placement} style={{ color: placementColor }}>#{p.placement}</div>
            <div className={styles.info}>
              <div className={styles.playerName}>{p.riotIdGameName ?? p.puuid.slice(0, 8)}</div>
              <div className={styles.augments}>
                {p.augments?.slice(0, 3).map((a: string) => (
                  <span key={a} className={styles.augmentTag}>
                    {a.replace('TFT_Augment_', '')}
                  </span>
                ))}
              </div>
              <div className={styles.traits}>
                {p.traits?.filter((t: any) => t.style > 0).map((t: any) => (
                  <span key={t.name} className={styles.traitTag}>{t.name.replace('Set', '')} ({t.num_units})</span>
                ))}
              </div>
            </div>
            <div className={styles.sideStats}>
              <div>{p.last_round} rounds</div>
              <div>{p.players_eliminated} elim.</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
