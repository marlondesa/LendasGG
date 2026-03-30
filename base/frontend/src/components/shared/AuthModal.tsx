import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { authService } from '../../auth/Auth'
import api from '../../services/api'
import styles from './AuthModal.module.css'

type View = 'login' | 'register' | 'forgot'

interface Props {
  onClose: () => void
  initialView?: View
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.313 0-9.822-3.415-11.425-8.205l-6.534 5.036C9.503 39.556 16.227 44 24 44z" fill="#4CAF50"/>
    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C42.012 35.245 44 30 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
  </svg>
)

export default function AuthModal({ onClose, initialView = 'login' }: Props) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<View>(initialView)

  // login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register state
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  // forgot state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fecha ao pressionar Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Bloqueia scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function switchView(v: View) {
    setError('')
    setView(v)
  }

  async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email: loginEmail, password: loginPassword })
      onClose()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ username: regUsername, email: regEmail, password: regPassword })
      onClose()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email: forgotEmail })
      setForgotSent(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao enviar email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Fechar">✕</button>

        <h1 className={styles.title}>Lendas.GG</h1>

        {/* ── TABS ── */}
        {view !== 'forgot' && (
          <div className={styles.tabs}>
            <button
              className={view === 'login' ? styles.tabActive : styles.tab}
              onClick={() => switchView('login')}
            >
              Entrar
            </button>
            <button
              className={view === 'register' ? styles.tabActive : styles.tab}
              onClick={() => switchView('register')}
            >
              Cadastrar
            </button>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <>
            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Senha</label>
                <input
                  className={styles.input}
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
              </div>
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <button className={styles.forgotLink} onClick={() => switchView('forgot')}>
              Esqueceu a senha?
            </button>

            <div className={styles.divider}>ou</div>

            <button className={styles.googleBtn} type="button" onClick={() => authService.loginWithGoogle()}>
              <GoogleIcon />
              Continuar com Google
            </button>
          </>
        )}

        {/* ── REGISTER ── */}
        {view === 'register' && (
          <>
            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="username"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Senha</label>
                <input
                  className={styles.input}
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirmar senha</label>
                <input
                  className={styles.input}
                  type="password"
                  autoComplete="new-password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                />
              </div>
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <div className={styles.divider}>ou</div>

            <button className={styles.googleBtn} type="button" onClick={() => authService.loginWithGoogle()}>
              <GoogleIcon />
              Cadastrar com Google
            </button>
          </>
        )}

        {/* ── FORGOT ── */}
        {view === 'forgot' && (
          <>
            <p className={styles.subtitle}>Recuperar senha</p>

            {forgotSent ? (
              <p className={styles.success}>
                Se o email existir, você receberá um link em breve.
              </p>
            ) : (
              <>
                <p className={styles.hint}>
                  Informe seu email e enviaremos um link para redefinir sua senha.
                </p>
                <form className={styles.form} onSubmit={handleForgot}>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input
                      className={styles.input}
                      type="text"
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <button className={styles.submitBtn} type="submit" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar link'}
                  </button>
                </form>
              </>
            )}

            <button className={styles.forgotLink} onClick={() => switchView('login')}>
              ← Voltar para o login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
