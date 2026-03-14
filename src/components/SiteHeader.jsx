import { HashLink } from './hashLink.jsx'
import { Link, useNavigate } from 'react-router-dom'

export default function SiteHeader({ isLoggedIn = false, onLogout = null }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="logo-container">
        <img
          src="/images/logo.png"
          alt="ORIGINALS Printing Co. Logo"
          className="logo"
        />
        <div className="logo-text">
          <span className="originals">ORIGINALS</span>{' '}
          <span className="printing-co">Printing Co.</span>
        </div>
      </div>

      {!isLoggedIn && (
        <nav className="site-nav">
          <HashLink to="/#home" className="active">
            Home
          </HashLink>
          <HashLink to="/#getting-started">Getting Started</HashLink>
          <HashLink to="/#why-choose-us">Why Us?</HashLink>
        </nav>
      )}

      <div className="auth-section">
        {!isLoggedIn ? (
          <Link to="/home" className="login-button">
            Login
          </Link>
        ) : (
          <div className="user-menu">
            <span className="user-name">Welcome</span>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}