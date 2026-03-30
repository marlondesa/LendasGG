import { useState, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Camera, Link2, Link2Off, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import api from '../../services/api'
import styles from './DashbordUser.module.css'

const REGIONS = [
  { value: 'br1',  label: 'BR — Brasil' },
  { value: 'na1',  label: 'NA — América do Norte' },
  { value: 'la1',  label: 'LAN — Latinoamérica Norte' },
  { value: 'la2',  label: 'LAS — Latinoamérica Sul' },
  { value: 'euw1', label: 'EUW — Europa Oeste' },
  { value: 'eun1', label: 'EUNE — Europa Nordeste' },
  { value: 'kr',   label: 'KR — Coreia' },
  { value: 'jp1',  label: 'JP — Japão' },
  { value: 'tr1',  label: 'TR — Turquia' },
]

const ICON_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons'

export default function DashbordUser() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ── perfil ──────────────────────────────────────────────────────────────
  const [username, setUsername]     = useState(user?.username ?? '')
  const [twitter, setTwitter]       = useState(user?.twitterUrl ?? '')
  const [discord, setDiscord]       = useState(user?.discordTag ?? '')
  const [twitch, setTwitch]         = useState(user?.twitchUrl ?? '')
  const [youtube, setYoutube]       = useState(user?.youtubeUrl ?? '')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // ── senha ────────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passMsg, setPassMsg]   = useState('')
  const [passErr, setPassErr]   = useState('')
  const [passLoading, setPassLoading] = useState(false)

  // ── riot ─────────────────────────────────────────────────────────────────
  const [riotGameName, setRiotGameName] = useState('')
  const [riotTagLine, setRiotTagLine]   = useState('')
  const [riotRegion, setRiotRegion]     = useState('br1')
  const [riotStep, setRiotStep]         = useState<null | 1 | 2>(null)
  const [riotIcon, setRiotIcon]         = useState<{ id: number; name: string } | null>(null)
  const [riotExpires, setRiotExpires]   = useState<Date | null>(null)
  const [riotMsg, setRiotMsg]           = useState('')
  const [riotErr, setRiotErr]           = useState('')
  const [riotLoading, setRiotLoading]   = useState(false)
  const [riotLinked, setRiotLinked]     = useState(user?.riotVerified ?? false)

  // ── upload refs ──────────────────────────────────────────────────────────
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null)
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl ?? null)
  const [avatarErr, setAvatarErr] = useState('')
  const [bannerErr, setBannerErr] = useState('')

  const MAX_MB = 5
  const MAX_BYTES = MAX_MB * 1024 * 1024

  if (!user) return <Navigate to="/" replace />

  // ── handlers ─────────────────────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarErr('')
    if (file.size > MAX_BYTES) {
      setAvatarErr(`Tamanho máximo: ${MAX_MB}MB`)
      e.target.value = ''
      return
    }
    const form = new FormData()
    form.append('avatar', file)
    try {
      const res = await api.post<{ avatarUrl: string }>('/api/user/avatar', form)
      setAvatarUrl(res.data.avatarUrl)
    } catch { setAvatarErr('Erro ao enviar imagem') }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerErr('')
    if (file.size > MAX_BYTES) {
      setBannerErr(`Tamanho máximo: ${MAX_MB}MB`)
      e.target.value = ''
      return
    }
    const form = new FormData()
    form.append('banner', file)
    try {
      const res = await api.post<{ bannerUrl: string }>('/api/user/banner', form)
      setBannerUrl(res.data.bannerUrl)
    } catch { setBannerErr('Erro ao enviar imagem') }
  }

  async function handleProfileSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileMsg('')
    setProfileErr('')
    setProfileLoading(true)
    try {
      await api.put('/api/user/profile', { username, twitterUrl: twitter, discordTag: discord, twitchUrl: twitch, youtubeUrl: youtube })
      setProfileMsg('Perfil atualizado com sucesso!')
    } catch (err: any) {
      setProfileErr(err.response?.data?.error ?? 'Erro ao salvar perfil')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setPassMsg('')
    setPassErr('')
    if (newPassword !== confirmPassword) { setPassErr('As senhas não coincidem'); return }
    setPassLoading(true)
    try {
      await api.put('/api/user/password', { currentPassword, newPassword, confirmPassword })
      setPassMsg('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPassErr(err.response?.data?.error ?? 'Erro ao alterar senha')
    } finally {
      setPassLoading(false)
    }
  }

  async function handleRiotInit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setRiotErr('')
    setRiotMsg('')
    setRiotLoading(true)
    try {
      const res = await api.post<{ step: 1; iconId: number; iconName: string; expiresAt: string; message: string }>(
        '/api/user/riot/init', { gameName: riotGameName, tagLine: riotTagLine, region: riotRegion }
      )
      setRiotStep(1)
      setRiotIcon({ id: res.data.iconId, name: res.data.iconName })
      setRiotExpires(new Date(res.data.expiresAt))
      setRiotMsg(res.data.message)
    } catch (err: any) {
      setRiotErr(err.response?.data?.error ?? 'Erro ao iniciar verificação')
    } finally {
      setRiotLoading(false)
    }
  }

  async function handleRiotVerify(step: 1 | 2) {
    setRiotErr('')
    setRiotLoading(true)
    try {
      const res = await api.post<any>('/api/user/riot/verify', { step })

      if (res.data.riotVerified) {
        setRiotLinked(true)
        setRiotStep(null)
        setRiotIcon(null)
        setRiotMsg(`Conta Riot vinculada: ${res.data.riotGameName}#${res.data.riotTagLine}`)
        return
      }

      // avançou para step 2
      setRiotStep(2)
      setRiotIcon({ id: res.data.iconId, name: res.data.iconName })
      setRiotExpires(new Date(res.data.expiresAt))
      setRiotMsg(res.data.message)
    } catch (err: any) {
      setRiotErr(err.response?.data?.error ?? 'Ícone incorreto ou tempo esgotado')
    } finally {
      setRiotLoading(false)
    }
  }

  async function handleRiotUnlink() {
    try {
      await api.delete('/api/user/riot')
      setRiotLinked(false)
      setRiotStep(null)
      setRiotIcon(null)
      setRiotMsg('')
    } catch { /* silencioso */ }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── HERO: banner + avatar ── */}
      <div className={styles.hero}>
        <div
          className={styles.banner}
          style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
        >
          <button type="button" className={styles.bannerEdit} onClick={() => bannerRef.current?.click()} title="Trocar banner (1200x300, máx 5MB)">
            <Camera size={14} /> Banner
          </button>
          <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleBannerChange} />
          {bannerErr && <span className={styles.uploadError}>{bannerErr}</span>}
        </div>

        <div className={styles.avatarRow}>
          <div className={styles.avatarWrap}>
            {avatarUrl
              ? <img src={avatarUrl} className={styles.avatar} alt="avatar" />
              : <div className={styles.avatarPlaceholder}>{user.username[0].toUpperCase()}</div>
            }
            <button type="button" className={styles.avatarEdit} onClick={() => avatarRef.current?.click()} title="Trocar foto (400x400, máx 5MB)">
              <Camera size={12} />
            </button>
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarChange} />
            {avatarErr && <span className={styles.uploadError}>{avatarErr}</span>}
          </div>

          <div className={styles.heroInfo}>
            <span className={styles.heroName}>{user.username}</span>
            <span className={styles.heroBadge}>{user.role}</span>
          </div>

          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>

      <div className={styles.content}>

        {/* ── PERFIL ── */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Perfil</h2>
          {profileMsg && <div className={styles.success}>{profileMsg}</div>}
          {profileErr && <div className={styles.error}>{profileErr}</div>}
          <form className={styles.form} onSubmit={handleProfileSave}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input className={styles.input} type="text" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="text" value={user.email} disabled />
              </div>
            </div>

            <div className={styles.divider}>Redes sociais</div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Twitter / X</label>
                <input className={styles.input} type="text" placeholder="https://x.com/seu_usuario" value={twitter} onChange={e => setTwitter(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Discord</label>
                <input className={styles.input} type="text" placeholder="usuario#0000" value={discord} onChange={e => setDiscord(e.target.value)} />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Twitch</label>
                <input className={styles.input} type="text" placeholder="https://twitch.tv/seu_canal" value={twitch} onChange={e => setTwitch(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>YouTube</label>
                <input className={styles.input} type="text" placeholder="https://youtube.com/@seu_canal" value={youtube} onChange={e => setYoutube(e.target.value)} />
              </div>
            </div>

            <button className={styles.saveBtn} type="submit" disabled={profileLoading}>
              {profileLoading ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </form>
        </section>

        {/* ── CONTA RIOT ── */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <ShieldCheck size={16} /> Conta Riot
          </h2>

          {riotLinked && user.riotGameName ? (
            <div className={styles.riotLinked}>
              <div className={styles.riotInfo}>
                <span className={styles.riotTag}>{user.riotGameName}<span className={styles.riotHash}>#{user.riotTagLine}</span></span>
                <span className={styles.verifiedBadge}>Verificado</span>
              </div>
              <button className={styles.unlinkBtn} onClick={handleRiotUnlink}>
                <Link2Off size={14} /> Desvincular
              </button>
            </div>
          ) : (
            <>
              {riotMsg && <div className={styles.success}>{riotMsg}</div>}
              {riotErr && <div className={styles.error}>{riotErr}</div>}

              {/* Nenhuma verificação em andamento */}
              {!riotStep && (
                <form className={styles.form} onSubmit={handleRiotInit}>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>Game Name</label>
                      <input className={styles.input} type="text" placeholder="Faker" value={riotGameName} onChange={e => setRiotGameName(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Tag</label>
                      <input className={styles.input} type="text" placeholder="KR1" value={riotTagLine} onChange={e => setRiotTagLine(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Região</label>
                      <select className={styles.input} value={riotRegion} onChange={e => setRiotRegion(e.target.value)}>
                        {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <button className={styles.saveBtn} type="submit" disabled={riotLoading}>
                    <Link2 size={14} /> {riotLoading ? 'Buscando...' : 'Vincular conta Riot'}
                  </button>
                </form>
              )}

              {/* Verificação em andamento */}
              {riotStep && riotIcon && (
                <div className={styles.verifyBox}>
                  <p className={styles.verifyStep}>Passo {riotStep} de 2</p>
                  <div className={styles.verifyIconWrap}>
                    <img
                      src={`${ICON_BASE}/${riotIcon.id}.jpg`}
                      alt={riotIcon.name}
                      className={styles.verifyIcon}
                    />
                    <span className={styles.verifyIconName}>{riotIcon.name}</span>
                  </div>
                  <p className={styles.verifyHint}>
                    Equipe este ícone de perfil no cliente do LoL, salve e clique em Verificar.
                    {riotExpires && (
                      <span className={styles.verifyExpiry}> Expira em {Math.max(0, Math.ceil((riotExpires.getTime() - Date.now()) / 60000))} min.</span>
                    )}
                  </p>
                  <div className={styles.verifyActions}>
                    <button className={styles.saveBtn} onClick={() => handleRiotVerify(riotStep!)} disabled={riotLoading}>
                      {riotLoading ? 'Verificando...' : 'Verificar ícone'}
                    </button>
                    <button className={styles.cancelBtn} onClick={() => { setRiotStep(null); setRiotIcon(null); setRiotMsg(''); setRiotErr('') }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── SEGURANÇA (só para contas EMAIL) ── */}
        {user.authProvider === 'EMAIL' && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Segurança</h2>
            {passMsg && <div className={styles.success}>{passMsg}</div>}
            {passErr && <div className={styles.error}>{passErr}</div>}
            <form className={styles.form} onSubmit={handlePasswordSave}>
              <div className={styles.field}>
                <label className={styles.label}>Senha atual</label>
                <input className={styles.input} type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Nova senha</label>
                  <input className={styles.input} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Confirmar nova senha</label>
                  <input className={styles.input} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <button className={styles.saveBtn} type="submit" disabled={passLoading}>
                {passLoading ? 'Alterando...' : 'Alterar senha'}
              </button>
            </form>
          </section>
        )}

      </div>
    </div>
  )
}
