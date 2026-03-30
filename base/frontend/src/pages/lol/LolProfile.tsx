import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Radio, ChevronDown } from 'lucide-react'
import { usePlayer, useMatches, useLiveGame } from '../../hooks/useLol'
import RankCard from '../../components/lol/RankCard'
import MatchCard from '../../components/lol/MatchCard'
import styles from './LolProfile.module.css'

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'
const PAGE_SIZE = 10

type Tab = 'resumo' | 'campeoes' | 'maestria' | 'aovivo'

const QUEUE_LABELS: Record<string, string> = {
  all: 'Todos os modos',
  ranked: 'Ranqueada',
  solo: 'Ranqueada Solo/Duo',
  flex: 'Ranqueada Flex',
  normal: 'Normal',
  aram: 'ARAM',
}

const QUEUE_FILTER: Record<string, number[]> = {
  all: [],
  ranked: [420, 440],
  solo: [420],
  flex: [440],
  normal: [400, 430],
  aram: [450],
}

function WinrateDonut({ wins, total }: { wins: number; total: number }) {
  const pct = total > 0 ? wins / total : 0
  const losses = total - wins
  const r = 36, cx = 42, cy = 42
  const circ = 2 * Math.PI * r
  const winArc = circ * pct
  return (
    <div className={styles.donutWrapper}>
      <svg width={84} height={84}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={9} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#5383e8" strokeWidth={9}
          strokeDasharray={`${winArc} ${circ - winArc}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className={styles.donutLabels}>
        <span className={styles.donutWins}>{wins}V</span>
        <span className={styles.donutLosses}>{losses}D</span>
      </div>
    </div>
  )
}

function MasteryStars({ level }: { level: number }) {
  const filled = Math.min(level, 3)
  return (
    <div className={styles.masteryStars}>
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= filled ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </div>
  )
}

export default function LolProfile() {
  const { region, gameName, tagLine } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = usePlayer(region!, gameName, tagLine)
  const { data: liveData } = useLiveGame(region!, gameName, tagLine)
  const { data: matches } = useMatches(region!, (data as any)?.account?.puuid)
  const [tab, setTab] = useState<Tab>('resumo')
  const [matchPage, setMatchPage] = useState(1)
  const [queueFilter, setQueueFilter] = useState('all')
  const [queueDropdown, setQueueDropdown] = useState(false)

  const { account, summoner, league, mastery } = (data as any) ?? {}
  const soloQ = league?.find((l: any) => l.queueType === 'RANKED_SOLO_5x5')
  const flex = league?.find((l: any) => l.queueType === 'RANKED_FLEX_SR')
  const puuid = account?.puuid ?? ''
  const matchList = (matches as any[]) ?? []

  // ── Aggregate stats from ALL matches (used for resumo + campeoes) ──────────
  const champMap: Record<string, {
    games: number; wins: number; kills: number; deaths: number; assists: number
    cs: number; gold: number; duration: number
    double: number; triple: number; quadra: number; penta: number
    queues: number[]
  }> = {}

  const allStats = matchList.reduce((acc, match) => {
    const p = match?.info?.participants?.find((x: any) => x.puuid === puuid)
    if (!p) return acc
    const name = p.championName ?? 'Unknown'
    if (!champMap[name]) champMap[name] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, gold: 0, duration: 0, double: 0, triple: 0, quadra: 0, penta: 0, queues: [] }
    const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)
    champMap[name].games++
    if (p.win) champMap[name].wins++
    champMap[name].kills += p.kills
    champMap[name].deaths += p.deaths
    champMap[name].assists += p.assists
    champMap[name].cs += cs
    champMap[name].gold += p.goldEarned ?? 0
    champMap[name].duration += match.info.gameDuration ?? 0
    champMap[name].double += p.doubleKills ?? 0
    champMap[name].triple += p.tripleKills ?? 0
    champMap[name].quadra += p.quadraKills ?? 0
    champMap[name].penta += p.pentaKills ?? 0
    champMap[name].queues.push(match.info.queueId)
    return {
      total: acc.total + 1,
      wins: acc.wins + (p.win ? 1 : 0),
      kills: acc.kills + p.kills,
      deaths: acc.deaths + p.deaths,
      assists: acc.assists + p.assists,
      cs: acc.cs + cs,
      vision: acc.vision + (p.visionScore ?? 0),
    }
  }, { total: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, vision: 0 })

  const avgK = allStats.total > 0 ? (allStats.kills / allStats.total).toFixed(1) : '0'
  const avgD = allStats.total > 0 ? (allStats.deaths / allStats.total).toFixed(1) : '0'
  const avgA = allStats.total > 0 ? (allStats.assists / allStats.total).toFixed(1) : '0'
  const avgCs = allStats.total > 0 ? (allStats.cs / allStats.total).toFixed(0) : '0'
  const avgVision = allStats.total > 0 ? (allStats.vision / allStats.total).toFixed(1) : '0'
  const kdaRatio = allStats.deaths > 0 ? ((allStats.kills + allStats.assists) / allStats.deaths).toFixed(2) : 'Perfect'

  const top3Champs = Object.entries(champMap).sort((a, b) => b[1].games - a[1].games).slice(0, 3)

  // ── Campeões tab: filtro por queue ────────────────────────────────────────
  const queueIds = QUEUE_FILTER[queueFilter]
  const filteredChamps = useMemo(() => {
    return Object.entries(champMap)
      .map(([name, s]) => {
        if (queueIds.length === 0) return { name, ...s }
        const filtered = { name, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, gold: 0, duration: 0, double: 0, triple: 0, quadra: 0, penta: 0, queues: s.queues }
        s.queues.forEach((qid) => {
          if (!queueIds.includes(qid)) return
          filtered.games++
          // We can't easily re-filter per-match here since we aggregated already
          // fallback: use proportional stats
        })
        if (filtered.games === 0) return null
        const ratio = filtered.games / s.games
        return { name, games: filtered.games, wins: Math.round(s.wins * ratio), kills: s.kills * ratio, deaths: s.deaths * ratio, assists: s.assists * ratio, cs: s.cs * ratio, gold: s.gold * ratio, duration: s.duration * ratio, double: Math.round(s.double * ratio), triple: Math.round(s.triple * ratio), quadra: Math.round(s.quadra * ratio), penta: Math.round(s.penta * ratio), queues: s.queues }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.games - a.games)
  }, [queueFilter, matchList.length])

  // ── Maestria summary ──────────────────────────────────────────────────────
  const totalMasteryPoints = mastery?.reduce((acc: number, m: any) => acc + m.championPoints, 0) ?? 0
  const totalMasteryLevel = mastery?.reduce((acc: number, m: any) => acc + m.championLevel, 0) ?? 0
  const champCount = mastery?.length ?? 0

  // ── Match list (resumo tab) ───────────────────────────────────────────────
  const totalMatchPages = Math.ceil(matchList.length / PAGE_SIZE)
  const pagedMatches = matchList.slice((matchPage - 1) * PAGE_SIZE, matchPage * PAGE_SIZE)

  // Guards AFTER all hooks
  if (isLoading) return <p className={styles.loading}>Carregando...</p>
  if (isError) return <p className={styles.error}>Jogador não encontrado.</p>
  if (!account) return null

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <img
            src={`${DDR}/img/profileicon/${summoner?.profileIconId}.png`}
            alt="icon" width={160} height={160} className={styles.avatar}
          />
          <span className={styles.levelBadge}>{summoner?.summonerLevel}</span>
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.playerName}>
            {account.gameName}<span className={styles.tagLine}>#{account.tagLine}</span>
          </h1>
          <div className={styles.badges}>
            <div className={styles.regionBadge}>{region?.toUpperCase()}</div>
            {liveData != null && (
              <Link to={`/lol/${region}/${gameName}/${tagLine}/aovivo`} className={styles.liveBadge}>
                <Radio size={11} /> AO VIVO
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {([
          { key: 'resumo', label: 'Resumo' },
          { key: 'campeoes', label: 'Campeões' },
          { key: 'maestria', label: 'Maestria' },
          { key: 'aovivo', label: 'Jogo ao vivo' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''} ${t.key === 'aovivo' && liveData != null ? styles.tabLive : ''}`}
            onClick={() => {
              if (t.key === 'aovivo' && liveData != null) {
                navigate(`/lol/${region}/${gameName}/${tagLine}/aovivo`)
              } else {
                setTab(t.key)
              }
            }}
          >
            {t.key === 'aovivo' && liveData != null && <Radio size={11} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════ RESUMO ══════════════════ */}
      {tab === 'resumo' && (
        <>
          <div className={styles.resumoGrid}>
            <div className={styles.ranksCol}>
              <RankCard entry={soloQ} queueLabel="Ranqueada Solo/Duo" />
              <RankCard entry={flex} queueLabel="Ranqueada Flex" />
            </div>
            <div className={styles.statsPanel}>
              <div className={styles.statsPanelHeader}>Últimas {allStats.total} Partidas</div>
              <div className={styles.statsBody}>
                <WinrateDonut wins={allStats.wins} total={allStats.total} />
                <div className={styles.statsNumbers}>
                  <div className={styles.kdaBig}>
                    <span className={styles.kdaK}>{avgK}</span>
                    <span className={styles.kdaSlash}> / </span>
                    <span className={styles.kdaD}>{avgD}</span>
                    <span className={styles.kdaSlash}> / </span>
                    <span className={styles.kdaA}>{avgA}</span>
                  </div>
                  <div className={styles.kdaRatioLine}>{kdaRatio} KDA</div>
                  <div className={styles.statsExtra}>
                    <span>CS {avgCs}/partida</span>
                    <span>Visão {avgVision}</span>
                  </div>
                </div>
                {top3Champs.length > 0 && (
                  <div className={styles.topChamps}>
                    {top3Champs.map(([name, s]) => {
                      const wr = Math.round(s.wins / s.games * 100)
                      const kr = s.deaths > 0 ? ((s.kills + s.assists) / s.deaths).toFixed(2) : 'Perfect'
                      return (
                        <div key={name} className={styles.topChampRow}>
                          <img src={`${DDR}/img/champion/${name}.png`} alt={name} width={36} height={36}
                            className={styles.topChampIcon}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <div className={styles.topChampInfo}>
                            <div className={styles.topChampName}>{name}</div>
                            <div className={styles.topChampStats}>
                              <span className={wr >= 50 ? styles.wrGood : styles.wrBad}>{wr}%</span>
                              <span className={styles.topChampGames}>({s.games}J)</span>
                              <span className={styles.topChampKda}>{kr} KDA</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Histórico de Partidas</h2>
          {pagedMatches.map((match: any) => (
            <MatchCard key={match?.metadata?.matchId} match={match} puuid={puuid} region={region!} />
          ))}
          {totalMatchPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={matchPage === 1} onClick={() => setMatchPage(p => p - 1)}>← Anterior</button>
              <span className={styles.pageInfo}>{matchPage} / {totalMatchPages}</span>
              <button className={styles.pageBtn} disabled={matchPage === totalMatchPages} onClick={() => setMatchPage(p => p + 1)}>Próxima →</button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════ CAMPEÕES ════════════════ */}
      {tab === 'campeoes' && (
        <>
          <div className={styles.champFilters}>
            <div className={styles.dropdownWrapper}>
              <button className={styles.dropdownBtn} onClick={() => setQueueDropdown(v => !v)}>
                {QUEUE_LABELS[queueFilter]} <ChevronDown size={14} />
              </button>
              {queueDropdown && (
                <div className={styles.dropdownMenu}>
                  {Object.entries(QUEUE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      className={`${styles.dropdownItem} ${queueFilter === key ? styles.dropdownItemActive : ''}`}
                      onClick={() => { setQueueFilter(key); setQueueDropdown(false) }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.champTable}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.thead}>
                  <th className={styles.th} style={{ width: 32 }}>#</th>
                  <th className={styles.th}>Campeão</th>
                  <th className={styles.th}>Jogado</th>
                  <th className={styles.th}>KDA</th>
                  <th className={styles.th}>CS</th>
                  <th className={styles.th}>Ouro</th>
                  <th className={styles.th}>Double</th>
                  <th className={styles.th}>Triple</th>
                  <th className={styles.th}>Quadra</th>
                  <th className={styles.th}>Penta</th>
                </tr>
              </thead>
              <tbody>
                {filteredChamps.map((s: any, i: number) => {
                  const wr = Math.round(s.wins / s.games * 100)
                  const losses = s.games - s.wins
                  const kda = s.deaths > 0 ? ((s.kills + s.assists) / s.deaths).toFixed(2) : 'Perfect'
                  const avgK2 = (s.kills / s.games).toFixed(1)
                  const avgD2 = (s.deaths / s.games).toFixed(1)
                  const avgA2 = (s.assists / s.games).toFixed(1)
                  const csMin = s.duration > 0 ? (s.cs / (s.duration / 60)).toFixed(1) : '0'
                  const goldK = s.duration > 0 ? ((s.gold / s.games) / 1000).toFixed(1) : '0'
                  return (
                    <tr key={s.name} className={styles.tr}>
                      <td className={`${styles.td} ${styles.tdMuted}`}>{i + 1}</td>
                      <td className={styles.td}>
                        <div className={styles.champCell}>
                          <img src={`${DDR}/img/champion/${s.name}.png`} alt={s.name}
                            width={36} height={36} className={styles.champTableIcon}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <span className={styles.champTableName}>{s.name}</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.wlCell}>
                          <span className={styles.wBadge}>{s.wins}V</span>
                          <span className={styles.lBadge}>{losses}D</span>
                          <span className={wr >= 50 ? styles.wrGood : styles.wrBad}>{wr}%</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.kdaCell}>
                          <span className={styles.kdaCellRatio}>{kda}:1</span>
                          <span className={styles.kdaCellAvg}>{avgK2} / <span className={styles.kdaCellD}>{avgD2}</span> / {avgA2}</span>
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{csMin}/m</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{goldK}k</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{s.double || '—'}</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{s.triple || '—'}</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{s.quadra || '—'}</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{s.penta || '—'}</td>
                    </tr>
                  )
                })}
                {filteredChamps.length === 0 && (
                  <tr>
                    <td colSpan={10} className={styles.tdEmpty}>Nenhuma partida encontrada para esse filtro.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════ MAESTRIA ════════════════ */}
      {tab === 'maestria' && (
        <>
          <div className={styles.maestriaSummary}>
            <div className={styles.maestriaStat}>
              <div className={styles.maestriaStatValue}>{totalMasteryLevel}</div>
              <div className={styles.maestriaStatLabel}>Nível total de maestria</div>
            </div>
            <div className={styles.maestriaDivider} />
            <div className={styles.maestriaStat}>
              <div className={styles.maestriaStatValue}>{totalMasteryPoints.toLocaleString()}</div>
              <div className={styles.maestriaStatLabel}>Pontos totais do campeão</div>
            </div>
            <div className={styles.maestriaDivider} />
            <div className={styles.maestriaStat}>
              <div className={styles.maestriaStatValue}>{champCount}</div>
              <div className={styles.maestriaStatLabel}>Campeões com maestria</div>
            </div>
          </div>

          <div className={styles.maestriaGrid}>
            {mastery?.map((m: any) => (
              <div key={m.championId} className={styles.maestriaCard}>
                <div className={styles.maestriaImgWrapper}>
                  <img
                    src={`${DDR}/img/champion/${m.championName}.png`}
                    alt={m.championName ?? `ID ${m.championId}`}
                    width={64} height={64} className={styles.maestriaImg}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {m.championLevel >= 7 && <span className={styles.maestriaCrown}>♦</span>}
                </div>
                <div className={styles.maestriaCardName}>{m.championName ?? `ID ${m.championId}`}</div>
                <MasteryStars level={m.championLevel} />
                <div className={styles.maestriaCardPts}>{m.championPoints.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════ AO VIVO ═════════════════ */}
      {tab === 'aovivo' && (
        <div className={styles.liveTab}>
          {liveData != null ? (
            <Link to={`/lol/${region}/${gameName}/${tagLine}/aovivo`} className={styles.liveLink}>
              Ver partida ao vivo →
            </Link>
          ) : (
            <div className={styles.notInGame}>
              <div className={styles.notInGameTitle}>Jogador não está em partida</div>
              <div className={styles.notInGameSub}>Tente novamente quando o jogador estiver em uma partida ativa.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
