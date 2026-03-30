import { useState } from 'react'
import { Swords } from 'lucide-react'
import { useClashTournaments } from '../../hooks/useLol'
import RegionSelect from '../../components/shared/RegionSelect'
import styles from './LolClashTournaments.module.css'

const CLASH_THEME: Record<string, string> = {
  ixtal: 'Ixtal', freljord: 'Freljord', noxus: 'Noxus', demacia: 'Demacia',
  piltover: 'Piltover', zaun: 'Zaun', ionia: 'Ionia', bilgewater: 'Bilgewater',
  shurima: 'Shurima', targon: 'Targon', shadow_isles: 'Ilhas das Sombras',
  bandle_city: 'Cidade de Bandle',
}

const THEME_COLORS: Record<string, string> = {
  ixtal: '#22c55e', freljord: '#60a5fa', noxus: '#ef4444', demacia: '#fbbf24',
  piltover: '#f97316', zaun: '#a78bfa', ionia: '#ec4899', bilgewater: '#14b8a6',
  shurima: '#eab308', targon: '#8b5cf6', shadow_isles: '#6ee7b7', bandle_city: '#fb923c',
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function timeUntil(ts: number) {
  const diff = ts - Date.now()
  if (diff <= 0) return 'Já iniciou'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `em ${d}d ${h}h`
  if (h > 0) return `em ${h}h ${m}min`
  return `em ${m}min`
}

export default function LolClashTournaments() {
  const [region, setRegion] = useState('br1')
  const { data, isLoading } = useClashTournaments(region)
  const tournaments: any[] = (data as any[]) ?? []

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Swords size={28} className={styles.titleIcon} />
          <h1 className={styles.title}>Próximos Torneios Clash</h1>
        </div>
        <RegionSelect value={region} onChange={setRegion} />
      </div>

      {isLoading && <p className={styles.loading}>Carregando torneios...</p>}

      {!isLoading && tournaments.length === 0 && (
        <div className={styles.empty}>
          <Swords size={48} className={styles.emptyIcon} />
          <p>Nenhum torneio agendado no momento.</p>
        </div>
      )}

      {!isLoading && tournaments.length > 0 && (
        <div className={styles.grid}>
          {tournaments.map((t: any) => {
            const themeName = CLASH_THEME[t.nameKey] ?? t.nameKey
            const themeColor = THEME_COLORS[t.nameKey] ?? '#c89b3c'
            const day = t.nameKeySecondary === 'day_2' ? 'Dia 2' : 'Dia 1'
            const schedule = t.schedule?.[0]
            const cancelled = schedule?.cancelled

            return (
              <div
                key={t.id}
                className={`${styles.card} ${cancelled ? styles.cardCancelled : ''}`}
                style={{ borderTopColor: themeColor }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.theme} style={{ color: themeColor }}>{themeName}</span>
                  <span className={styles.dayBadge}>{day}</span>
                </div>

                {cancelled && <div className={styles.cancelledBanner}>Cancelado</div>}

                {schedule && !cancelled && (
                  <div className={styles.schedule}>
                    <div className={styles.scheduleRow}>
                      <div className={styles.scheduleBlock}>
                        <span className={styles.scheduleLabel}>Inscrições abertas</span>
                        <span className={styles.scheduleTime}>{fmtDate(schedule.registrationTime)}</span>
                        <span className={styles.scheduleCountdown}>{timeUntil(schedule.registrationTime)}</span>
                      </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.scheduleRow}>
                      <div className={styles.scheduleBlock}>
                        <span className={styles.scheduleLabel}>Início do torneio</span>
                        <span className={styles.scheduleTime}>{fmtDate(schedule.startTime)}</span>
                        <span className={styles.scheduleCountdown} style={{ color: themeColor }}>
                          {timeUntil(schedule.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
