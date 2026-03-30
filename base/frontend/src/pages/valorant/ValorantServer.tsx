import { useState } from 'react'
import { useValServer } from '../../hooks/useValorant'
import ServerStatus from '../../components/shared/ServerStatus'
import RegionSelect from '../../components/shared/RegionSelect'
import styles from './ValorantServer.module.css'

export default function ValorantServer() {
  const [region, setRegion] = useState('br1')
  const { data, isLoading } = useValServer(region)
  if (isLoading) return <p className={styles.loading}>Carregando...</p>

  const serverData = data as any
  const agents = serverData?.content?.characters?.filter((c: any) => c.localizedNames) ?? []

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Servidor Valorant</h1>
        <RegionSelect value={region} onChange={setRegion} />
        <ServerStatus status={serverData?.status} />
      </div>

      <h2>Agentes Disponíveis ({agents.length})</h2>
      <div className={styles.agentList}>
        {agents.slice(0, 30).map((a: any) => (
          <span key={a.id} className={styles.agentTag}>
            {a.localizedNames?.['pt-BR'] ?? a.name}
          </span>
        ))}
      </div>
    </div>
  )
}
