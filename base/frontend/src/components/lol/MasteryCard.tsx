import styles from './MasteryCard.module.css'

interface Mastery {
  championName?: string
  championId: number
  championLevel: number
  championPoints: number
}

interface MasteryCardProps {
  mastery: Mastery
}

export default function MasteryCard({ mastery }: MasteryCardProps) {
  return (
    <div className={styles.masteryCard}>
      <img
        src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${mastery.championName}.png`}
        alt={mastery.championName}
        width={48}
        height={48}
        className={styles.icon}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className={styles.championName}>{mastery.championName ?? `ID ${mastery.championId}`}</div>
      <div className={styles.masteryInfo}>
        Nível {mastery.championLevel}<br />
        {mastery.championPoints.toLocaleString()} pts
      </div>
    </div>
  )
}
