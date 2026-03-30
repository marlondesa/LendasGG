import { Link } from 'react-router-dom'
import styles from './RankingTable.module.css'

interface RankingEntry {
  summonerId: string
  summonerName?: string
  gameName?: string
  tagLine?: string
  profileIconId?: number
  rank?: string
  leaguePoints: number
  wins: number
  losses: number
}

interface RankingTableProps {
  entries?: RankingEntry[]
  tier?: string
  region?: string
  game?: string
  offset?: number
}

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'

const TIER_COLORS: Record<string, string> = {
  IRON: '#8c8c8c', BRONZE: '#cd7f32', SILVER: '#c0c0c0',
  GOLD: '#ffd700', PLATINUM: '#4dd6c4', EMERALD: '#50c878',
  DIAMOND: '#9dd6ff', MASTER: '#c44aff', GRANDMASTER: '#ff4444', CHALLENGER: '#f2d44e',
}

const TIER_FILE: Record<string, string> = {
  IRON: 'Iron', BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold',
  PLATINUM: 'Platinum', EMERALD: 'Emerald', DIAMOND: 'Diamond',
  MASTER: 'Master', GRANDMASTER: 'GrandMaster', CHALLENGER: 'Challenger',
}

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])

function tierImage(tier: string): string {
  const file = TIER_FILE[tier.toUpperCase()] ?? tier
  return new URL(`../../public/${file}.png`, import.meta.url).href
}

export default function RankingTable({ entries, tier, region = 'br1', game = 'lol', offset = 0 }: RankingTableProps) {
  if (!entries?.length) return <p>Nenhum dado.</p>

  const tierUpper = tier?.toUpperCase() ?? ''
  const tierColor = TIER_COLORS[tierUpper] ?? 'var(--text)'
  const showRank = !APEX.has(tierUpper)

  return (
    <table className={styles.table}>
      <thead className={styles.thead}>
        <tr>
          <th className={styles.th}>#</th>
          <th className={styles.th}>Jogador</th>
          <th className={styles.th}>Elo</th>
          <th className={styles.th}>LP</th>
          <th className={styles.th}>W</th>
          <th className={styles.th}>L</th>
          <th className={styles.th}>WR%</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => {
          const wr = Math.round(e.wins / (e.wins + e.losses) * 100)
          const rankLabel = showRank && e.rank ? ` ${e.rank}` : ''
          const hasRiotId = !!e.gameName && !!e.tagLine
          const displayName = hasRiotId
            ? `${e.gameName}#${e.tagLine}`
            : (e.summonerName || `—`)
          const profileLink = hasRiotId
            ? `/${game}/${region}/${encodeURIComponent(e.gameName!)}/${encodeURIComponent(e.tagLine!)}`
            : null

          return (
            <tr key={e.summonerId ?? i} className={styles.row}>
              <td className={styles.tdRank}>{offset + i + 1}</td>
              <td className={styles.td}>
                {profileLink ? (
                  <Link to={profileLink} className={styles.playerLink}>
                    <div className={styles.player}>
                      <img
                        src={`${DDR}/img/profileicon/${e.profileIconId ?? 29}.png`}
                        alt="icon"
                        width={32}
                        height={32}
                        className={styles.avatar}
                        onError={e2 => { (e2.target as HTMLImageElement).src = `${DDR}/img/profileicon/29.png` }}
                      />
                      <span className={styles.playerName}>{displayName}</span>
                    </div>
                  </Link>
                ) : (
                  <div className={styles.player}>
                    <img
                      src={`${DDR}/img/profileicon/29.png`}
                      alt="icon"
                      width={32}
                      height={32}
                      className={styles.avatar}
                    />
                    <span className={styles.playerNameMuted}>{displayName}</span>
                  </div>
                )}
              </td>
              <td className={styles.td}>
                {tier && (
                  <div className={styles.tierCell}>
                    <img
                      src={tierImage(tier)}
                      alt={tier}
                      width={32}
                      height={32}
                      className={styles.tierEmblem}
                      onError={e2 => { (e2.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span style={{ color: tierColor, fontWeight: 700, fontSize: 13 }}>
                      {tierUpper}{rankLabel}
                    </span>
                  </div>
                )}
              </td>
              <td className={styles.tdLp}>{e.leaguePoints.toLocaleString()}</td>
              <td className={styles.tdW}>{e.wins}</td>
              <td className={styles.tdL}>{e.losses}</td>
              <td className={wr >= 50 ? styles.winRateGood : styles.winRateBad}>{wr}%</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
