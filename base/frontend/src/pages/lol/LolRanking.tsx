import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Search } from 'lucide-react'
import { useRankingApex, useRankingEntries } from '../../hooks/useLol'
import RegionSelect from '../../components/shared/RegionSelect'
import styles from './LolRanking.module.css'

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'
const PAGE_SIZE = 50

const QUEUES = [
  { value: 'RANKED_SOLO_5x5', label: 'Ranqueada Solo/Duo' },
  { value: 'RANKED_FLEX_SR',  label: 'Ranqueada Flex' },
]

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

const APEX_TIERS  = ['challenger', 'grandmaster', 'master']
const ENTRY_TIERS = ['diamond', 'emerald', 'platinum', 'gold', 'silver', 'bronze', 'iron']


const TIER_OPTIONS = [
  { value: 'challenger',  label: 'Challenger',  apex: true  },
  { value: 'grandmaster', label: 'Grandmaster', apex: true  },
  { value: 'master',      label: 'Master',      apex: true  },
  { value: 'diamond',     label: 'Diamond',     apex: false },
  { value: 'emerald',     label: 'Emerald',     apex: false },
  { value: 'platinum',    label: 'Platinum',    apex: false },
  { value: 'gold',        label: 'Gold',        apex: false },
  { value: 'silver',      label: 'Silver',      apex: false },
  { value: 'bronze',      label: 'Bronze',      apex: false },
  { value: 'iron',        label: 'Iron',        apex: false },
]

function tierImage(tier: string) {
  const file = TIER_FILE[tier.toUpperCase()] ?? tier
  return new URL(`../../public/${file}.png`, import.meta.url).href
}

// ── Componente: linha da tabela ──────────────────────────────────────────────
function RankRow({ e, rank, region, game = 'lol' }: { e: any; rank: number; region: string; game?: string }) {
  const wr       = e.wins + e.losses > 0 ? Math.round(e.wins / (e.wins + e.losses) * 100) : 0
  const tier     = (e.tier ?? '').toUpperCase()
  const color    = TIER_COLORS[tier] ?? 'var(--text)'
  const hasId    = !!e.gameName && !!e.tagLine
  const loading  = !hasId
  const link     = hasId ? `/${game}/${region}/${encodeURIComponent(e.gameName)}/${encodeURIComponent(e.tagLine)}` : null
  const APEX     = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])
  const rankLabel = !APEX.has(tier) && e.rank ? ` ${e.rank}` : ''

  const iconEl = (
    <img
      src={`${DDR}/img/profileicon/${e.profileIconId ?? 29}.png`}
      alt="icon" width={36} height={36}
      className={`${styles.avatar} ${loading ? styles.avatarLoading : ''}`}
      onError={ev => { (ev.target as HTMLImageElement).src = `${DDR}/img/profileicon/29.png` }}
    />
  )

  return (
    <tr className={styles.row}>
      <td className={styles.tdNum}>
        <span className={rank <= 3 ? styles.rankTop : styles.rankNormal}>{rank}</span>
      </td>
      <td className={styles.td}>
        {link ? (
          <Link to={link} className={styles.playerLink}>
            {iconEl}
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>{e.gameName}</span>
              <span className={styles.playerTag}>#{e.tagLine}</span>
            </div>
          </Link>
        ) : (
          <div className={styles.playerLink}>
            {iconEl}
            <div className={styles.playerInfo}>
              <span className={styles.playerMuted}>
                {e.summonerName ?? <span className={styles.skeletonText} />}
              </span>
              <span className={styles.loadingTag}>carregando...</span>
            </div>
          </div>
        )}
      </td>
      <td className={styles.td}>
        <div className={styles.tierCell}>
          <img src={tierImage(tier || 'iron')} alt={tier} width={28} height={28}
            onError={ev => { (ev.target as HTMLImageElement).style.display = 'none' }} />
          <span style={{ color, fontWeight: 700, fontSize: 13 }}>
            {tier ? tier.charAt(0) + tier.slice(1).toLowerCase() : '—'}{rankLabel}
          </span>
        </div>
      </td>
      <td className={styles.tdLp}>{e.leaguePoints?.toLocaleString() ?? '—'}</td>
      <td className={styles.td}>
        <div className={styles.wrCell}>
          <div className={styles.wrBadges}>
            <span className={styles.wBadge}>{e.wins}V</span>
            <span className={styles.lBadge}>{e.losses}D</span>
            <span className={wr >= 50 ? styles.wrGood : styles.wrBad}>{wr}%</span>
          </div>
          <div className={styles.wrBar}>
            <div className={`${styles.wrFill} ${wr >= 50 ? styles.wrFillGood : styles.wrFillBad}`}
              style={{ width: `${wr}%` }} />
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Componente: seção de tier de entrada (Diamond–Iron) ──────────────────────
function EntryTierSection({ region, queue, tier, search, page, onTotalChange }:
  { region: string; queue: string; tier: string; search: string; page: number; onTotalChange: (n: number) => void }) {

  const q1 = useRankingEntries(region, queue, tier, 'I')
  const q2 = useRankingEntries(region, queue, tier, 'II')
  const q3 = useRankingEntries(region, queue, tier, 'III')
  const q4 = useRankingEntries(region, queue, tier, 'IV')

  const isLoading = q1.isLoading || q2.isLoading || q3.isLoading || q4.isLoading

  const all: any[] = [
    ...((q1.data as any[]) ?? []),
    ...((q2.data as any[]) ?? []),
    ...((q3.data as any[]) ?? []),
    ...((q4.data as any[]) ?? []),
  ].sort((a, b) => {
    const divOrder = { I: 0, II: 1, III: 2, IV: 3 } as Record<string, number>
    const da = divOrder[a.rank] ?? 4, db = divOrder[b.rank] ?? 4
    if (da !== db) return da - db
    return b.leaguePoints - a.leaguePoints
  }).map(e => ({ ...e, tier: tier.toUpperCase() }))

  const filtered = search.trim()
    ? all.filter(e =>
        `${e.gameName ?? ''}#${e.tagLine ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
        `${e.summonerName ?? ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : all

  // Notifica o total para paginação
  if (filtered.length !== 0) onTotalChange(filtered.length)

  const entries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (isLoading) return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className={styles.row}>
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className={styles.td}><div className={styles.skeleton} /></td>
          ))}
        </tr>
      ))}
    </>
  )

  return (
    <>
      {entries.map((e: any, i: number) => (
        <RankRow key={e.summonerId ?? i} e={e} rank={(page - 1) * PAGE_SIZE + i + 1} region={region} />
      ))}
    </>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function LolRanking() {
  const [region,       setRegion]       = useState('br1')
  const [queue,        setQueue]        = useState('RANKED_SOLO_5x5')
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [tierOpen,     setTierOpen]     = useState(false)
  const [selectedTier, setSelectedTier] = useState('challenger')
  const [entryTotal,   setEntryTotal]   = useState(0)

  const isApex    = APEX_TIERS.includes(selectedTier)
  const isEntry   = ENTRY_TIERS.includes(selectedTier)

  // Carrega apenas o tier selecionado — evita 3 enriquecimentos simultâneos
  const { data: apexData, isLoading: apexLoading } = useRankingApex(
    region, queue, selectedTier,
  )

  const apexEntries   = (apexData as any)?.entries ?? []
  const chalEntries   = selectedTier === 'challenger'  ? apexEntries : []
  const gmEntries     = selectedTier === 'grandmaster' ? apexEntries : []
  const loadC  = selectedTier === 'challenger'  && apexLoading
  const loadGM = selectedTier === 'grandmaster' && apexLoading
  const loadM  = selectedTier === 'master'      && apexLoading

  const filteredApex = search.trim()
    ? apexEntries.filter((e: any) =>
        `${e.gameName ?? ''}#${e.tagLine ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
        (e.summonerName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : apexEntries

  const apexTotal  = filteredApex.length
  const apexPages  = Math.ceil(apexTotal / PAGE_SIZE)
  const apexSlice  = filteredApex.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const entryPages = Math.ceil(entryTotal / PAGE_SIZE)
  const totalPages = isApex ? apexPages : entryPages

  function handleQueue(q: string) { setQueue(q); setPage(1) }
  function handleRegion(r: string) { setRegion(r); setPage(1) }
  function handleTier(t: string)  { setSelectedTier(t); setTierOpen(false); setPage(1) }

  const currentOption = TIER_OPTIONS.find(t => t.value === selectedTier)

  return (
    <div className={styles.container}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <RegionSelect value={region} onChange={handleRegion} />

          <div className={styles.dropdownWrap}>
            <button className={styles.dropdownBtn} onClick={() => setTierOpen(v => !v)}>
              {currentOption && (
                <img src={tierImage(currentOption.value)} alt="" width={18} height={18}
                  className={styles.dropdownTierImg} />
              )}
              {currentOption?.label ?? 'Tier'}
              <ChevronDown size={14} />
            </button>
            {tierOpen && (
              <div className={styles.dropdownMenu}>
                {TIER_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    className={`${styles.dropdownItem} ${selectedTier === t.value ? styles.dropdownItemActive : ''}`}
                    onClick={() => handleTier(t.value)}
                  >
                    <img src={tierImage(t.value)} alt={t.value} width={18} height={18}
                      className={styles.dropdownTierImg} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pills */}
        <div className={styles.statsPills}>
          {!loadC && chalEntries.length > 0 && (
            <div className={styles.statPill}>
              <img src={tierImage('challenger')} alt="challenger" width={18} height={18} />
              <span className={styles.statLp} style={{ color: TIER_COLORS['CHALLENGER'] }}>
                {chalEntries[0]?.leaguePoints?.toLocaleString()} LP
              </span>
              <span className={styles.statCount}>{chalEntries.length} invocadores</span>
            </div>
          )}
          {!loadGM && gmEntries.length > 0 && (
            <div className={styles.statPill}>
              <img src={tierImage('grandmaster')} alt="grandmaster" width={18} height={18} />
              <span className={styles.statLp} style={{ color: TIER_COLORS['GRANDMASTER'] }}>
                {gmEntries[0]?.leaguePoints?.toLocaleString()} LP
              </span>
              <span className={styles.statCount}>{gmEntries.length} invocadores</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Nome do jogo #Tag"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* ── Queue tabs ── */}
      <div className={styles.queueTabs}>
        {QUEUES.map(q => (
          <button key={q.value}
            className={`${styles.queueTab} ${queue === q.value ? styles.queueTabActive : ''}`}
            onClick={() => handleQueue(q.value)}>
            {q.label}
          </button>
        ))}
      </div>

      {/* ── Info bar ── */}
      {(() => {
        const entries = isApex ? apexEntries : []
        const enriched = entries.filter((e: any) => !!e.gameName).length
        const total = entries.length
        const pct = total > 0 ? Math.round(enriched / total * 100) : 0
        const stillLoading = total > 0 && enriched < total
        return (
          <div className={styles.infoBar}>
            {isApex && <span>{apexTotal.toLocaleString()} invocadores</span>}
            {isEntry && entryTotal > 0 && <span>{entryTotal.toLocaleString()} invocadores</span>}
            {(loadC || loadGM || loadM) && <span className={styles.loadingDot}>carregando...</span>}
            {isApex && stillLoading && (
              <div className={styles.enrichProgress}>
                <span className={styles.enrichLabel}>{enriched}/{total} perfis carregados</span>
                <div className={styles.enrichBar}>
                  <div className={styles.enrichFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.thead}>
              <th className={styles.th} style={{ width: 48 }}>#</th>
              <th className={styles.th}>Invocador</th>
              <th className={styles.th}>Tier</th>
              <th className={styles.th}>LP</th>
              <th className={styles.th}>Taxa de vitória</th>
            </tr>
          </thead>
          <tbody>
            {isApex && (
              apexLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className={styles.row}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className={styles.td}><div className={styles.skeleton} /></td>
                      ))}
                    </tr>
                  ))
                : apexSlice.map((e: any, i: number) => (
                    <RankRow key={e.summonerId ?? i} e={e}
                      rank={(page - 1) * PAGE_SIZE + i + 1} region={region} />
                  ))
            )}
            {isEntry && (
              <EntryTierSection
                region={region}
                queue={queue}
                tier={selectedTier}
                search={search}
                page={page}
                onTotalChange={setEntryTotal}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | '...')[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) => p === '...'
              ? <span key={`d${i}`} className={styles.pageDots}>…</span>
              : <button key={p} className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(p as number)}>{p}</button>
            )}
          <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </div>
  )
}
