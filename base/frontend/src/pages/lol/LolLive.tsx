import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useLiveGame } from '../../hooks/useLol'
import { keystoneImg, pathImg, KEYSTONE_NAMES, PATH_NAMES } from '../../utils/runeData'
import styles from './LolLive.module.css'

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'

const SPELL_MAP: Record<number, string> = {
  1: 'SummonerBoost', 3: 'SummonerExhaust', 4: 'SummonerFlash',
  6: 'SummonerHaste', 7: 'SummonerHeal', 11: 'SummonerSmite',
  12: 'SummonerTeleport', 13: 'SummonerMana', 14: 'SummonerDot',
  21: 'SummonerBarrier', 32: 'SummonerSnowball',
}

const TIER_COLORS: Record<string, string> = {
  IRON: '#8c8c8c', BRONZE: '#cd7f32', SILVER: '#b0b0b0',
  GOLD: '#f59e0b', PLATINUM: '#4dd6c4', EMERALD: '#34d399',
  DIAMOND: '#93c5fd', MASTER: '#c084fc', GRANDMASTER: '#f87171', CHALLENGER: '#fbbf24',
}

const TIER_FILE: Record<string, string> = {
  IRON: 'Iron', BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold',
  PLATINUM: 'Platinum', EMERALD: 'Emerald', DIAMOND: 'Diamond',
  MASTER: 'Master', GRANDMASTER: 'GrandMaster', CHALLENGER: 'Challenger',
}

function tierImage(tier: string) {
  const file = TIER_FILE[tier.toUpperCase()] ?? tier
  return new URL(`../../public/${file}.png`, import.meta.url).href
}

const QUEUE_NAMES: Record<number, string> = {
  420: 'Ranqueada Solo/Duo', 440: 'Ranqueada Flex', 450: 'ARAM',
  400: 'Normal Draft', 430: 'Normal Cego', 900: 'URF', 0: 'Custom',
}

function getRankInfo(soloQ: any) {
  if (!soloQ) return null
  const tier = (soloQ.tier as string).toUpperCase()
  const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])
  const label = APEX.has(tier)
    ? tier.charAt(0) + tier.slice(1).toLowerCase()
    : `${tier.charAt(0) + tier.slice(1).toLowerCase()} ${soloQ.rank}`
  const color = TIER_COLORS[tier] ?? 'var(--text)'
  const games = soloQ.wins + soloQ.losses
  const wr = games > 0 ? Math.round(soloQ.wins / games * 100) : 0
  return { label, tier, color, lp: soloQ.leaguePoints, wr, games }
}

interface TeamSectionProps {
  team: any[]
  bans: any[]
  color: 'blue' | 'red'
  region: string
}

const TIER_SCORE: Record<string, number> = {
  IRON: 0, BRONZE: 4, SILVER: 8, GOLD: 12, PLATINUM: 16,
  EMERALD: 20, DIAMOND: 24, MASTER: 28, GRANDMASTER: 32, CHALLENGER: 36,
}
const RANK_SCORE: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 }
const TIER_LABELS = ['Iron', 'Iron', 'Iron', 'Iron', 'Bronze', 'Bronze', 'Bronze', 'Bronze',
  'Silver', 'Silver', 'Silver', 'Silver', 'Gold', 'Gold', 'Gold', 'Gold',
  'Platinum', 'Platinum', 'Platinum', 'Platinum', 'Emerald', 'Emerald', 'Emerald', 'Emerald',
  'Diamond', 'Diamond', 'Diamond', 'Diamond', 'Master', 'Master', 'Master', 'Master',
  'Grandmaster', 'Grandmaster', 'Grandmaster', 'Grandmaster', 'Challenger']
const RANK_LABELS = ['IV', 'III', 'II', 'I', 'IV', 'III', 'II', 'I', 'IV', 'III', 'II', 'I',
  'IV', 'III', 'II', 'I', 'IV', 'III', 'II', 'I', 'IV', 'III', 'II', 'I',
  'IV', 'III', 'II', 'I', '', '', '', '', '', '', '', '', '']

function getAvgRankLabel(team: any[]): string | null {
  const ranked = team.filter(p => p.soloQ?.tier)
  if (ranked.length === 0) return null
  const avg = ranked.reduce((acc, p) => {
    const t = TIER_SCORE[p.soloQ.tier?.toUpperCase() ?? ''] ?? 0
    const r = RANK_SCORE[p.soloQ.rank ?? ''] ?? 0
    return acc + t + r
  }, 0) / ranked.length
  const idx = Math.min(Math.round(avg), TIER_LABELS.length - 1)
  const rl = RANK_LABELS[idx]
  return `${TIER_LABELS[idx]}${rl ? ' ' + rl : ''}`
}

function TeamSection({ team, bans, color, region }: TeamSectionProps) {
  const [open, setOpen] = useState(true)
  const isBlue = color === 'blue'
  const avgLabel = getAvgRankLabel(team)

  return (
    <div className={styles.teamBlock}>
      <button className={styles.teamToggle} onClick={() => setOpen(v => !v)}>
        <div className={styles.teamToggleLeft}>
          <div className={`${styles.teamColorBar} ${isBlue ? styles.teamColorBarBlue : styles.teamColorBarRed}`} />
          <span className={styles.teamName}>{isBlue ? 'Time Azul' : 'Time Vermelho'}</span>
          {avgLabel && (
            <span className={styles.teamAvgRank}>Média: {avgLabel}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {bans.length > 0 && (
            <div className={styles.bansGroup}>
              <span className={styles.bansLabel}>Bans</span>
              {bans.filter(b => b.championId > 0 && b.championName).map((b, i) => (
                <div key={i} className={styles.banChip} title={b.championName}>
                  <img
                    src={`${DDR}/img/champion/${b.championName}.png`}
                    alt={b.championName}
                    width={26}
                    height={26}
                    className={styles.banImg}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              ))}
            </div>
          )}
          <ChevronDown size={18} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
        </div>
      </button>

      {open && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Campeão</th>
                <th className={styles.th}>Jogador</th>
                <th className={styles.th}>Elo (Solo/Duo)</th>
                <th className={styles.th}>Taxa de vitórias</th>
              </tr>
            </thead>
            <tbody>
              {team.map((p: any) => {
                const rank = getRankInfo(p.soloQ)
                const keystoneId = p.perks?.perkIds?.[0]
                const subStyle = p.perks?.perkSubStyle
                const kImg = keystoneImg(keystoneId)
                const sImg = pathImg(subStyle)
                const kName = keystoneId ? (KEYSTONE_NAMES[keystoneId] ?? '') : ''
                const sName = subStyle ? (PATH_NAMES[subStyle] ?? '') : ''

                return (
                  <tr key={p.puuid} className={styles.tr}>

                    {/* Campeão + spells + runas */}
                    <td className={styles.td}>
                      <div className={styles.champCell}>
                        <div className={styles.champImgWrap}>
                          <img
                            src={`${DDR}/img/champion/${p.championName}.png`}
                            alt={p.championName ?? ''}
                            width={44}
                            height={44}
                            className={styles.champImg}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                        <div className={styles.spellRuneCol}>
                          <div className={styles.spellRuneRow}>
                            {SPELL_MAP[p.spell1Id] && (
                              <img src={`${DDR}/img/spell/${SPELL_MAP[p.spell1Id]}.png`}
                                width={20} height={20} className={styles.spellImg} alt="" />
                            )}
                            {kImg && (
                              <img src={kImg} width={20} height={20} className={styles.runeImg}
                                alt={kName} title={kName}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            )}
                          </div>
                          <div className={styles.spellRuneRow}>
                            {SPELL_MAP[p.spell2Id] && (
                              <img src={`${DDR}/img/spell/${SPELL_MAP[p.spell2Id]}.png`}
                                width={20} height={20} className={styles.spellImg} alt="" />
                            )}
                            {sImg && (
                              <img src={sImg} width={20} height={20} className={styles.runeImg}
                                alt={sName} title={sName}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            )}
                          </div>
                          {kName && <div className={styles.runeNameText}>{kName}</div>}
                        </div>
                        <div className={styles.champNameText}>{p.championName}</div>
                      </div>
                    </td>

                    {/* Jogador */}
                    <td className={styles.td}>
                      <Link
                        to={`/lol/${region}/${encodeURIComponent(p.riotIdGameName ?? '')}/${encodeURIComponent(p.riotIdTagline ?? '')}`}
                        className={styles.playerLink}
                      >
                        {p.riotIdGameName}<span className={styles.playerTag}>#{p.riotIdTagline}</span>
                      </Link>
                      {p.summonerLevel && (
                        <div className={styles.playerLevel}>Nível {p.summonerLevel}</div>
                      )}
                    </td>

                    {/* Elo */}
                    <td className={styles.td}>
                      {rank ? (
                        <div className={styles.rankCell}>
                          <img
                            src={tierImage(rank.tier)}
                            alt={rank.tier}
                            width={32}
                            height={32}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div>
                            <div className={styles.rankTier} style={{ color: rank.color }}>{rank.label}</div>
                            <div className={styles.rankLp}>{rank.lp} LP</div>
                          </div>
                        </div>
                      ) : <span className={styles.noData}>—</span>}
                    </td>

                    {/* WR */}
                    <td className={styles.td}>
                      {rank && rank.games > 0 ? (
                        <div className={styles.wrWrap}>
                          <span className={`${styles.wrPct} ${rank.wr >= 50 ? styles.wrGood : styles.wrBad}`}>
                            {rank.wr}%
                          </span>
                          <div className={styles.wrBar}>
                            <div
                              className={`${styles.wrFill} ${rank.wr >= 50 ? styles.wrFillGood : styles.wrFillBad}`}
                              style={{ width: `${rank.wr}%` }}
                            />
                          </div>
                          <span className={styles.wrGames}>{rank.games} jogados</span>
                        </div>
                      ) : <span className={styles.noData}>—</span>}
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function LolLive() {
  const { region, gameName, tagLine } = useParams()
  const { data, isLoading, isError } = useLiveGame(region!, gameName, tagLine)

  if (isLoading) return <p className={styles.loading}>Carregando partida ao vivo...</p>
  if (isError || !data) return <p className={styles.noGame}>Jogador não está em partida no momento.</p>

  const game = data as any
  const team1: any[] = game.participants?.filter((p: any) => p.teamId === 100) ?? []
  const team2: any[] = game.participants?.filter((p: any) => p.teamId === 200) ?? []
  const bans1: any[] = game.bannedChampions?.filter((b: any) => b.teamId === 100) ?? []
  const bans2: any[] = game.bannedChampions?.filter((b: any) => b.teamId === 200) ?? []
  const mins = Math.floor((game.gameLength ?? 0) / 60)
  const secs = (game.gameLength ?? 0) % 60
  const queueName = QUEUE_NAMES[game.gameQueueConfigId] ?? game.gameMode

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.liveDot} />
          <span className={styles.liveLabel}>Partida Ao Vivo</span>
          <span className={styles.queueBadge}>{queueName}</span>
        </div>
        <span className={styles.timer}>{mins}:{secs.toString().padStart(2, '0')}</span>
      </div>

      <TeamSection team={team1} bans={bans1} color="blue" region={region!} />
      <TeamSection team={team2} bans={bans2} color="red" region={region!} />
    </div>
  )
}
