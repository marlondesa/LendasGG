import styles from './RankCard.module.css'

interface RankEntry {
  queueType: string
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

interface RankCardProps {
  entry?: RankEntry
  queueLabel?: string
}

const TIER_COLORS: Record<string, string> = {
  IRON: '#8c8c8c',
  BRONZE: '#cd7f32',
  SILVER: '#c0c0c0',
  GOLD: '#ffd700',
  PLATINUM: '#4dd6c4',
  EMERALD: '#50c878',
  DIAMOND: '#9dd6ff',
  MASTER: '#c44aff',
  GRANDMASTER: '#ff4444',
  CHALLENGER: '#f2d44e',
}

const TIER_FILE: Record<string, string> = {
  IRON: 'Iron',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  EMERALD: 'Emerald',
  DIAMOND: 'Diamond',
  MASTER: 'Master',
  GRANDMASTER: 'GrandMaster',
  CHALLENGER: 'Challenger',
}

function tierImage(tier: string): string {
  const file = TIER_FILE[tier.toUpperCase()] ?? tier
  return new URL(`../../public/${file}.png`, import.meta.url).href
}

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])

export default function RankCard({ entry, queueLabel }: RankCardProps) {
  if (!entry) {
    return (
      <div className={styles.rankCard}>
        <div className={styles.queueType}>{queueLabel ?? 'Ranqueada'}</div>
        <div className={styles.body}>
          <img
            src={new URL('../../public/semElo.png', import.meta.url).href}
            alt="Sem elo"
            width={72}
            height={72}
            className={styles.emblem}
          />
          <div className={styles.tier} style={{ color: 'var(--text-muted)' }}>Sem classificação</div>
        </div>
      </div>
    )
  }
  const winrate = Math.round(entry.wins / (entry.wins + entry.losses) * 100)
  const tierColor = TIER_COLORS[entry.tier] ?? 'var(--text)'
  const showRank = !APEX.has(entry.tier.toUpperCase())

  return (
    <div className={styles.rankCard}>
      <div className={styles.queueType}>
        {entry.queueType === 'RANKED_SOLO_5x5' ? 'Ranqueada Solo/Duo' : 'Ranqueada Flex'}
      </div>
      <div className={styles.body}>
        <img
          src={tierImage(entry.tier)}
          alt={entry.tier}
          width={72}
          height={72}
          className={styles.emblem}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div>
          <div className={styles.tier} style={{ color: tierColor }}>
            {entry.tier}{showRank ? ` ${entry.rank}` : ''}
          </div>
          <div className={styles.lp}>{entry.leaguePoints} LP</div>
          <div className={styles.winRate}>
            <span className={styles.wins}>{entry.wins}V</span>
            {' '}<span className={styles.losses}>{entry.losses}D</span>
            {' '}— <span>{winrate}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
