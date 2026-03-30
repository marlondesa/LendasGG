import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Search } from 'lucide-react'
import styles from './SearchBar.module.css'

interface Game {
  value: string
  label: string
}

interface Region {
  value: string
  label: string
}

const GAMES: Game[] = [
  { value: 'lol', label: 'League of Legends' },
  { value: 'tft', label: 'TFT' },
  { value: 'valorant', label: 'Valorant' },
]

const REGIONS: Region[] = [
  { value: 'br1',  label: 'BR' },
  { value: 'na1',  label: 'NA' },
  { value: 'euw1', label: 'EUW' },
  { value: 'eun1', label: 'EUNE' },
  { value: 'kr',   label: 'KR' },
  { value: 'jp1',  label: 'JP' },
  { value: 'oc1',  label: 'OCE' },
  { value: 'tr1',  label: 'TR' },
  { value: 'ru',   label: 'RU' },
  { value: 'la1',  label: 'LAN' },
  { value: 'la2',  label: 'LAS' },
  { value: 'me1',  label: 'ME' },
  { value: 'sg2',  label: 'SG' },
  { value: 'tw2',  label: 'TW' },
  { value: 'vn2',  label: 'VN' },
]

export default function SearchBar() {
  const [game, setGame] = useState('lol')
  const [region, setRegion] = useState('br1')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): void {
    e.preventDefault()
    setError('')
    const trimmed = input.trim()

    // Aceita: Nome#TAG  |  Nome / TAG  |  Nome/TAG
    const match = trimmed.match(/^(.+?)(?:#|\s*\/\s*)(.+)$/)
    const gameName = match?.[1]?.trim()
    const tagLine  = match?.[2]?.trim()

    if (!gameName || !tagLine) {
      setError('Use o formato: NomeDoJogador#TAG')
      return
    }

    navigate(`/${game}/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.regionWrapper}>
        <Globe size={14} className={styles.regionIcon} />
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className={styles.regionSelect}
        >
          {REGIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <select
        value={game}
        onChange={e => setGame(e.target.value)}
        className={styles.gameSelect}
      >
        {GAMES.map(g => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="NomeDoJogador#TAG ou NomeDoJogador / TAG"
        className={styles.input}
        autoComplete="off"
        spellCheck={false}
      />

      <button type="submit" className={styles.button}>
        <Search size={16} />
        Buscar
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </form>
  )
}
