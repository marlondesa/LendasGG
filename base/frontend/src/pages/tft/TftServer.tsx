import { useState } from 'react'
import { useTftServer } from '../../hooks/useTft'
import ServerStatus from '../../components/shared/ServerStatus'
import RegionSelect from '../../components/shared/RegionSelect'
import styles from './TftServer.module.css'

export default function TftServer() {
  const [region, setRegion] = useState('br1')
  const { data, isLoading } = useTftServer(region)
  if (isLoading) return <p className={styles.loading}>Carregando...</p>

  const serverData = data as any

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Servidor TFT</h1>
        <RegionSelect value={region} onChange={setRegion} />
        <ServerStatus status={serverData} />
      </div>
      {serverData?.incidents?.length > 0 && (
        <div>
          <h2 className={styles.incidentsTitle}>Incidentes Ativos</h2>
          {serverData.incidents.map((inc: any) => (
            <div key={inc.id} className={styles.incidentCard}>
              <p>{inc.titles?.[0]?.content ?? 'Incidente em andamento'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
