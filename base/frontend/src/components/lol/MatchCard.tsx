import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Medal, Settings, Flame, Eye, Shield } from 'lucide-react'
import styles from './MatchCard.module.css'
import { keystoneImg, pathImg, KEYSTONE_NAMES, PATH_NAMES } from '../../utils/runeData'

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'

// Module-level DDragon rune tree cache
let _runesCache: any[] | null = null
let _runesFetching: Promise<any[]> | null = null
async function loadRunesData(): Promise<any[]> {
  if (_runesCache) return _runesCache
  if (!_runesFetching) {
    _runesFetching = fetch(`${DDR}/data/pt_BR/runesReforged.json`).then(r => r.json())
  }
  _runesCache = await _runesFetching
  return _runesCache!
}

function findRuneIcon(runesTree: any[], perkId: number): string | null {
  for (const path of runesTree) {
    for (const slot of path.slots) {
      for (const rune of slot.runes) {
        if (rune.id === perkId) return `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
      }
    }
  }
  return null
}

function findPathIcon(runesTree: any[], pathId: number): string | null {
  const path = runesTree.find((p: any) => p.id === pathId)
  return path ? `https://ddragon.leagueoflegends.com/cdn/img/${path.icon}` : null
}

const STAT_PERKS: Record<number, { icon: string; name: string }> = {
  5008: { icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', name: 'Força Adaptativa' },
  5005: { icon: 'perk-images/StatMods/StatModsAttackSpeedIcon.png',   name: 'Velocidade de Ataque' },
  5007: { icon: 'perk-images/StatMods/StatModsCDRScalingIcon.png',    name: 'Aceleração de Habilidade' },
  5002: { icon: 'perk-images/StatMods/StatModsArmorIcon.png',         name: 'Armadura' },
  5003: { icon: 'perk-images/StatMods/StatModsMagicResIcon.png',      name: 'Res. Mágica' },
  5001: { icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', name: 'Vida' },
}

interface ItemGroup { minute: number; items: number[] }
interface BuildData {
  itemGroups: ItemGroup[]
  skillOrder: number[]   // 1=Q 2=W 3=E 4=R
  runesTree: any[]
}

const SKILL_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Q', color: '#60a5fa' },
  2: { label: 'W', color: '#4ade80' },
  3: { label: 'E', color: '#facc15' },
  4: { label: 'R', color: '#f87171' },
}

// Summoner spell IDs → DDR name
const SPELL_MAP: Record<number, string> = {
  1: 'SummonerBoost', 3: 'SummonerExhaust', 4: 'SummonerFlash',
  6: 'SummonerHaste', 7: 'SummonerHeal', 11: 'SummonerSmite',
  12: 'SummonerTeleport', 13: 'SummonerMana', 14: 'SummonerDot',
  21: 'SummonerBarrier', 30: 'SummonerPoroRecall', 31: 'SummonerPoroThrow',
  32: 'SummonerSnowball', 39: 'SummonerSnowURFSnowball_Mark',
  54: 'Summoner_UltBookPlaceholder', 55: 'Summoner_UltBookSmitePlaceholder',
}

const QUEUE_NAMES: Record<number, string> = {
  420: 'Ranqueada Solo/Duo',
  440: 'Ranqueada Flex',
  450: 'ARAM',
  400: 'Normal Draft',
  430: 'Normal Cego',
  900: 'URF',
  1900: 'URF',
  720: 'ARAM Clash',
  0: 'Custom',
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d >= 30) return `há ${Math.floor(d / 30)} ${Math.floor(d / 30) === 1 ? 'mês' : 'meses'}`
  if (d > 0) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
  if (h > 0) return `há ${h}h`
  return `há ${m}min`
}

function ItemSlot({ id }: { id: number }) {
  if (!id) return <div className={styles.itemEmpty} />
  return (
    <img
      src={`${DDR}/img/item/${id}.png`}
      alt={`item ${id}`}
      width={28}
      height={28}
      className={styles.itemIcon}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

interface Participant {
  puuid: string
  participantId: number
  win: boolean
  kills: number
  deaths: number
  assists: number
  championName: string
  champLevel: number
  totalMinionsKilled: number
  neutralMinionsKilled: number
  visionScore: number
  totalDamageDealtToChampions: number
  goldEarned: number
  teamId: number
  item0: number; item1: number; item2: number
  item3: number; item4: number; item5: number; item6: number
  summoner1Id: number
  summoner2Id: number
  doubleKills: number
  tripleKills: number
  quadraKills: number
  pentaKills: number
  largestKillingSpree: number
  firstBloodKill: boolean
  firstBloodAssist: boolean
  wardsPlaced: number
  wardsKilled: number
  visionWardsBoughtInGame: number
  turretKills: number
  inhibitorKills: number
  riotIdGameName?: string
  riotIdTagline?: string
  summonerName?: string
  perks?: { styles: { style: number; selections: { perk: number }[] }[] }
}

interface MatchInfo {
  participants: Participant[]
  gameDuration: number
  gameCreation: number
  gameMode: string
  queueId: number
  teams: { teamId: number; win: boolean }[]
}

interface Match {
  metadata: { matchId: string }
  info: MatchInfo
}

interface MatchCardProps {
  match: Match
  puuid: string
  region: string
}

function PlayerLink({ tp, region }: { tp: Participant; region: string }) {
  const name = tp.riotIdGameName ?? tp.summonerName
  const tag = tp.riotIdTagline
  if (!name) return <span>—</span>
  if (!tag) return <span>{name}</span>
  return (
    <Link
      to={`/lol/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`}
      className={styles.playerLink}
      onClick={e => e.stopPropagation()}
    >
      <span className={styles.playerName}>{name}</span><span className={styles.playerTag}>#{tag}</span>
    </Link>
  )
}

function Donut({ blue, red, size = 72 }: { blue: number; red: number; size?: number }) {
  const total = blue + red || 1
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const bluePct = blue / total
  const cx = size / 2, cy = size / 2
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e84057" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#5383e8" strokeWidth={8}
        strokeDasharray={`${bluePct * circ} ${circ}`} />
    </svg>
  )
}

export default function MatchCard({ match, puuid, region }: MatchCardProps) {
  const info = match?.info
  const [expanded, setExpanded] = useState(false)
  const [expandedTab, setExpandedTab] = useState<'visao' | 'analise' | 'build'>('visao')
  const [buildData, setBuildData] = useState<BuildData | null>(null)
  const [buildLoading, setBuildLoading] = useState(false)

  const fetchBuild = useCallback(async () => {
    if (buildData || buildLoading) return
    setBuildLoading(true)
    try {
      const [detail, runesTree] = await Promise.all([
        fetch(`/api/lol/matches/${match.metadata.matchId}/detail`).then(r => r.json()),
        loadRunesData(),
      ])
      const allFrames: any[] = detail?.timeline?.info?.frames ?? []
      const myParticipantId = info.participants.find(x => x.puuid === puuid)?.participantId ?? 0

      // Item timeline grouped by minute
      const byMinute: Record<number, number[]> = {}
      allFrames.forEach((frame: any) => {
        frame.events?.forEach((ev: any) => {
          if (ev.type === 'ITEM_PURCHASED' && ev.participantId === myParticipantId) {
            const min = Math.floor(ev.timestamp / 60000)
            if (!byMinute[min]) byMinute[min] = []
            byMinute[min].push(ev.itemId)
          }
        })
      })
      const itemGroups: ItemGroup[] = Object.entries(byMinute)
        .map(([min, items]) => ({ minute: Number(min), items }))
        .sort((a, b) => a.minute - b.minute)

      // Skill order (1=Q 2=W 3=E 4=R, skip EVOLVE)
      const skillOrder: number[] = []
      allFrames.forEach((frame: any) => {
        frame.events?.forEach((ev: any) => {
          if (ev.type === 'SKILL_LEVEL_UP' && ev.participantId === myParticipantId && ev.levelUpType !== 'EVOLVE') {
            skillOrder.push(ev.skillSlot)
          }
        })
      })

      setBuildData({ itemGroups, skillOrder, runesTree })
    } catch (e) {
      console.error('fetchBuild error', e)
    } finally {
      setBuildLoading(false)
    }
  }, [buildData, buildLoading, match.metadata.matchId, info.participants, puuid])

  useEffect(() => {
    if (expanded && expandedTab === 'build') fetchBuild()
  }, [expanded, expandedTab, fetchBuild])
  if (!info) return null

  const p = info.participants.find(x => x.puuid === puuid)
  if (!p) return null

  const win = p.win
  const queue = QUEUE_NAMES[info.queueId] ?? info.gameMode
  const duration = `${Math.floor(info.gameDuration / 60)}m ${info.gameDuration % 60}s`
  const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)
  const csPerMin = (cs / (info.gameDuration / 60)).toFixed(1)
  const kda = p.deaths === 0 ? 'Perfect' : ((p.kills + p.assists) / p.deaths).toFixed(2) + ':1'
  const team1 = info.participants.filter(x => x.teamId === 100)
  const team2 = info.participants.filter(x => x.teamId === 200)
  const myTeam = p.teamId === 100 ? team1 : team2
  const teamKills = myTeam.reduce((acc, x) => acc + x.kills, 0)
  const kp = teamKills > 0 ? Math.round((p.kills + p.assists) / teamKills * 100) : 0
  const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6]

  // Multi-kill badge
  const multiKill = p.pentaKills > 0 ? { label: 'Penta Kill', cls: styles.badgePenta }
    : p.quadraKills > 0 ? { label: 'Quadra Kill', cls: styles.badgeQuadra }
    : p.tripleKills > 0 ? { label: 'Triple Kill', cls: styles.badgeTriple }
    : p.doubleKills > 0 ? { label: 'Double Kill', cls: styles.badgeDouble }
    : null

  const firstBlood = p.firstBloodKill || p.firstBloodAssist

  // Summoner spells
  const spell1 = SPELL_MAP[p.summoner1Id]
  const spell2 = SPELL_MAP[p.summoner2Id]

  // Runes
  const keystoneId = p.perks?.styles?.[0]?.selections?.[0]?.perk
  const secondaryPathId = p.perks?.styles?.[1]?.style
  const kImg = keystoneImg(keystoneId)
  const sImg = pathImg(secondaryPathId)
  const keystoneName = keystoneId ? (KEYSTONE_NAMES[keystoneId] ?? '') : ''
  const pathName = secondaryPathId ? (PATH_NAMES[secondaryPathId] ?? '') : ''

  // Damage bar (relative to max in game)
  const maxDmg = Math.max(...info.participants.map(x => x.totalDamageDealtToChampions))
  const dmgPct = maxDmg > 0 ? Math.round(p.totalDamageDealtToChampions / maxDmg * 100) : 0
  const dmgK = (p.totalDamageDealtToChampions / 1000).toFixed(1)

  // Fase de rotas: gold share entre times
  const team1Gold = team1.reduce((a, x) => a + (x.goldEarned ?? 0), 0)
  const team2Gold = team2.reduce((a, x) => a + (x.goldEarned ?? 0), 0)
  const totalGold = team1Gold + team2Gold
  const myTeamGold = p.teamId === 100 ? team1Gold : team2Gold
  const myGoldPct = totalGold > 0 ? Math.round(myTeamGold / totalGold * 100) : 50
  const enemyGoldPct = 100 - myGoldPct

  // Performance rank (1º–10º entre todos os 10 jogadores)
  const perfScore = (x: Participant) =>
    x.kills * 3 + x.assists - x.deaths * 2 +
    ((x.totalMinionsKilled ?? 0) + (x.neutralMinionsKilled ?? 0)) / 10 +
    x.goldEarned / 600
  const ranked = [...info.participants].sort((a, b) => perfScore(b) - perfScore(a))
  const myRank = ranked.findIndex(x => x.puuid === puuid) + 1
  const rankSuffix = 'º'
  const showMedal = myRank >= 1 && myRank <= 3

  // Skill badge
  const skillBadge =
    p.pentaKills > 0 ? { label: 'Lendário', cls: styles.skillLegendary } :
    p.quadraKills > 0 ? { label: 'Excepcional', cls: styles.skillExceptional } :
    myRank <= 2 ? { label: 'Excelente', cls: styles.skillExcellent } :
    myRank <= 4 ? { label: 'Bom', cls: styles.skillGood } :
    myRank <= 7 ? { label: 'Médio', cls: styles.skillMedium } :
    { label: 'Abaixo', cls: styles.skillBelow }

  const sortedParticipants = [...info.participants].sort((a, b) => {
    if (a.teamId !== b.teamId) return a.teamId - b.teamId
    return b.totalDamageDealtToChampions - a.totalDamageDealtToChampions
  })

  return (
    <div className={`${styles.wrapper} ${win ? styles.wrapperWin : styles.wrapperLoss}`}>
      <div className={styles.card}>
        {/* Left: result info */}
        <div className={styles.resultCol}>
          <div className={win ? styles.winLabel : styles.lossLabel}>{win ? 'Vitória' : 'Derrota'}</div>
          <div className={styles.queue}>{queue}</div>
          <div className={styles.meta}>{duration}</div>
          <div className={styles.meta}>{timeAgo(info.gameCreation)}</div>
        </div>

        {/* Champion + spells + runes */}
        <div className={styles.champCol}>
          <div className={styles.champIconWrapper}>
            <img
              src={`${DDR}/img/champion/${p.championName}.png`}
              alt={p.championName}
              width={52}
              height={52}
              className={styles.champIcon}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className={styles.champLevel}>{p.champLevel}</span>
          </div>
          <div className={styles.spellsRunes}>
            <div className={styles.spellsCol}>
              {spell1 && <img src={`${DDR}/img/spell/${spell1}.png`} alt={spell1} width={22} height={22} className={styles.spellIcon} />}
              {spell2 && <img src={`${DDR}/img/spell/${spell2}.png`} alt={spell2} width={22} height={22} className={styles.spellIcon} />}
            </div>
            <div className={styles.runesCol}>
              {kImg && (
                <img src={kImg} alt={keystoneName} title={keystoneName} width={22} height={22} className={styles.runeIcon}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              {sImg && (
                <img src={sImg} alt={pathName} title={pathName} width={22} height={22} className={styles.runeIcon}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
            </div>
          </div>
          <div className={styles.champName}>{p.championName}</div>
        </div>

        {/* KDA */}
        <div className={styles.kdaCol}>
          <div className={styles.kdaNumbers}>
            <span className={styles.kills}>{p.kills}</span>
            <span className={styles.slash}> / </span>
            <span className={styles.deaths}>{p.deaths}</span>
            <span className={styles.slash}> / </span>
            <span className={styles.assists}>{p.assists}</span>
          </div>
          <div className={styles.kdaRatio}>{kda} KDA</div>
          <div className={styles.kp}>P/Abate {kp}%</div>
          {multiKill && <div className={`${styles.multikillBadge} ${multiKill.cls}`}>{multiKill.label}</div>}
        </div>

        {/* Stats */}
        <div className={styles.statsCol}>
          <div className={styles.phaseRow}>
            <span className={styles.phaseLabel}>Fase de rotas</span>
            <span className={styles.phaseValues}>
              <span className={win ? styles.phaseMyTeam : styles.phaseEnemy}>{myGoldPct}</span>
              <span className={styles.phaseSep}>:</span>
              <span className={win ? styles.phaseEnemy : styles.phaseMyTeam}>{enemyGoldPct}</span>
            </span>
          </div>
          <div className={styles.statRow}>
            P/Abate <b>{kp}%</b>
            {firstBlood && <span className={styles.firstBloodBadge}>First Blood</span>}
          </div>
          <div className={styles.statRow}>
            CS <b>{cs}</b> <span className={styles.statMuted}>({csPerMin}/m)</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.dmgNumber}>{dmgK}k dano</span>
            <span className={styles.statMuted}> ({dmgPct}%)</span>
          </div>
          <div className={styles.dmgBar}>
            <div className={`${styles.dmgFill} ${win ? styles.dmgFillWin : styles.dmgFillLoss}`} style={{ width: `${dmgPct}%` }} />
          </div>
          <div className={styles.statRow}>
            <Eye size={12} /> {p.visionScore}
            <span className={styles.statMuted}> · {p.wardsPlaced}p/{p.wardsKilled}d</span>
            {p.visionWardsBoughtInGame > 0 && <span className={styles.controlWard}> {p.visionWardsBoughtInGame} ward</span>}
          </div>
          {(p.turretKills > 0 || p.inhibitorKills > 0) && (
            <div className={styles.statRow}>
              {p.turretKills > 0 && <span className={styles.structureBadge}><Shield size={12} /> {p.turretKills}</span>}
              {p.inhibitorKills > 0 && <span className={styles.structureBadge}><Settings size={12} /> {p.inhibitorKills}</span>}
            </div>
          )}
          {p.largestKillingSpree >= 3 && <div className={styles.streakBadge}><Flame size={12} /> Spree {p.largestKillingSpree}</div>}
          <div className={styles.rankBadges}>
            <span className={styles.perfRank}>{showMedal && <Medal size={12} />}{myRank}{rankSuffix}</span>
            <span className={`${styles.skillBadge} ${skillBadge.cls}`}>{skillBadge.label}</span>
          </div>
        </div>

        {/* Items */}
        <div className={styles.itemsCol}>
          <div className={styles.itemsRow}>
            {items.slice(0, 6).map((id, i) => <ItemSlot key={i} id={id} />)}
          </div>
          <div className={styles.trinketRow}>
            <ItemSlot id={items[6]} />
          </div>
        </div>

        {/* Teams */}
        <div className={styles.teamsCol}>
          <div className={styles.teamRow}>
            {team1.map(tp => (
              <div key={tp.puuid} className={`${styles.teamMember} ${tp.puuid === puuid ? styles.teamMemberSelf : ''}`}>
                <img
                  src={`${DDR}/img/champion/${tp.championName}.png`}
                  alt={tp.championName}
                  width={16}
                  height={16}
                  className={styles.miniChamp}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <PlayerLink tp={tp} region={region} />
              </div>
            ))}
          </div>
          <div className={styles.teamRow}>
            {team2.map(tp => (
              <div key={tp.puuid} className={`${styles.teamMember} ${tp.puuid === puuid ? styles.teamMemberSelf : ''}`}>
                <img
                  src={`${DDR}/img/champion/${tp.championName}.png`}
                  alt={tp.championName}
                  width={16}
                  height={16}
                  className={styles.miniChamp}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <PlayerLink tp={tp} region={region} />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsCol}>
          <Link to={`/lol/${region}/partida/${match.metadata.matchId}`} className={styles.detailLink}>
            Ver partida
          </Link>
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded(v => !v)}
            aria-label="Expandir"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (() => {
        // Team aggregates for Análise de Equipe
        const blueKills  = team1.reduce((a, x) => a + x.kills, 0)
        const redKills   = team2.reduce((a, x) => a + x.kills, 0)
        const blueGold   = team1.reduce((a, x) => a + x.goldEarned, 0)
        const redGold    = team2.reduce((a, x) => a + x.goldEarned, 0)
        const blueDmg    = team1.reduce((a, x) => a + x.totalDamageDealtToChampions, 0)
        const redDmg     = team2.reduce((a, x) => a + x.totalDamageDealtToChampions, 0)
        const blueCs     = team1.reduce((a, x) => a + (x.totalMinionsKilled ?? 0) + (x.neutralMinionsKilled ?? 0), 0)
        const redCs      = team2.reduce((a, x) => a + (x.totalMinionsKilled ?? 0) + (x.neutralMinionsKilled ?? 0), 0)
        const blueVision = team1.reduce((a, x) => a + x.visionScore, 0)
        const redVision  = team2.reduce((a, x) => a + x.visionScore, 0)
        const blueTowers = (info.teams.find(t => t.teamId === 100) as any)?.objectives?.tower?.kills ?? team1.reduce((a, x) => a + (x.turretKills ?? 0), 0)
        const redTowers  = (info.teams.find(t => t.teamId === 200) as any)?.objectives?.tower?.kills ?? team2.reduce((a, x) => a + (x.turretKills ?? 0), 0)

        const donuts = [
          { label: 'Abates',  blue: blueKills,  red: redKills },
          { label: 'Ouro',    blue: blueGold,   red: redGold,   fmt: (v: number) => `${(v/1000).toFixed(1)}k` },
          { label: 'Dano',    blue: blueDmg,    red: redDmg,    fmt: (v: number) => `${(v/1000).toFixed(1)}k` },
          { label: 'CS',      blue: blueCs,     red: redCs },
          { label: 'Visão',   blue: blueVision, red: redVision },
          { label: 'Torres',  blue: blueTowers, red: redTowers },
        ]

        return (
          <div className={styles.expandedTable}>
            {/* Tabs */}
            <div className={styles.expTabs}>
              {(['visao', 'analise', 'build'] as const).map(tab => (
                <button
                  key={tab}
                  className={`${styles.expTab} ${expandedTab === tab ? styles.expTabActive : ''}`}
                  onClick={() => setExpandedTab(tab)}
                >
                  {tab === 'visao' ? 'Visão Geral' : tab === 'analise' ? 'Análise de Equipe' : 'Build'}
                </button>
              ))}
            </div>

            {/* Visão Geral */}
            {expandedTab === 'visao' && [team1, team2].map((_team, ti) => (
              <div key={ti} className={styles.expandedTeam}>
                <div className={`${styles.expandedTeamHeader} ${ti === 0 ? styles.expandedBlue : styles.expandedRed}`}>
                  {ti === 0 ? 'Time Azul' : 'Time Vermelho'} — {info.teams[ti]?.win ? 'Vitória' : 'Derrota'}
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.thead}>
                      {['Campeão', 'Jogador', 'Runas', 'KDA', 'Dano', 'Wards', 'CS', 'Ouro', 'Itens'].map(h => (
                        <th key={h} className={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedParticipants.filter(x => x.teamId === (ti === 0 ? 100 : 200)).map(x => {
                      const xDmgPct = maxDmg > 0 ? Math.round(x.totalDamageDealtToChampions / maxDmg * 100) : 0
                      const xCs = (x.totalMinionsKilled ?? 0) + (x.neutralMinionsKilled ?? 0)
                      const xKId = x.perks?.styles?.[0]?.selections?.[0]?.perk
                      const xSId = x.perks?.styles?.[1]?.style
                      const xKImg = keystoneImg(xKId)
                      const xSImg = pathImg(xSId)
                      const xKName = xKId ? (KEYSTONE_NAMES[xKId] ?? '') : ''
                      const xSName = xSId ? (PATH_NAMES[xSId] ?? '') : ''
                      return (
                        <tr key={x.puuid} className={`${styles.tr} ${x.puuid === puuid ? styles.trSelf : ''}`}>
                          <td className={styles.td}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={`${DDR}/img/champion/${x.championName}.png`} alt={x.championName}
                                width={32} height={32} className={styles.tableChamp}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              <span className={styles.tableLvl}>{x.champLevel}</span>
                            </div>
                          </td>
                          <td className={styles.td}><PlayerLink tp={x} region={region} /></td>
                          <td className={styles.td}>
                            <div className={styles.tableRunes}>
                              {xKImg && (
                                <div className={styles.tableRuneItem}>
                                  <img src={xKImg} alt={xKName} title={xKName} width={24} height={24} className={styles.tableRuneIcon}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  {xKName && <span className={styles.tableRuneName}>{xKName}</span>}
                                </div>
                              )}
                              {xSImg && (
                                <div className={styles.tableRuneItem}>
                                  <img src={xSImg} alt={xSName} title={xSName} width={18} height={18} className={styles.tableRuneIcon}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  {xSName && <span className={styles.tableRuneNameSub}>{xSName}</span>}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div style={{ fontWeight: 700 }}>{x.kills}/{x.deaths}/{x.assists}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {x.deaths === 0 ? 'Perfect' : ((x.kills + x.assists) / x.deaths).toFixed(2)}:1
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{(x.totalDamageDealtToChampions / 1000).toFixed(1)}k</div>
                            <div className={styles.dmgBar} style={{ width: 60, marginTop: 2 }}>
                              <div className={`${styles.dmgFill} ${x.win ? styles.dmgFillWin : styles.dmgFillLoss}`} style={{ width: `${xDmgPct}%` }} />
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div style={{ fontSize: 12 }}>{x.visionScore} 👁</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{x.wardsPlaced}p {x.wardsKilled}d</div>
                          </td>
                          <td className={styles.td}>{xCs}</td>
                          <td className={styles.td}>{(x.goldEarned / 1000).toFixed(1)}k</td>
                          <td className={styles.td}>
                            <div className={styles.tableItems}>
                              {[x.item0,x.item1,x.item2,x.item3,x.item4,x.item5,x.item6].map((id, i) => (
                                <ItemSlot key={i} id={id} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Análise de Equipe */}
            {expandedTab === 'analise' && (
              <div className={styles.analiseWrap}>
                <div className={styles.analiseTeamLabels}>
                  <span className={styles.analiseBlue}>Time Azul</span>
                  <span className={styles.analiseRed}>Time Vermelho</span>
                </div>
                <div className={styles.analiseDonutsRow}>
                  {donuts.map(d => {
                    const fmt = d.fmt ?? ((v: number) => String(v))
                    return (
                      <div key={d.label} className={styles.analiseDonutWrap}>
                        <div className={styles.analiseDonutLabel}>{d.label}</div>
                        <Donut blue={d.blue} red={d.red} size={72} />
                        <div className={styles.analiseDonutVals}>
                          <span className={styles.analiseBlue}>{fmt(d.blue)}</span>
                          <span className={styles.analiseRed}>{fmt(d.red)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className={styles.analiseStatBars}>
                  {donuts.map(d => {
                    const fmt = d.fmt ?? ((v: number) => String(v))
                    const total = d.blue + d.red || 1
                    const bluePct = Math.round(d.blue / total * 100)
                    return (
                      <div key={d.label} className={styles.analiseStatBar}>
                        <span className={styles.analiseStatBlue}>{fmt(d.blue)}</span>
                        <div className={styles.analiseStatTrack}>
                          <div className={styles.analiseStatFillBlue} style={{ width: `${bluePct}%` }} />
                          <div className={styles.analiseStatFillRed} style={{ width: `${100 - bluePct}%` }} />
                        </div>
                        <span className={styles.analiseStatRed}>{fmt(d.red)}</span>
                        <span className={styles.analiseStatLabel}>{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Build */}
            {expandedTab === 'build' && (
              <div className={styles.buildWrap}>
                {buildLoading && <div className={styles.buildLoading}>Carregando build...</div>}
                {!buildLoading && buildData && (() => {
                  const perkStyles = p.perks?.styles ?? []
                  const primaryPathId = perkStyles[0]?.style
                  const secondaryPathId = perkStyles[1]?.style
                  const primarySelections: number[] = perkStyles[0]?.selections?.map((s: any) => s.perk) ?? []
                  const secondarySelections: number[] = perkStyles[1]?.selections?.map((s: any) => s.perk) ?? []
                  const statPerks = (p.perks as any)?.statPerks
                  const primaryPathImg = primaryPathId ? findPathIcon(buildData.runesTree, primaryPathId) : null
                  const secondaryPathImg = secondaryPathId ? findPathIcon(buildData.runesTree, secondaryPathId) : null
                  const primaryTree = buildData.runesTree.find((t: any) => t.id === primaryPathId)
                  const secondaryTree = buildData.runesTree.find((t: any) => t.id === secondaryPathId)
                  const spell1 = SPELL_MAP[p.summoner1Id]
                  const spell2 = SPELL_MAP[p.summoner2Id]
                  return (
                    <>
                      {/* ── Item Build Timeline ── */}
                      <div className={styles.buildSection}>
                        <div className={styles.buildSectionTitle}>Build de Itens</div>
                        <div className={styles.buildTimeline}>
                          {buildData.itemGroups.map((group, gi) => (
                            <div key={gi} className={styles.buildTimelineGroup}>
                              <div className={styles.buildItems}>
                                {group.items.map((id, ii) => (
                                  <img key={ii} src={`${DDR}/img/item/${id}.png`} alt={`item ${id}`}
                                    width={30} height={30} className={styles.buildItemIcon}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                ))}
                              </div>
                              <div className={styles.buildMinLabel}>{group.minute} min</div>
                              {gi < buildData.itemGroups.length - 1 && <div className={styles.buildArrow}>›</div>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Skill Order ── */}
                      <div className={styles.buildSection}>
                        <div className={styles.buildSectionTitle}>Ordem de Habilidades</div>
                        <div className={styles.skillOrderRow}>
                          {buildData.skillOrder.map((slot, i) => {
                            const sk = SKILL_LABELS[slot]
                            return (
                              <div key={i} className={styles.skillBadgeItem} style={{ background: sk?.color + '22', border: `1px solid ${sk?.color}`, color: sk?.color }}>
                                {sk?.label}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* ── Runes ── */}
                      <div className={styles.buildSection}>
                        <div className={styles.buildSectionTitle}>Runas</div>
                        <div className={styles.runesWrap}>
                          {/* Feitiços */}
                          <div className={styles.runesSpells}>
                            {spell1 && <img src={`${DDR}/img/spell/${spell1}.png`} alt={spell1} width={32} height={32} style={{ borderRadius: 6 }} />}
                            {spell2 && <img src={`${DDR}/img/spell/${spell2}.png`} alt={spell2} width={32} height={32} style={{ borderRadius: 6 }} />}
                          </div>
                          {/* Primary tree */}
                          <div className={styles.runeTree}>
                            {primaryPathImg && (
                              <div className={styles.runePathHeader}>
                                <img src={primaryPathImg} alt="" width={22} height={22} />
                                <span className={styles.runePathName}>{buildData.runesTree.find((t: any) => t.id === primaryPathId)?.name ?? ''}</span>
                              </div>
                            )}
                            {primaryTree?.slots.map((slot: any, si: number) => (
                              <div key={si} className={styles.runeSlotRow}>
                                {slot.runes.map((rune: any) => {
                                  const selected = primarySelections.includes(rune.id)
                                  const icon = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
                                  return (
                                    <img key={rune.id} src={icon} alt={rune.name} title={rune.name}
                                      width={si === 0 ? 36 : 28} height={si === 0 ? 36 : 28}
                                      className={`${styles.runeIcon} ${selected ? styles.runeSelected : styles.runeDim}`}
                                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                          {/* Secondary tree */}
                          <div className={styles.runeTree}>
                            {secondaryPathImg && (
                              <div className={styles.runePathHeader}>
                                <img src={secondaryPathImg} alt="" width={22} height={22} />
                                <span className={styles.runePathName}>{buildData.runesTree.find((t: any) => t.id === secondaryPathId)?.name ?? ''}</span>
                              </div>
                            )}
                            {secondaryTree?.slots.slice(1).map((slot: any, si: number) => (
                              <div key={si} className={styles.runeSlotRow}>
                                {slot.runes.map((rune: any) => {
                                  const selected = secondarySelections.includes(rune.id)
                                  const icon = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
                                  return (
                                    <img key={rune.id} src={icon} alt={rune.name} title={rune.name}
                                      width={28} height={28}
                                      className={`${styles.runeIcon} ${selected ? styles.runeSelected : styles.runeDim}`}
                                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                          {/* Stat shards */}
                          {statPerks && (
                            <div className={styles.runeTree}>
                              <div className={styles.runePathHeader}><span className={styles.runePathName}>Fragmentos</span></div>
                              {[statPerks.offense, statPerks.flex, statPerks.defense].map((id: number, i: number) => {
                                const sp = STAT_PERKS[id]
                                if (!sp) return null
                                return (
                                  <div key={i} className={styles.runeSlotRow}>
                                    <img src={`https://ddragon.leagueoflegends.com/cdn/img/${sp.icon}`}
                                      alt={sp.name} title={sp.name} width={24} height={24}
                                      className={`${styles.runeIcon} ${styles.runeSelected}`}
                                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                    <span className={styles.runeStatName}>{sp.name}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
