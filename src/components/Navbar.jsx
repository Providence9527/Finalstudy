import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-brand">Your Logo</div>
      <div className="navbar-actions">
        {user ? (
          <button onClick={logout} className="logout-button">
            登出 ({user.user_name})
          </button>
        ) : (
          <a href="/login" className="login-link">
            登录
          </a>
        )}
      </div>
    </nav>
  )
}