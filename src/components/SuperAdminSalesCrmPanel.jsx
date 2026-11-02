import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw, Search } from 'lucide-react'
import { request, requestBlob } from '../services/apiClient'

const text = (value, fallback = '-') => String(value ?? '').trim() || fallback
const dateLabel = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SuperAdminSalesCrmPanel({ view = 'leads', students = [], studentsLoading = false }) {
  const isAdmissions = view === 'admissions'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const admissionRows = useMemo(() => students.filter((student) => student?.admissionDate || student?.sourceLeadId || student?.admissionSource), [students])

  useEffect(() => {
    let active = true
    if (isAdmissions) return () => { active = false }
    const loadAllLeads = async () => {
      const firstResponse = await request('/leads?page=1&limit=100&sortBy=createdAt&sortOrder=desc')
      const firstRows = Array.isArray(firstResponse?.data) ? firstResponse.data : []
      const totalPages = Math.min(100, Math.max(1, Number(firstResponse?.meta?.totalPages || 1)))
      const remainingResponses = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) => request(`/leads?page=${index + 2}&limit=100&sortBy=createdAt&sortOrder=desc`)),
      )
      return [
        ...firstRows,
        ...remainingResponses.flatMap((response) => (Array.isArray(response?.data) ? response.data : [])),
      ]
    }
    loadAllLeads()
      .then((leadRows) => {
        if (!active) return
        setRows(leadRows)
      })
      .catch((reason) => { if (active) setError(reason?.message || 'Unable to load Sales CRM records.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isAdmissions, reloadKey])

  const sourceRows = isAdmissions ? admissionRows : rows
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sourceRows
    return sourceRows.filter((row) => {
      const student = isAdmissions ? row.admissionStudent : row
      return [row.leadId, row.studentId, row.studentName, row.emailAddress, row.email, row.branchName, row.branch?.branchName, row.branchRecord?.branchName, row.courseName, row.course?.name, row.courseEnrollments?.[0]?.courseName, row.assignedAdminName, row.assignedTo?.fullName, student?.studentId, student?.studentName]
        .some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [isAdmissions, search, sourceRows])

  const downloadReport = async () => {
    setDownloading(true)
    setError('')
    try {
      const scope = isAdmissions ? 'admissions' : 'all'
      const result = await requestBlob(`/leads/report/export?scope=${scope}&period=custom&fromDate=2000-01-01&toDate=2100-12-31`)
      if (!result?.blob) throw new Error('The report file could not be created.')
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.fileName || `${isAdmissions ? 'Admission_Students' : 'All_Leads'}_Report.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setError(reason?.message || 'Unable to download the report.')
    } finally {
      setDownloading(false)
    }
  }
  const title = isAdmissions ? 'Admission Management' : 'Lead Management'
  const description = isAdmissions ? 'Converted admission students across all active branches.' : 'All lead students across every active branch.'

  return (
    <section className="super-admin-sales-crm-panel" aria-labelledby="super-admin-sales-crm-title">
      <header className="super-admin-sales-crm-header">
        <div><p className="branch-management-kicker">Sales &amp; CRM</p><h1 id="super-admin-sales-crm-title">{title}</h1><p>{description}</p></div>
        <div className="super-admin-sales-crm-actions">
          <button type="button" className="super-admin-outline-action" onClick={() => { setError(''); setLoading(true); setReloadKey((value) => value + 1) }} disabled={loading}><RefreshCw size={16} className={loading ? 'is-spinning' : ''} /> Refresh</button>
          <button type="button" className="super-admin-primary-action" onClick={() => void downloadReport()} disabled={downloading}><Download size={16} /> {downloading ? 'Preparing...' : 'Download Excel'}</button>
        </div>
      </header>
      <div className="super-admin-sales-crm-toolbar"><label className="super-admin-sales-crm-search"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isAdmissions ? 'Search admission student, branch, course...' : 'Search lead, student, branch, course...'} aria-label={`Search ${title}`} /></label><span>{filteredRows.length} records</span></div>
      {error ? <div className="super-admin-global-state is-error" role="alert">{error}</div> : null}
      {((isAdmissions ? studentsLoading : loading)) ? <div className="super-admin-sales-crm-loading" role="status">Loading {isAdmissions ? 'admission students' : 'leads'}...</div> : (
        <div className="super-admin-sales-crm-table-wrap">
          <table className="super-admin-sales-crm-table">
            <thead>{isAdmissions ? <tr><th>Student</th><th>Student ID</th><th>Branch</th><th>Course</th><th>Admission Date</th><th>Assigned To</th><th>Payment</th></tr> : <tr><th>Lead</th><th>Phone</th><th>Branch</th><th>Course</th><th>Stage</th><th>Status</th><th>Assigned To</th><th>Lead Date</th></tr>}</thead>
            <tbody>
              {filteredRows.map((row) => {
                const student = row.admissionStudent || row
                return isAdmissions ? <tr key={row.id || row.leadId || row.studentId}><td><strong>{text(student.studentName || row.studentName)}</strong><small>{text(row.leadId || row.sourceLeadId)}</small></td><td>{text(student.studentId || row.studentId)}</td><td>{text(row.branchName || row.branch?.branchName || row.branchRecord?.branchName)}</td><td>{text(row.courseName || row.course?.name || row.courseEnrollments?.[0]?.courseName)}</td><td>{dateLabel(student.admissionDate || row.admissionDate || row.createdAt)}</td><td>{text(row.assignedAdminName || row.assignedTo?.fullName)}</td><td>{text(row.paymentStatus || row.paidProgress?.percentage ? `${row.paymentStatus || 'Paid'}${row.paidProgress?.percentage !== undefined ? ` (${row.paidProgress.percentage}%)` : ''}` : '')}</td></tr> : <tr key={row.id || row.leadId}><td><strong>{text(row.studentName)}</strong><small>{text(row.leadId)}</small></td><td>{text(row.phoneNumber)}</td><td>{text(row.branch?.branchName)}</td><td>{text(row.course?.name)}</td><td><span className="super-admin-sales-crm-badge">{text(row.stage)}</span></td><td>{text(row.status)}</td><td>{text(row.assignedTo?.fullName)}</td><td>{dateLabel(row.leadDate || row.createdAt)}</td></tr>
              })}
              {!filteredRows.length ? <tr><td colSpan={isAdmissions ? 7 : 8} className="super-admin-sales-crm-empty">No matching {isAdmissions ? 'admission students' : 'leads'} found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
