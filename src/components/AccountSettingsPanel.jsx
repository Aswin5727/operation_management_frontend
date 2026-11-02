import { KeyRound, Mail, ShieldCheck } from 'lucide-react'

export function AccountSettingsPanel({ displayName = 'Account', email = '', roleLabel = 'User', onForgotPassword }) {
  return (
    <section className="account-settings-panel" aria-labelledby="account-settings-title">
      <div className="account-settings-header">
        <div>
          <p className="account-settings-kicker">Account settings</p>
          <h2 id="account-settings-title">Security and account access</h2>
          <p>Manage your sign-in details and keep your {roleLabel.toLowerCase()} account secure.</p>
        </div>
        <span className="account-settings-header-icon" aria-hidden="true"><ShieldCheck size={24} strokeWidth={2.1} /></span>
      </div>

      <div className="account-settings-card">
        <div className="account-settings-identity">
          <span className="account-settings-avatar" aria-hidden="true">{String(displayName || 'A').trim().charAt(0).toUpperCase()}</span>
          <div>
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>

        <div className="account-settings-row">
          <div className="account-settings-row-label"><Mail size={17} strokeWidth={2.1} aria-hidden="true" /><span>Email address</span></div>
          <strong className="account-settings-value">{email || 'Not available'}</strong>
        </div>

        <div className="account-settings-row">
          <div className="account-settings-row-label"><KeyRound size={17} strokeWidth={2.1} aria-hidden="true" /><span>Password</span></div>
          <button type="button" className="account-settings-reset-button" onClick={onForgotPassword}>
            Forgot password <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <p className="account-settings-help">A secure reset link will be sent to your registered email address. The link expires automatically.</p>
    </section>
  )
}
