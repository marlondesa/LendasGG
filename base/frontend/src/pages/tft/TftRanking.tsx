import { useState } from 'react'
import { useTftRankingApex } from '../../hooks/useTft'
import RankingTable from '../../components/lol/RankingTable'
import RegionSelect from '../../components/shared/RegionSelect'
import styles from './TftRanking.module.css'

const TIERS = ['challenger', 'grandmaster', 'master']
const PAGE_SIZE = 50

export default function TftRanking() {
  const [region, setRegion] = useState('br1')
  const [tier, setTier] = useState('challenger')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useTftRankingApex(region, tier)

  const allEntries = (data as any)?.entries ?? []
  const totalPages = Math.ceil(allEntries.length / PAGE_SIZE)
  const entries = allEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleTier(t: string) { setTier(t); setPage(1) }
  function handleRegion(r: string) { setRegion(r); setPage(1) }

  return (
    <div className={styles.container}>
      <h1>Ranking TFT</h1>

      <div className={styles.filters}>
        <RegionSelect value={region} onChange={handleRegion} />
        {TIERS.map(t => (
          <button
            key={t}
            onClick={() => handleTier(t)}
            className={`${styles.tierBtn} ${tier === t ? styles.tierBtnActive : styles.tierBtnInactive}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className={styles.loading}>Carregando...</p>
      ) : (
        <>
          <div className={styles.tableInfo}>
            {allEntries.length} jogadores — página {page} de {totalPages}
          </div>
          <RankingTable
            entries={entries}
            tier={(data as any)?.tier}
            region={region}
            game="tft"
            offset={(page - 1) * PAGE_SIZE}
          />
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className={styles.pageDots}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ''}`}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
