import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import styles from './Login.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/forgot-password', { email })
      setMessage(res.data.message)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao enviar email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Lendas.GG</h1>
        <p className={styles.subtitle}>Recuperar senha</p>

        {error && <div className={styles.error}>{error}</div>}

        {message ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--green)', marginBottom: 16 }}>{message}</p>
            <p className={styles.footer}>
              <Link to="/login" className={styles.footerLink}>Voltar para o login</Link>
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="text"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <p className={styles.footer}>
              Lembrou a senha?{' '}
              <Link to="/login" className={styles.footerLink}>Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
