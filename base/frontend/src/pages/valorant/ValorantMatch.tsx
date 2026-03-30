import { useParams } from 'react-router-dom'
import { useValMatchDetail } from '../../hooks/useValorant'
import styles from './ValorantMatch.module.css'

export default function ValorantMatch() {
  const { region, matchId } = useParams()
  const { data, isLoading, isError } = useValMatchDetail(region!, matchId)

  if (isLoading) return <p className={styles.loading}>Carregando...</p>
  if (isError) return <p className={styles.error}>Partida não encontrada.</p>

  const matchData = data as any
  const players = matchData?.players?.all_players ?? []
  const teams: Record<string, any[]> = {
    Red: players.filter((p: any) => p.team === 'Red'),
    Blue: players.filter((p: any) => p.team === 'Blue'),
  }
  const teamScores = matchData?.teams ?? {}

  return (
    <div className={styles.container}>
      <h1>Detalhes — Valorant</h1>
      <p className={styles.subtitle}>
        {matchData?.metadata?.map} — {matchData?.metadata?.mode}
      </p>

      {Object.entries(teams).map(([teamName, teamPlayers]) => {
        const won = teamScores[teamName]?.has_won
        return (
          <div key={teamName} className={styles.team}>
            <h2 style={{ color: teamName === 'Blue' ? '#3b82f6' : '#ef4444' }}>
              Time {teamName} — {won ? 'Vitória' : 'Derrota'}
            </h2>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  {['Agente', 'Jogador', 'KDA', 'Dano/Round', 'HS%', 'Economia'].map(h => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamPlayers.map((p: any) => {
                  const total = (p.stats?.headshots ?? 0) + (p.stats?.bodyshots ?? 0) + (p.stats?.legshots ?? 0)
                  const hs = total > 0 ? Math.round((p.stats?.headshots ?? 0) / total * 100) : 0
                  return (
                    <tr key={p.puuid} className={styles.row}>
                      <td className={styles.td}>
                        <img
                          src={p.assets?.agent?.small}
                          alt={p.character}
                          width={32}
                          height={32}
                          className={styles.icon}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </td>
                      <td className={styles.td}>{p.name}#{p.tag}</td>
                      <td className={styles.td}>{p.stats?.kills}/{p.stats?.deaths}/{p.stats?.assists}</td>
                      <td className={styles.td}>{p.damage_made ? Math.round(p.damage_made / (matchData?.metadata?.rounds_played ?? 1)) : '-'}</td>
                      <td className={styles.td}>{hs}%</td>
                      <td className={styles.td}>{p.economy?.spent?.overall?.toLocaleString() ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
