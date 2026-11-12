import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { request } from '../services/apiClient'
import '../styles/EmailChangeVerificationPage.css'

export function EmailChangeVerificationPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')
  const temporaryPassword = params.get('temporaryPassword') || ''
  const verificationStartedRef = useRef(false)
  const [state, setState] = useState(() => ({ loading: Boolean(token), error: token ? '' : 'This email verification link is missing a token.', success: '', resetToken: '' }))

  useEffect(() => {
    if (!token || verificationStartedRef.current) return undefined
    verificationStartedRef.current = true
    const timeoutId = window.setTimeout(() => {
      setState({ loading: false, error: 'Verification is taking too long. Please refresh this page and try the latest email link again.', success: '', resetToken: '' })
    }, 15000)
    request('/user-role-accounts/email-change/verify', { method: 'POST', skipAuth: true, body: JSON.stringify({ token }) })
      .then((response) => { setState({ loading: false, error: '', success: response?.message || 'Email address verified successfully.', resetToken: response?.data?.resetToken || '' }) })
      .catch((error) => { setState({ loading: false, error: error?.message || 'This email verification link is invalid or expired.', success: '', resetToken: '' }) })
    return () => { window.clearTimeout(timeoutId) }
  }, [token])

  const resetLink = state.resetToken ? `/reset-password?token=${encodeURIComponent(state.resetToken)}&redirect=/login` : ''

  return (
    <main className="email-verification-page">
      <section className="email-verification-shell" role="status">
        <div className="email-verification-panel">
          <div className="email-verification-brand">
            <span>CISPRO</span>
            <small>Operation Management Platform</small>
          </div>

          {state.loading ? (
            <div className="email-verification-state">
              <div className="email-verification-spinner" />
              <p className="email-verification-eyebrow">Security verification</p>
              <h1>Verifying your email</h1>
              <p>Please wait while we securely confirm your email address.</p>
            </div>
          ) : state.success ? (
            <div className="email-verification-state">
              <div className="email-verification-icon is-success">
                <CheckCircle2 size={34} strokeWidth={2.5} />
              </div>
              <p className="email-verification-eyebrow">Verification complete</p>
              <h1>Email verified successfully</h1>
              <p>{state.success}</p>
              {temporaryPassword ? (
                <div className="email-verification-credential">
                  <span>Temporary password</span>
                  <strong>{temporaryPassword}</strong>
                </div>
              ) : null}
              <div className="email-verification-actions">
                {resetLink ? (
                  <button className="email-verification-button" type="button" onClick={() => navigate(resetLink)}>
                    Reset Password
                  </button>
                ) : null}
                <button className="email-verification-button is-secondary" type="button" onClick={() => navigate('/login')}>
                  Go to login
                </button>
              </div>
            </div>
          ) : (
            <div className="email-verification-state">
              <div className="email-verification-icon is-error">
                <XCircle size={34} strokeWidth={2.5} />
              </div>
              <p className="email-verification-eyebrow">Verification failed</p>
              <h1>Unable to verify email</h1>
              <p>{state.error}</p>
              <button className="email-verification-button is-secondary" type="button" onClick={() => navigate('/login')}>
                Back to login
              </button>
            </div>
          )}

          <p className="email-verification-footer">© {new Date().getFullYear()} CISPRO Operation Management</p>
        </div>
        <div className="email-verification-visual" aria-hidden="true">
          <img src="/cispro.png" alt="" />
        </div>
      </section>
    </main>
  )
}
