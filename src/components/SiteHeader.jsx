import { useState } from 'react'
import { HashLink } from './hashLink.jsx'


export default function SiteHeader() {

  const [open, setOpen] = useState(false)

  
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

      <button>
        <a href="/signin" className='w-2'>Sign In</a>
      </button>
    </header>
  )
}