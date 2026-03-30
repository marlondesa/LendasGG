import SearchBar from '../components/shared/SearchBar'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}> Lendas.GG</h1>
      <p className={styles.subtitle}>Busque qualquer jogador de LoL, TFT ou Valorant</p>
      <div className={styles.searchWrapper}>
        <SearchBar />
      </div>
    </div>
  )
}
