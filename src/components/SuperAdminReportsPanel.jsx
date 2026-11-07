import { BarChart3, CalendarDays, CheckCircle2, CreditCard, Layers3, UserRound, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const reportDefinitions = [
  { id: 'monthly', title: 'Monthly Reports', description: 'Review month-wise operational movement and conversion trends.', icon: CalendarDays, tone: 'blue' },
  { id: 'students', title: 'Student Reports', description: 'Review student records across the active branch network.', icon: Users, tone: 'violet' },
  { id: 'faculty', title: 'Faculty Reports', description: 'Review faculty assignment and academic activity summaries.', icon: UserRound, tone: 'green' },
  { id: 'batches', title: 'Batch Reports', description: 'Review course batches, schedules, and seat information.', icon: Layers3, tone: 'amber' },
  { id: 'attendance', title: 'Attendance Reports', description: 'Review attendance activity and academic participation.', icon: CheckCircle2, tone: 'orange' },
  { id: 'payments', title: 'Payment Reports', description: 'Review collection, outstanding, and payment movement.', icon: CreditCard, tone: 'rose' },
]

export function SuperAdminReportsPanel({ activeView = 'monthly', branches = [], students = [], faculty = [] }) {
  const navigate = useNavigate()
  const selectedReport = reportDefinitions.find((report) => report.id === activeView) || reportDefinitions[0]
  const SelectedIcon = selectedReport.icon

  return (
    <section className="super-admin-reports-panel" aria-labelledby="super-admin-reports-title">
      <header className="super-admin-reports-header">
        <div>
          <p className="branch-management-kicker">Consolidated reporting</p>
          <h1 id="super-admin-reports-title">Reports &amp; Analytics</h1>
          <p>Review operational reports across active branches from one workspace.</p>
        </div>
        <span className="super-admin-reports-header-icon" aria-hidden="true"><BarChart3 size={24} strokeWidth={2.1} /></span>
      </header>

      <div className="super-admin-reports-summary">
        <div><span>Active branches</span><strong>{branches.length}</strong></div>
        <div><span>Students in view</span><strong>{students.length}</strong></div>
        <div><span>Faculty in view</span><strong>{faculty.length}</strong></div>
      </div>

      <div className="super-admin-reports-grid">
        {reportDefinitions.map((report) => {
          const Icon = report.icon
          const isSelected = report.id === selectedReport.id
          return (
            <button key={report.id} type="button" className={`super-admin-report-card tone-${report.tone} ${isSelected ? 'is-selected' : ''}`.trim()} onClick={() => navigate(`/dashboard/super-admin?section=reports&view=${report.id}`)} aria-pressed={isSelected}>
              <span className="super-admin-report-card-icon" aria-hidden="true"><Icon size={19} strokeWidth={2.1} /></span>
              <h2>{report.title}</h2>
              <p>{report.description}</p>
              <span className="super-admin-report-card-status">{isSelected ? 'Selected report' : 'Open from Reports & Analytics'}</span>
            </button>
          )
        })}
      </div>

      <div className="super-admin-reports-selected" role="status">
        <span className="super-admin-reports-selected-icon" aria-hidden="true"><SelectedIcon size={18} strokeWidth={2.1} /></span>
        <div><strong>{selectedReport.title}</strong><span>Branch-scoped data will be shown here for the selected report.</span></div>
      </div>
    </section>
  )
}
