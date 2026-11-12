import { KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react'

export function SuperAdminProfilePanel({ displayName = 'Super Admin', email = '', roleLabel = 'Super Admin', onForgotPassword }) {
  return (
    <section className="super-admin-profile-panel" aria-labelledby="super-admin-profile-title">
      <div className="super-admin-profile-header">
        <div>
          <p className="super-admin-profile-kicker">Your profile</p>
          <h2 id="super-admin-profile-title">Profile overview</h2>
          <p>Review your profile details and account access information.</p>
        </div>
        <span className="super-admin-profile-header-icon" aria-hidden="true"><UserRound size={23} strokeWidth={2.1} /></span>
      </div>

      <div className="super-admin-profile-grid">
        <article className="super-admin-profile-identity-card">
          <span className="super-admin-profile-avatar" aria-hidden="true">{String(displayName || 'A').trim().charAt(0).toUpperCase()}</span>
          <div>
            <h3>{displayName}</h3>
            <p>{roleLabel}</p>
            <span className="super-admin-profile-status"><span aria-hidden="true" />Active account</span>
          </div>
        </article>

        <article className="super-admin-profile-details-card">
          <div className="super-admin-profile-card-heading">
            <div>
              <span className="super-admin-profile-card-eyebrow">Account information</span>
              <h3>Personal details</h3>
            </div>
            <ShieldCheck size={20} strokeWidth={2.1} aria-hidden="true" />
          </div>

          <div className="super-admin-profile-detail-row">
            <span className="super-admin-profile-detail-label"><UserRound size={17} strokeWidth={2.1} aria-hidden="true" />Full name</span>
            <strong>{displayName}</strong>
          </div>
          <div className="super-admin-profile-detail-row">
            <span className="super-admin-profile-detail-label"><Mail size={17} strokeWidth={2.1} aria-hidden="true" />Email address</span>
            <strong>{email || 'Not available'}</strong>
          </div>
          <div className="super-admin-profile-detail-row">
            <span className="super-admin-profile-detail-label"><ShieldCheck size={17} strokeWidth={2.1} aria-hidden="true" />Role</span>
            <strong>{roleLabel}</strong>
          </div>
        </article>
      </div>

      <div className="super-admin-profile-access-card">
        <div>
          <span className="super-admin-profile-card-eyebrow">Security</span>
          <h3>Password and account access</h3>
          <p>Keep your account secure by resetting your password whenever needed.</p>
        </div>
        <button type="button" className="super-admin-profile-reset-button" onClick={onForgotPassword}>
          <KeyRound size={16} strokeWidth={2.1} aria-hidden="true" />
          Forgot password
        </button>
      </div>
    </section>
  )
}
