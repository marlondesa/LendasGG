import { useParams } from 'react-router-dom'
import { useClash } from '../../hooks/useLol'
import styles from './LolClash.module.css'

export default function LolClash() {
  const { region, gameName, tagLine } = useParams()
  const { data, isLoading, isError } = useClash(region!, gameName, tagLine)

  if (isLoading) return <p className={styles.loading}>Carregando...</p>
  if (isError || !(data as any)?.players?.length) return <p className={styles.noTeam}>Jogador não está em nenhum time de Clash.</p>

  const clashData = data as any

  return (
    <div className={styles.container}>
      <h1>Clash — {gameName}#{tagLine}</h1>

      {clashData.teams?.map((team: any) => (
        <div key={team.id} className={styles.teamCard}>
          <h2 className={styles.teamName}>{team.name}</h2>
          <p className={styles.teamInfo}>Tag: {team.tag} — Tier {team.tier}</p>
        </div>
      ))}

      <h2>Torneios Ativos</h2>
      {clashData.tournaments?.length === 0 && <p className={styles.noTournament}>Nenhum torneio ativo no momento.</p>}
      {clashData.tournaments?.map((t: any) => (
        <div key={t.id} className={styles.tournamentCard}>
          <div className={styles.tournamentName}>{t.nameKey}</div>
          <div className={styles.tournamentDate}>
            {new Date(t.schedule?.[0]?.startTime).toLocaleDateString('pt-BR')}
          </div>
        </div>
      ))}
    </div>
  )
}
