import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMatchDetail } from '../../hooks/useLol'
import styles from './LolMatch.module.css'

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'

type Tab = 'visao' | 'equipe' | 'timeline'
type TimelineFilter = 'kills' | 'towers' | 'objectives'

// ── Item tooltip ──────────────────────────────────────────────────────────────

function useItems() {
  const [items, setItems] = useState<Record<string, { name: string; description: string; gold: { total: number } }>>({})
  useEffect(() => {
    fetch(`${DDR}/data/pt_BR/item.json`)
      .then(r => r.json())
      .then(d => setItems(d.data))
      .catch(() => {})
  }, [])
  return items
}

function ItemSlot({ id, items }: { id: number; items: Record<string, any> }) {
  if (!id) return <div className={styles.itemEmpty} />
  const item = items[String(id)]
  return (
    <div className={styles.itemWrap} title={item ? `${item.name}\n${item.gold?.total?.toLocaleString() ?? ''}g` : ''}>
      <img
        src={`${DDR}/img/item/${id}.png`}
        width={28} height={28}
        className={styles.itemIcon}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        alt=""
      />
      {item && <div className={styles.itemTooltip}>
        <div className={styles.tooltipName}>{item.name}</div>
        {item.gold?.total > 0 && <div className={styles.tooltipGold}>{item.gold.total.toLocaleString()}g</div>}
        <div className={styles.tooltipDesc} dangerouslySetInnerHTML={{ __html: item.description.replace(/<[^>]*>/g, '') }} />
      </div>}
    </div>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function Donut({ blue, red, label }: { blue: number; red: number; label: string }) {
  const total = blue + red || 1
  const pct = Math.round((blue / total) * 100)
  const circ = 100
  const blueArc = (blue / total) * circ
  const r = 15.91, cx = 18, cy = 18
  const circumference = 2 * Math.PI * r
  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 36 36" width={90} height={90}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fca5a5" strokeWidth={3.5} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#93c5fd" strokeWidth={3.5}
          strokeDasharray={`${(blueArc / 100) * circumference} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 1} textAnchor="middle" fontSize={7} fontWeight={700} fill="#1e293b">{pct}%</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize={5} fill="#64748b">{(blue + red).toLocaleString()}</text>
      </svg>
      <div className={styles.donutLabel}>{label}</div>
      <div className={styles.donutValues}>
        <span className={styles.donutBlue}>{blue.toLocaleString()}</span>
        <span className={styles.donutRed}>{red.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LolMatch() {
  const { region, matchId } = useParams()
  const { data, isLoading, isError } = useMatchDetail(region!, matchId)
  const itemData = useItems()
  const [tab, setTab] = useState<Tab>('visao')
  const [tlFilter, setTlFilter] = useState<TimelineFilter>('kills')

  if (isLoading) return <p className={styles.loading}>Carregando partida...</p>
  if (isError || !data) return <p className={styles.error}>Partida não encontrada.</p>

  const { match, timeline } = data as any
  const info = match?.info
  const participants: any[] = info.participants
  const blue = participants.filter((p: any) => p.teamId === 100)
  const red  = participants.filter((p: any) => p.teamId === 200)
  const blueWin = info.teams[0]?.win
  const dur = `${Math.floor(info.gameDuration / 60)}m ${info.gameDuration % 60}s`

  // totals per team
  function teamSum(team: any[], field: string) { return team.reduce((a, p) => a + (p[field] ?? 0), 0) }
  const blueKills = teamSum(blue, 'kills')
  const redKills  = teamSum(red,  'kills')
  const blueGold  = teamSum(blue, 'goldEarned')
  const redGold   = teamSum(red,  'goldEarned')
  const blueDmg   = teamSum(blue, 'totalDamageDealtToChampions')
  const redDmg    = teamSum(red,  'totalDamageDealtToChampions')
  const blueCs    = teamSum(blue, 'totalMinionsKilled') + teamSum(blue, 'neutralMinionsKilled')
  const redCs     = teamSum(red,  'totalMinionsKilled') + teamSum(red,  'neutralMinionsKilled')
  const blueWards = teamSum(blue, 'wardsPlaced')
  const redWards  = teamSum(red,  'wardsPlaced')
  const blueTowers = info.teams[0]?.objectives?.tower?.kills ?? 0
  const redTowers  = info.teams[1]?.objectives?.tower?.kills ?? 0

  // max damage for bar
  const maxDmg = Math.max(...participants.map((p: any) => p.totalDamageDealtToChampions))

  // participantId → participant map (for timeline)
  const pidMap: Record<number, any> = {}
  participants.forEach((p: any) => { pidMap[p.participantId] = p })

  // timeline events
  const allFrames: any[] = timeline?.info?.frames ?? []
  const killEvents: any[] = []
  const towerEvents: any[] = []
  const objectiveEvents: any[] = []

  allFrames.forEach((frame: any) => {
    ;(frame.events ?? []).forEach((ev: any) => {
      const min = Math.floor(ev.timestamp / 60000)
      if (ev.type === 'CHAMPION_KILL') {
        const killer = pidMap[ev.killerId]
        const victim = pidMap[ev.victimId]
        if (killer && victim) killEvents.push({ min, killer, victim, assists: ev.assistingParticipantIds ?? [] })
      } else if (ev.type === 'BUILDING_KILL') {
        towerEvents.push({ min, teamId: ev.teamId, laneType: ev.laneType, buildingType: ev.buildingType })
      } else if (ev.type === 'ELITE_MONSTER_KILL') {
        const killer = pidMap[ev.killerId]
        if (killer) objectiveEvents.push({ min, monsterType: ev.monsterType, killer })
      }
    })
  })

  const maxMin = Math.ceil(info.gameDuration / 60)
  const minutes = Array.from({ length: maxMin + 1 }, (_, i) => i)

  function laneLabel(lane: string) {
    return { TOP_LANE: 'Top', MID_LANE: 'Mid', BOT_LANE: 'Bot', JUNGLE: 'Jungle' }[lane] ?? lane
  }
  function monsterLabel(m: string) {
    return { DRAGON: 'Dragão', BARON_NASHOR: 'Barão', RIFTHERALD: 'Arauto', HORDE: 'Grubs' }[m] ?? m
  }

  function TeamTable({ team, win }: { team: any[]; win: boolean }) {
    return (
      <div className={styles.teamSection}>
        <div className={`${styles.teamHeader} ${win ? styles.teamHeaderWin : styles.teamHeaderLoss}`}>
          {win ? 'Vitória' : 'Derrota'} — {win === blueWin ? 'Time Azul' : 'Time Vermelho'}
          <span className={styles.teamKills}>{win === blueWin ? blueKills : redKills} abates · {win === blueWin ? blueTowers : redTowers} torres · {((win === blueWin ? blueGold : redGold) / 1000).toFixed(1)}k ouro</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr className={styles.thead}>
              <th className={styles.th}>Campeão</th>
              <th className={styles.th}>Jogador</th>
              <th className={styles.th}>KDA</th>
              <th className={styles.th}>Dano</th>
              <th className={styles.th}>Ouro</th>
              <th className={styles.th}>CS</th>
              <th className={styles.th}>Visão</th>
              <th className={styles.th}>Itens</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p: any) => {
              const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)
              const dmgPct = maxDmg > 0 ? (p.totalDamageDealtToChampions / maxDmg) * 100 : 0
              const itemIds = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5]
              const kda = p.deaths === 0 ? 'Perfect' : ((p.kills + p.assists) / p.deaths).toFixed(2)
              const name = p.riotIdGameName ?? p.summonerName ?? '—'
              const tag  = p.riotIdTagline
              return (
                <tr key={p.puuid} className={`${styles.row} ${p.win ? styles.rowWin : styles.rowLoss}`}>
                  <td className={styles.td}>
                    <div className={styles.champCell}>
                      <img src={`${DDR}/img/champion/${p.championName}.png`} width={34} height={34} className={styles.champIcon} alt={p.championName} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <span className={styles.champLvl}>{p.champLevel}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {tag
                      ? <Link to={`/lol/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`} className={styles.playerLink}>{name}<span className={styles.playerTag}>#{tag}</span></Link>
                      : <span className={styles.playerLink}>{name}</span>
                    }
                  </td>
                  <td className={styles.td}>
                    <div className={styles.kdaCell}>
                      <span className={styles.kdaNum}><span className={styles.kills}>{p.kills}</span>/<span className={styles.deaths}>{p.deaths}</span>/<span className={styles.assists}>{p.assists}</span></span>
                      <span className={styles.kdaRatio}>{kda} KDA</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.dmgCell}>
                      <span className={styles.dmgNum}>{(p.totalDamageDealtToChampions / 1000).toFixed(1)}k</span>
                      <div className={styles.dmgBar}><div className={`${styles.dmgFill} ${p.win ? styles.dmgWin : styles.dmgLoss}`} style={{ width: `${dmgPct}%` }} /></div>
                    </div>
                  </td>
                  <td className={styles.td}><span className={styles.goldNum}>{(p.goldEarned / 1000).toFixed(1)}k</span></td>
                  <td className={styles.td}>{cs}</td>
                  <td className={styles.td}>{p.visionScore}</td>
                  <td className={styles.td}>
                    <div className={styles.itemsRow}>
                      {itemIds.map((id, i) => <ItemSlot key={i} id={id} items={itemData} />)}
                      <ItemSlot id={p.item6} items={itemData} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to={`/lol/${region}/`} className={styles.backLink}>← Voltar</Link>
          <span className={styles.gameMode}>{info.gameMode}</span>
          <span className={styles.gameDur}>{dur}</span>
          <span className={styles.gameDate}>{new Date(info.gameStartTimestamp).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className={styles.scoreBar}>
          <div className={`${styles.scoreTeam} ${styles.scoreBlue}`}>
            <span className={styles.scoreKills}>{blueKills}</span>
            <span className={styles.scoreLabel}>{blueWin ? 'Vitória' : 'Derrota'}</span>
          </div>
          <span className={styles.scoreSep}>:</span>
          <div className={`${styles.scoreTeam} ${styles.scoreRed}`}>
            <span className={styles.scoreLabel}>{!blueWin ? 'Vitória' : 'Derrota'}</span>
            <span className={styles.scoreKills}>{redKills}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {(['visao', 'equipe', 'timeline'] as Tab[]).map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {{ visao: 'Visão Geral', equipe: 'Análise de Equipe', timeline: 'Linha do Tempo' }[t]}
          </button>
        ))}
      </div>

      {/* ── Visão Geral ── */}
      {tab === 'visao' && (
        <div>
          <TeamTable team={blue} win={blueWin} />
          <TeamTable team={red}  win={!blueWin} />
        </div>
      )}

      {/* ── Análise de Equipe ── */}
      {tab === 'equipe' && (
        <div className={styles.equipeGrid}>
          <div className={styles.equipeLabels}>
            <span className={styles.labelBlue}>Time Azul</span>
            <span className={styles.labelRed}>Time Vermelho</span>
          </div>
          <div className={styles.donutsRow}>
            <Donut blue={blueKills}  red={redKills}  label="Abates" />
            <Donut blue={blueGold}   red={redGold}   label="Ouro" />
            <Donut blue={blueDmg}    red={redDmg}    label="Dano" />
            <Donut blue={blueCs}     red={redCs}     label="CS" />
            <Donut blue={blueWards}  red={redWards}  label="Vigias" />
            <Donut blue={blueTowers} red={redTowers} label="Torres" />
          </div>

          <div className={styles.statBarsSection}>
            {[
              { label: 'Ouro Total',  blue: blueGold,   red: redGold   },
              { label: 'Dano Total',  blue: blueDmg,    red: redDmg    },
              { label: 'CS Total',    blue: blueCs,     red: redCs     },
              { label: 'Vigias',      blue: blueWards,  red: redWards  },
              { label: 'Torres',      blue: blueTowers, red: redTowers },
            ].map(({ label, blue: b, red: r }) => {
              const total = b + r || 1
              return (
                <div key={label} className={styles.statBar}>
                  <span className={styles.statBarBlue}>{b.toLocaleString()}</span>
                  <div className={styles.statBarTrack}>
                    <div className={styles.statBarFillBlue} style={{ width: `${(b / total) * 100}%` }} />
                    <div className={styles.statBarFillRed}  style={{ width: `${(r / total) * 100}%` }} />
                  </div>
                  <span className={styles.statBarRed}>{r.toLocaleString()}</span>
                  <span className={styles.statBarLabel}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Linha do Tempo ── */}
      {tab === 'timeline' && (
        <div className={styles.timelineSection}>
          <div className={styles.tlFilters}>
            <button className={`${styles.tlBtn} ${tlFilter === 'kills' ? styles.tlBtnActive : ''}`} onClick={() => setTlFilter('kills')}>Abates</button>
            <button className={`${styles.tlBtn} ${tlFilter === 'towers' ? styles.tlBtnActive : ''}`} onClick={() => setTlFilter('towers')}>Torres</button>
            <button className={`${styles.tlBtn} ${tlFilter === 'objectives' ? styles.tlBtnActive : ''}`} onClick={() => setTlFilter('objectives')}>Objetivos</button>
          </div>

          <div className={styles.tlTrack}>
            <div className={styles.tlMinutes}>
              {minutes.filter(m => m % 5 === 0).map(m => (
                <span key={m} className={styles.tlMin} style={{ left: `${(m / maxMin) * 100}%` }}>{m}m</span>
              ))}
            </div>
            <div className={styles.tlLine} />

            {tlFilter === 'kills' && killEvents.map((ev, i) => (
              <div key={i} className={`${styles.tlEvent} ${ev.killer.teamId === 100 ? styles.tlBlue : styles.tlRed}`}
                style={{ left: `${(ev.min / maxMin) * 100}%` }}
                title={`${ev.killer.riotIdGameName ?? ev.killer.summonerName} abateu ${ev.victim.riotIdGameName ?? ev.victim.summonerName} (${ev.min}m)`}
              >
                <img src={`${DDR}/img/champion/${ev.killer.championName}.png`} width={20} height={20} className={styles.tlChamp} alt="" />
              </div>
            ))}

            {tlFilter === 'towers' && towerEvents.map((ev, i) => (
              <div key={i} className={`${styles.tlEvent} ${ev.teamId === 200 ? styles.tlBlue : styles.tlRed}`}
                style={{ left: `${(ev.min / maxMin) * 100}%` }}
                title={`Torre ${laneLabel(ev.laneType)} derrubada (${ev.min}m)`}
              >
                <span className={styles.tlTower}>T</span>
              </div>
            ))}

            {tlFilter === 'objectives' && objectiveEvents.map((ev, i) => (
              <div key={i} className={`${styles.tlEvent} ${ev.killer.teamId === 100 ? styles.tlBlue : styles.tlRed}`}
                style={{ left: `${(ev.min / maxMin) * 100}%` }}
                title={`${monsterLabel(ev.monsterType)} — ${ev.killer.riotIdGameName ?? ev.killer.summonerName} (${ev.min}m)`}
              >
                <span className={styles.tlObj}>{ev.monsterType === 'BARON_NASHOR' ? 'B' : ev.monsterType === 'DRAGON' ? 'D' : 'A'}</span>
              </div>
            ))}
          </div>

          {/* Event log */}
          <div className={styles.tlLog}>
            {tlFilter === 'kills' && killEvents.map((ev, i) => (
              <div key={i} className={`${styles.tlLogRow} ${ev.killer.teamId === 100 ? styles.tlLogBlue : styles.tlLogRed}`}>
                <span className={styles.tlLogMin}>{ev.min}m</span>
                <img src={`${DDR}/img/champion/${ev.killer.championName}.png`} width={22} height={22} className={styles.tlChamp} alt="" />
                <span className={styles.tlKiller}>{ev.killer.riotIdGameName ?? ev.killer.summonerName}<span className={styles.tlTag}>#{ev.killer.riotIdTagline}</span></span>
                <span className={styles.tlVerb}>abateu</span>
                <img src={`${DDR}/img/champion/${ev.victim.championName}.png`} width={22} height={22} className={styles.tlChamp} alt="" />
                <span className={styles.tlVictim}>{ev.victim.riotIdGameName ?? ev.victim.summonerName}<span className={styles.tlTag}>#{ev.victim.riotIdTagline}</span></span>
                {ev.assists.length > 0 && <span className={styles.tlAssists}>+{ev.assists.length} assist.</span>}
              </div>
            ))}
            {tlFilter === 'towers' && towerEvents.map((ev, i) => (
              <div key={i} className={`${styles.tlLogRow} ${ev.teamId === 200 ? styles.tlLogBlue : styles.tlLogRed}`}>
                <span className={styles.tlLogMin}>{ev.min}m</span>
                <span className={styles.tlTowerLog}>Torre {laneLabel(ev.laneType)} derrubada pelo {ev.teamId === 100 ? 'Time Azul' : 'Time Vermelho'}</span>
              </div>
            ))}
            {tlFilter === 'objectives' && objectiveEvents.map((ev, i) => (
              <div key={i} className={`${styles.tlLogRow} ${ev.killer.teamId === 100 ? styles.tlLogBlue : styles.tlLogRed}`}>
                <span className={styles.tlLogMin}>{ev.min}m</span>
                <img src={`${DDR}/img/champion/${ev.killer.championName}.png`} width={22} height={22} className={styles.tlChamp} alt="" />
                <span className={styles.tlKiller}>{ev.killer.riotIdGameName ?? ev.killer.summonerName}</span>
                <span className={styles.tlVerb}>matou</span>
                <span className={styles.tlObj2}>{monsterLabel(ev.monsterType)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
