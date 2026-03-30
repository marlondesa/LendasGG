import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Server, BarChart2, LogOut, User, Swords, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import AuthModal from './AuthModal'
import styles from './Navbar.module.css'

type NavbarProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showAuth, setShowAuth] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}>Lendas.GG</Link>

        <Link to='/' className={styles.link }>Princial</Link>

        <Link to="/lol/ranking" className={styles.link}>
          <Trophy size={14} /> LoL Ranking
        </Link>
        <Link to="/lol/servidor" className={styles.link}>
          <Server size={14} /> Rotação Semanal
        </Link>

        <Link to="/lol/clash/torneios" className={styles.link}>
          <Swords size={14} /> Próximo Clash
        </Link>

        <Link to="/tft/ranking" className={styles.link}>
          <BarChart2 size={14} /> TFT Ranking
        </Link>
        <Link to="/tft/servidor" className={styles.link}>
          <Server size={14} /> TFT Servidor
        </Link>
        <Link to="/valorant/servidor" className={styles.link}>
          <Server size={14} /> Valorant
        </Link>

        <span className={styles.spacer} />

        <button className={styles.themeBtn} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} 
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {user ? (
          <>
            <Link to="/dashboard" className={styles.username}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} className={styles.avatar} alt="" />
                : <User size={14} />
              }
              {user.username}
            </Link>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={14} /> Sair
            </button>
          </>
        ) : (
          <button className={styles.loginBtn} onClick={() => setShowAuth(true)}>Entrar</button>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
