import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import Admin from './pages/Admin.jsx'
import Home  from './pages/Home.jsx'
import './App.css'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage isLoggedIn={isLoggedIn} onLogout={handleLogout} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/home" element={<Home isLoggedIn={isLoggedIn} onLogout={handleLogout} onLogin={handleLogin} />} />
      </Routes>
    </BrowserRouter>
  )
}