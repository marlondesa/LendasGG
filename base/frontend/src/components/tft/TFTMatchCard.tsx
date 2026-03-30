import { Link } from 'react-router-dom'
import styles from './TFTMatchCard.module.css'

interface TftParticipant {
  puuid: string
  placement: number
  augments?: string[]
  traits?: { style: number }[]
}

interface TftMatch {
  metadata: { match_id: string }
  info: {
    game_datetime: number
    game_length: number
    participants: TftParticipant[]
  }
}

interface TFTMatchCardProps {
  match: TftMatch
  puuid: string
  region: string
}

export default function TFTMatchCard({ match, puuid, region }: TFTMatchCardProps) {
  const info = match?.info
  const participant = info?.participants?.find(p => p.puuid === puuid)
  if (!participant) return null

  const placement = participant.placement
  const date = new Date(info.game_datetime).toLocaleDateString('pt-BR')
  const duration = Math.floor(info.game_length / 60)
  const placementColor = placement === 1 ? '#f59e0b' : placement <= 4 ? '#22c55e' : '#ef4444'

  return (
    <Link to={`/tft/${region}/partida/${match.metadata.match_id}`} className={styles.link}>
      <div className={styles.card} style={{ borderLeft: `4px solid ${placementColor}` }}>
        <div className={styles.placement} style={{ color: placementColor }}>
          #{placement}
        </div>
        <div className={styles.info}>
          <div className={styles.date}>{date} — {duration}m</div>
          <div className={styles.augments}>
            {participant.augments?.slice(0, 3).map(a => (
              <span key={a} className={styles.augmentTag}>
                {a.replace('TFT_Augment_', '')}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.traits}>
          {participant.traits?.filter(t => t.style > 0).length} traits ativos
        </div>
      </div>
    </Link>
  )
}
