import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigError } from '../../config/supabase.js'
import {
  getAttempts,
  incrementAttempts,
  isLockedOut,
  resetAttempts,
  getLockoutRemainingMs,
  MAX_LOGIN_ATTEMPTS,
} from '../../auth/lockout.js'
import './loginModal.css'

function friendlyError(err) {
  if (err?.message?.toLowerCase?.().includes('invalid login credentials')) {
    return 'Invalid credentials. Please check your email and password.'
  }
  switch (err?.code || err?.name) {
    case 'invalid_credentials': return 'The password you entered is incorrect.'
    case 'user_not_found': return 'No account was found with this email address.'
    case 'email_address_invalid': return 'The email address you entered is not valid.'
    case 'over_request_rate_limit': return 'You have sent too many requests. Please try again later.'
    default: return err?.message || 'An unexpected error occurred.'
  }
}

function validatePassword(pw) {
  const checks = {
    length: pw.length >= 8 && pw.length <= 20,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
  const ok = Object.values(checks).every(Boolean)
  return { ok, checks }
}

export default function LoginModal({ open, onClose }) {
  const [view, setView] = useState('login') // login | signup | otp
  const [busy, setBusy] = useState(false)

  // login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // signup
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPassword2, setSignupPassword2] = useState('')
  const [termsAgree, setTermsAgree] = useState(false)

  // messages
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // lockout countdown
  const [remainingMs, setRemainingMs] = useState(0)

  // otp
  const [otp, setOtp] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpSentTo, setOtpSentTo] = useState('')

  const attempts = useMemo(() => getAttempts(), [open, error, success])
  const attemptsRemaining = Math.max(0, MAX_LOGIN_ATTEMPTS - attempts)

  useEffect(() => {
    if (!open) return
    setError('')
    setSuccess('')
    setBusy(false)
    setRemainingMs(getLockoutRemainingMs())
    if (isLockedOut() && email) {
      setOtpEmail(email)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!isLockedOut()) return

    const tick = () => setRemainingMs(getLockoutRemainingMs())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [open, error])

  if (!open) return null

  const minutes = Math.floor(Math.ceil(remainingMs / 1000) / 60)
  const seconds = Math.ceil(remainingMs / 1000) % 60

  function ensureSupabaseReady() {
    if (!supabase) {
      setError(supabaseConfigError || 'Supabase is not configured.')
      return false
    }
    return true
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!ensureSupabaseReady()) return

    if (!termsAgree) {
      setError('You must agree to the Terms & Conditions and Privacy Policy.')
      return
    }
    if (signupPassword !== signupPassword2) {
      setError('The passwords you entered do not match.')
      return
    }

    const { ok } = validatePassword(signupPassword)
    if (!ok) {
      setError('Please ensure your password meets all the requirements.')
      return
    }

    setBusy(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      })
      if (error) throw error

      setSuccess(`Account created. A verification email has been sent to ${signupEmail}. Verify before logging in.`)
      setView('login')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!ensureSupabaseReady()) return

    if (isLockedOut()) {
      setError('Too many login attempts. Please verify OTP to unlock.')
      setOtpEmail(email)
      setView('otp')
      return
    }

    setBusy(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      resetAttempts()

      if (!data?.user?.email_confirmed_at) {
        await supabase.auth.signOut()
        setError('Please verify your email before logging in.')
        return
      }

      setSuccess('Logged in successfully.')
      onClose?.()
    } catch (err) {
      incrementAttempts()
      if (isLockedOut()) {
        setError('Too many login attempts. Please verify OTP to unlock.')
        setOtpEmail(email)
        setView('otp')
      } else {
        setError(`${friendlyError(err)} (${Math.max(0, attemptsRemaining - 1)} attempts remaining)`)
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword() {
    setError('')
    setSuccess('')
    if (!ensureSupabaseReady()) return
    if (!email) {
      setError('Enter your email in the login form first.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) throw error

      setSuccess(`A password reset link has been sent to ${email}.`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setSuccess('')
    if (!ensureSupabaseReady()) return
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error

      resetAttempts()
      onClose?.()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleFacebook() {
    setError('')
    setSuccess('')
    if (!ensureSupabaseReady()) return
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error

      resetAttempts()
      onClose?.()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function requestOtp() {
    setError('')
    setSuccess('')
    if (!ensureSupabaseReady()) return
    if (!otpEmail) {
      setError('Please enter your email in the login form first.')
      return
    }

    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: {
          shouldCreateUser: false,
        },
      })
      if (error) throw error

      setOtpSentTo(otpEmail)
      setSuccess('OTP sent. Check your email.')
    } catch (err) {
      setError(err?.message || 'Failed to send OTP.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp() {
    setError('')
    setSuccess('')
    if (!ensureSupabaseReady()) return
    if (!otpEmail) {
      setError('Missing email.')
      return
    }
    if (!otp || otp.length !== 6) {
      setError('Enter a valid 6-digit OTP.')
      return
    }

    setBusy(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otp,
        type: 'email',
      })
      if (error) throw error

      resetAttempts()
      setOtp('')
      setSuccess('OTP verified. You are now logged in.')
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP.')
    } finally {
      setBusy(false)
    }
  }

  const signupValidation = validatePassword(signupPassword)

  return (
    <div className="lp-overlay" role="dialog" aria-modal="true">
      <div className="lp-modal">
        <button className="lp-close" onClick={onClose} aria-label="Close">×</button>

        <div className="lp-header">
          <img src="/images/logo.png" alt="ORIGINALS Printing Co. Logo" className="lp-logo" />
        </div>

        <div className="lp-tabs">
          <button className={view === 'login' ? 'active' : ''} onClick={() => setView('login')}>Login</button>
          <button className={view === 'signup' ? 'active' : ''} onClick={() => setView('signup')}>Sign up</button>
          {isLockedOut() && <button className={view === 'otp' ? 'active' : ''} onClick={() => setView('otp')}>OTP</button>}
        </div>

        {error && <div className="lp-alert lp-error">{error}</div>}
        {success && <div className="lp-alert lp-success">{success}</div>}

        {isLockedOut() && (
          <div className="lp-lockout">
            Locked out. Try again in {minutes}:{String(seconds).padStart(2, '0')} or unlock via OTP.
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="lp-form">
            <h2>Login</h2>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            <div className="lp-row">
              <button type="button" className="lp-link" onClick={handleForgotPassword} disabled={busy}>
                Forgot Password?
              </button>
              <div className="lp-attempts">
                Attempts remaining: {attemptsRemaining}
              </div>
            </div>

            <button type="submit" disabled={busy}>Login</button>

            <div className="lp-sep">or continue with</div>
            <div className="lp-social">
              <button type="button" onClick={handleGoogle} disabled={busy}>Google</button>
              <button type="button" onClick={handleFacebook} disabled={busy}>Facebook</button>
            </div>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignup} className="lp-form">
            <h2>Sign Up</h2>
            <label>
              Email
              <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
            </label>
            <label>
              Create Password
              <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
            </label>
            <div className="lp-password-req">
              <div>Password requirements:</div>
              <ul>
                <li className={signupValidation.checks.length ? 'ok' : ''}>8–20 characters</li>
                <li className={signupValidation.checks.upper ? 'ok' : ''}>1 uppercase</li>
                <li className={signupValidation.checks.lower ? 'ok' : ''}>1 lowercase</li>
                <li className={signupValidation.checks.number ? 'ok' : ''}>1 number</li>
                <li className={signupValidation.checks.special ? 'ok' : ''}>1 special character</li>
              </ul>
            </div>

            <label>
              Confirm Password
              <input type="password" value={signupPassword2} onChange={(e) => setSignupPassword2(e.target.value)} required />
            </label>

            <label className="lp-checkbox">
              <input type="checkbox" checked={termsAgree} onChange={(e) => setTermsAgree(e.target.checked)} />
              <span>I agree to the Terms & Conditions and Privacy Policy.</span>
            </label>

            <button type="submit" disabled={busy}>Create Account</button>
          </form>
        )}

        {view === 'otp' && (
          <div className="lp-form">
            <h2>Unlock with OTP</h2>
            <label>
              Email
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </label>

            <button type="button" onClick={requestOtp} disabled={busy}>
              Send OTP
            </button>

            {otpSentTo && <div className="lp-hint">Sent to: {otpSentTo}</div>}

            <label>
              OTP Code
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
              />
            </label>

            <button type="button" onClick={verifyOtp} disabled={busy}>
              Verify OTP
            </button>
          </div>
        )}
      </div>
    </div>
  )
}