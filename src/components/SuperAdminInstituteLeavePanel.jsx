import { useMemo, useState } from 'react'

const dateLabel = (value) => {
  if (!value) return '-'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function SuperAdminInstituteLeavePanel({ leaves = [], branches = [], loading = false }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [branch, setBranch] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return leaves.filter((leave) => {
      const branchKey = String(leave.branchId || leave.branchRecord?.id || leave.branchRecord?.branchId || '').trim()
      const branchName = leave.branchRecord?.branchName || leave.branchName || ''
      const matchesSearch = !query || [leave.leaveDate, leave.reason, branchName, leave.branchRecord?.branchId].some((value) => String(value || '').toLowerCase().includes(query))
      const matchesStatus = status === 'all' || String(leave.status || '').toUpperCase() === status
      const matchesBranch = branch === 'all' || branchKey === String(branch)
      return matchesSearch && matchesStatus && matchesBranch
    })
  }, [branch, leaves, search, status])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return <section className="super-admin-global-panel"><div className="super-admin-global-header"><div><p className="branch-management-kicker">Academic Operations</p><h1>Institute Leave</h1><p>Institute leave records across every active branch.</p></div><span className="super-admin-global-count">{filtered.length} leaves</span></div><div className="super-admin-institute-leave-toolbar"><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search date, reason or branch" aria-label="Search institute leaves" /><select value={branch} onChange={(event) => { setBranch(event.target.value); setPage(1) }} aria-label="Filter institute leaves by branch"><option value="all">All branches</option>{branches.map((item) => { const value = item.id || item.branchId; return <option key={value} value={value}>{item.branchName || item.branchId}</option> })}</select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter institute leaves by status"><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Cancelled</option></select></div>{loading ? <div className="super-admin-global-state">Loading institute leave records...</div> : <><div className="super-admin-global-table-wrap"><table className="super-admin-global-table"><thead><tr><th>S.No</th><th>Date</th><th>Reason</th><th>Branch</th><th>Status</th><th>Affected Classes</th></tr></thead><tbody>{visible.map((leave, index) => <tr key={leave.id || `${leave.branchId}-${leave.leaveDate}-${index}`}><td>{(safePage - 1) * pageSize + index + 1}</td><td>{dateLabel(leave.leaveDate)}</td><td>{leave.reason || '-'}</td><td><strong>{leave.branchRecord?.branchName || leave.branchName || '-'}</strong><small>{leave.branchRecord?.branchId || leave.branchId || '-'}</small></td><td><span className="super-admin-global-status">{leave.status === 'ACTIVE' ? 'Active' : 'Cancelled'}</span></td><td>{leave.affectedClassCount ?? 0}</td></tr>)}{!visible.length ? <tr><td colSpan="6" className="super-admin-global-empty">No institute leave records found.</td></tr> : null}</tbody></table></div>{filtered.length > pageSize ? <div className="super-admin-pagination"><span>Page {safePage} of {totalPages}</span><div><button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><button type="button" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></div></div> : null}</>}</section>
}
