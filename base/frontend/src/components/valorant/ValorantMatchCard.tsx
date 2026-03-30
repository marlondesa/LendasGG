import { Link } from 'react-router-dom'
import styles from './ValorantMatchCard.module.css'

interface ValorantPlayer {
  puuid: string
  team?: string
  character?: string
  stats?: {
    kills?: number
    deaths?: number
    assists?: number
    headshots?: number
    bodyshots?: number
    legshots?: number
  }
  assets?: { agent?: { small?: string } }
}

interface ValorantMatch {
  metadata?: { matchid?: string; map?: string; mode?: string }
  players?: { all_players?: ValorantPlayer[] }
  teams?: Record<string, { has_won?: boolean }>
}

interface ValorantMatchCardProps {
  match: ValorantMatch
  puuid: string
}

export default function ValorantMatchCard({ match, puuid }: ValorantMatchCardProps) {
  const player = match?.players?.all_players?.find(p => p.puuid === puuid)
  if (!player) return null

  const won = match?.teams?.[player.team?.toLowerCase() ?? '']?.has_won
  const kda = `${player.stats?.kills}/${player.stats?.deaths}/${player.stats?.assists}`
  const hs = player.stats?.headshots
  const total = (player.stats?.headshots ?? 0) + (player.stats?.bodyshots ?? 0) + (player.stats?.legshots ?? 0)
  const hsPercent = total > 0 ? Math.round((hs ?? 0) / total * 100) : 0

  return (
    <Link to={`/valorant/partida/${match.metadata?.matchid}`} className={styles.link}>
      <div className={`${styles.card} ${won ? styles.win : styles.loss}`}>
        <img
          src={player.assets?.agent?.small}
          alt={player.character}
          width={44}
          height={44}
          className={styles.icon}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className={styles.info}>
          <div className={styles.character}>{player.character}</div>
          <div className={styles.mapMode}>{match.metadata?.map} — {match.metadata?.mode}</div>
        </div>
        <div className={styles.stats}>
          <div className={styles.kda}>{kda}</div>
          <div className={styles.hs}>HS: {hsPercent}%</div>
        </div>
        <div className={won ? styles.resultWin : styles.resultLoss}>
          {won ? 'Vitória' : 'Derrota'}
        </div>
      </div>
    </Link>
  )
}
