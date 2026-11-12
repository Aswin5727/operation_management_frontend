import { BookOpen, Headset, MessageCircle, TicketCheck } from 'lucide-react'

const SUPPORT_SECTIONS = [
  {
    id: 'support-tickets',
    icon: TicketCheck,
    title: 'Support Tickets',
    description: 'Raise an issue, add context, and track resolution from one place.',
    action: 'Open support tickets',
  },
  {
    id: 'helpdesk-knowledge-base',
    icon: BookOpen,
    title: 'Knowledge Base',
    description: 'Find setup guides, workflow references, and answers to common questions.',
    action: 'Browse help articles',
  },
  {
    id: 'helpdesk-contact-support',
    icon: MessageCircle,
    title: 'Contact Support',
    description: 'Share a request with the support team when you need direct assistance.',
    action: 'Contact support',
  },
]

export function HelpdeskSupportPanel({ roleLabel = 'your workspace', activeView = 'helpdesk' }) {
  const normalizedView = activeView === 'helpdesk-tickets' ? 'support-tickets' : activeView
  const selectedView = SUPPORT_SECTIONS.some((item) => item.id === normalizedView) ? normalizedView : 'helpdesk'

  return (
    <section className="helpdesk-support-panel" aria-labelledby="helpdesk-support-title">
      <div className="helpdesk-support-header">
        <div>
          <p className="helpdesk-support-kicker">Helpdesk &amp; Support</p>
          <h2 id="helpdesk-support-title">How can we help?</h2>
          <p>Get help with {roleLabel}, review support requests, and find guidance for everyday workflows.</p>
        </div>
        <span className="helpdesk-support-header-icon" aria-hidden="true"><Headset size={24} strokeWidth={2.1} /></span>
      </div>

      <div className="helpdesk-support-grid">
        {SUPPORT_SECTIONS.map(({ id, icon: Icon, title, description, action }) => {
          const isSelected = selectedView === id
          return (
            <article key={id} className={`helpdesk-support-card ${isSelected ? 'is-selected' : ''}`.trim()}>
              <span className="helpdesk-support-card-icon" aria-hidden="true"><Icon size={20} strokeWidth={2.1} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="helpdesk-support-card-action">{action}<span aria-hidden="true">→</span></span>
            </article>
          )
        })}
      </div>

      <div className="helpdesk-support-note" role="note">
        <Headset size={18} strokeWidth={2.1} aria-hidden="true" />
        <span>Support options are scoped to {roleLabel}. Your branch and account information will be included with support requests.</span>
      </div>
    </section>
  )
}
