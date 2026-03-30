import { Globe } from 'lucide-react'
import styles from './RegionSelect.module.css'

const REGIONS = [
  { value: 'br1', label: 'BR' },
  { value: 'na1', label: 'NA' },
  { value: 'euw1', label: 'EUW' },
  { value: 'eun1', label: 'EUNE' },
  { value: 'kr', label: 'KR' },
  { value: 'jp1', label: 'JP' },
  { value: 'la1', label: 'LAN' },
  { value: 'la2', label: 'LAS' },
  { value: 'oc1', label: 'OCE' },
  { value: 'tr1', label: 'TR' },
  { value: 'ru', label: 'RU' },
  { value: 'ph2', label: 'PH' },
  { value: 'sg2', label: 'SG' },
  { value: 'th2', label: 'TH' },
  { value: 'tw2', label: 'TW' },
  { value: 'vn2', label: 'VN' },
]

interface RegionSelectProps {
  value: string
  onChange: (region: string) => void
}

export default function RegionSelect({ value, onChange }: RegionSelectProps) {
  return (
    <div className={styles.wrapper}>
      <Globe size={14} className={styles.icon} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={styles.select}
      >
        {REGIONS.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  )
}
