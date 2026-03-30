import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useServer } from '../../hooks/useLol'
import ServerStatus from '../../components/shared/ServerStatus'
import RegionSelect from '../../components/shared/RegionSelect'
import styles from './LolServer.module.css'

const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function useChampMap() {
  return useQuery({
    queryKey: ['ddr', 'champMap'],
    queryFn: () =>
      fetch(`${DDR}/data/pt_BR/champion.json`)
        .then(r => r.json())
        .then((d: any) => {
          const map: Record<number, { name: string; img: string }> = {}
          for (const champ of Object.values(d.data) as any[]) {
            map[Number(champ.key)] = {
              name: champ.name,
              img: `${DDR}/img/champion/${champ.image.full}`,
            }
          }
          return map
        }),
    staleTime: Infinity,
  })
}

function ChampGrid({ ids, champMap, cardClass }: {
  ids: number[]
  champMap: Record<number, { name: string; img: string }> | undefined
  cardClass?: string
}) {
  return (
    <div className={styles.freeChamps}>
      {ids.map((id) => {
        const champ = champMap?.[id]
        return (
          <div key={id} className={`${styles.champCard} ${cardClass ?? ''}`}>
            {champ
              ? <img src={champ.img} alt={champ.name} className={styles.champIcon}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }} />
              : <div className={styles.champIconPlaceholder} />
            }
            <div className={styles.champName}>{champ?.name ?? `ID ${id}`}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function LolServer() {
  const [region, setRegion] = useState('br1')

  const { data: serverData, isLoading: loadingServer } = useServer(region)
  const { data: champMap } = useChampMap()

  const server = serverData as any
  const freeChamps: number[] = server?.rotations?.freeChampionIds ?? []
  const newPlayerChamps: number[] = server?.rotations?.freeChampionIdsForNewPlayers ?? []
  const maintenances: any[] = server?.status?.maintenances ?? []
  const incidents: any[] = server?.status?.incidents ?? []

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Servidor LoL</h1>
        <RegionSelect value={region} onChange={setRegion} />
        <ServerStatus status={server?.status} />
      </div>

      {/* ── Rotação de campeões ── */}
      {loadingServer
        ? <p className={styles.loading}>Carregando rotação...</p>
        : (
          <div className={styles.sectionsRow}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Campeões Gratuitos da Semana</h2>
              <ChampGrid ids={freeChamps} champMap={champMap} />
            </div>
            {newPlayerChamps.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Campeões para Novos Jogadores</h2>
                <ChampGrid ids={newPlayerChamps} champMap={champMap} cardClass={styles.champCardNew} />
              </div>
            )}
          </div>
        )
      }

      {/* ── Manutenções e Incidentes ── */}
      {!loadingServer && (maintenances.length > 0 || incidents.length > 0) && (
        <div className={styles.statusSection}>
          <h2 className={styles.sectionTitle}>⚠ Status do Servidor</h2>

          {maintenances.length > 0 && (
            <div className={styles.statusGroup}>
              <div className={styles.statusGroupTitle}>Manutenções</div>
              {maintenances.map((m: any) => (
                <div key={m.id} className={`${styles.statusCard} ${styles.statusMaintenance}`}>
                  <div className={styles.statusCardTitle}>{m.titles?.[0]?.content ?? 'Manutenção programada'}</div>
                  {m.maintenance_status && <div className={styles.statusBadge}>{m.maintenance_status}</div>}
                  {m.updated_at && <div className={styles.statusDate}>Atualizado: {fmtDate(new Date(m.updated_at).getTime())}</div>}
                </div>
              ))}
            </div>
          )}

          {incidents.length > 0 && (
            <div className={styles.statusGroup}>
              <div className={styles.statusGroupTitle}>Incidentes</div>
              {incidents.map((inc: any) => (
                <div key={inc.id} className={`${styles.statusCard} ${styles.statusIncident}`}>
                  <div className={styles.statusCardTitle}>{inc.titles?.[0]?.content ?? 'Incidente em andamento'}</div>
                  {inc.incident_severity && <div className={`${styles.statusBadge} ${styles.badgeSeverity}`}>{inc.incident_severity}</div>}
                  {inc.updated_at && <div className={styles.statusDate}>Atualizado: {fmtDate(new Date(inc.updated_at).getTime())}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
