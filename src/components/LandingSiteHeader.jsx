import { useState } from 'react'
import { HashLink } from './hashLink.jsx'


export default function LandingSiteHeader() {

  // eslint-disable-next-line no-empty-pattern
  const [] = useState(false)

  
  return (
    <header className="landing-site-header">
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

      <a href="/signup" className="select-none hover:text-blue-400 text-amber-300">
        Don't have an account yet?
      </a>

      <button className='border group  hover:border-amber-400 rounded-[20px] p-2 w-30'>
        <a href="/signin" className='w-2 select-none group-hover:text-amber-400'>Sign In</a>
        {/* <a href="/homepage" className='w-2 select-none group-hover:text-amber-400'>Sign In</a> */}
      </button>
    </header>
  )
}