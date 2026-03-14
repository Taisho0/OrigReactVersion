import { useState } from 'react'
import { HashLink } from './hashLink.jsx'
import LoginModal from './LoginModal/LoginModal.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()

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

      <nav className="site-nav">
        <HashLink to="/#home" className="active">
          Home
        </HashLink>
        <HashLink to="/#getting-started">Getting Started</HashLink>
        <HashLink to="/#why-choose-us">Why Us?</HashLink>
      </nav>

      <div className="auth-section">
        {!user ? (
          <a
            href="#"
            className="login-button"
            onClick={(e) => {
              e.preventDefault()
              setOpen(true)
            }}
          >
            Login
          </a>
        ) : (
          <a
            href="#"
            className="login-button"
            onClick={(e) => {
              e.preventDefault()
              signOut()
            }}
          >
            Logout
          </a>
        )}
      </div>

      <LoginModal open={open} onClose={() => setOpen(false)} />
    </header>
  )
}