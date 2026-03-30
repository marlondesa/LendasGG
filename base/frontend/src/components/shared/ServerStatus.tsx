import styles from './ServerStatus.module.css'

interface ServerStatusProps {
  status?: {
    maintenances?: unknown[]
    incidents?: unknown[]
  }
}

export default function ServerStatus({ status }: ServerStatusProps) {
  const online = status?.maintenances?.length === 0 && status?.incidents?.length === 0
  return (
    <span className={`${styles.badge} ${online ? styles.online : styles.offline}`}>
      {online ? 'Online' : 'Com problemas'}
    </span>
  )
}
