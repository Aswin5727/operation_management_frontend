import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Pencil, X } from 'lucide-react'
import { BranchAttendanceChart } from './BranchAttendanceChart'
import { BranchAttendanceInsights } from './BranchAttendanceInsights'
import { editBranchStudentAttendance, getBranchAttendanceOverview } from '../services/attendanceService'
import { FACULTY_ATTENDANCE_SYNC_EVENT } from '../lib/facultyAttendanceStore'
import { attendanceToday } from '../lib/branchAttendanceSummary'
import '../styles/BranchStudentAttendance.css'

export function BranchStudentAttendance({ branchId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editReason, setEditReason] = useState('')
  const [lateReason, setLateReason] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const lastLoadedAtRef = useRef(0)
  useEffect(() => {
    if (!branchId) {
      setLoading(false)
      setData(null)
      setError('Branch context is not available yet.')
      return undefined
    }
    let active = true
    let pending = false
    async function load(force = false) {
      if (pending) return
      if (!force && lastLoadedAtRef.current && Date.now() - lastLoadedAtRef.current < 30000) return
      pending = true
      setLoading(true)
      try {
        const result = await getBranchAttendanceOverview(attendanceToday(), branchId, { force })
        if (String(result.branchId) !== String(branchId)) throw new Error('Attendance branch does not match the current dashboard.')
        lastLoadedAtRef.current = Date.now()
        if (active) { setData(result); setError('') }
      } catch (err) {
        if (active) { setData(null); setError(err.message || 'Unable to load attendance. Please retry.') }
      } finally {
        pending = false
        if (active) setLoading(false)
      }
    }
    load(true)
    const reload = (force = false) => { if (document.visibilityState === 'visible') load(force) }
    const timer = window.setInterval(reload, 60000)
    const reloadOnFocus = () => reload(false)
    window.addEventListener('focus', reloadOnFocus)
    const forceReload = () => reload(true)
    window.addEventListener(FACULTY_ATTENDANCE_SYNC_EVENT, forceReload)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', reloadOnFocus)
      window.removeEventListener(FACULTY_ATTENDANCE_SYNC_EVENT, forceReload)
    }
  }, [branchId])
  const hasData = data && data.date === attendanceToday() && String(data.branchId) === String(branchId)
  const saveEdit = async (event) => {
    event.preventDefault()
    if (!editTarget || !editStatus || !editReason.trim()) return
    setSavingEdit(true)
    try {
      await editBranchStudentAttendance({
        date: attendanceToday(), attendanceDate: attendanceToday(),
        branchId, courseId: editTarget.courseId, courseName: editTarget.courseName,
        batchId: editTarget.batchId, batchName: editTarget.batchName,
        editReason: editReason.trim(), role: 'branch-admin',
        students: [{ studentId: editTarget.studentId, status: editStatus, lateReason }],
      })
      setEditTarget(null)
      setEditReason('')
      lastLoadedAtRef.current = 0
      window.dispatchEvent(new CustomEvent(FACULTY_ATTENDANCE_SYNC_EVENT))
    } catch (err) {
      setError(err?.message || 'Unable to edit attendance.')
    } finally { setSavingEdit(false) }
  }
  return <section className="branch-attendance" aria-label="Branch student attendance" aria-busy={loading}>
    <div className="branch-attendance-heading"><div className="attendance-title"><span className="attendance-title-icon"><CalendarDays size={22} /></span><div><h2>Attendance</h2></div></div></div>
    {error ? <p role="alert" className="branch-attendance-error">{error}</p> : null}
    {!hasData && !error ? <p role="status">Loading attendance from the server…</p> : null}
    {hasData ? <>
      <div className="attendance-dashboard-layout"><BranchAttendanceChart data={data} /><BranchAttendanceInsights data={data} /></div>
      <div className="branch-attendance-edit-list">
        {(data.students || []).map((student) => {
          const record = (student.records || []).find((item) => item.attendanceDate === data.date)
          const currentStatus = record?.status || 'UNMARKED'
          return <button type="button" key={student.id} onClick={() => { setEditTarget({ ...student, studentId: student.studentId, courseId: student.courseId, courseName: student.courseName, batchId: student.batchId, batchName: student.batchName }); setEditStatus(currentStatus === 'UNMARKED' ? 'PRESENT' : currentStatus); setEditReason(''); setLateReason('') }}>
            <Pencil size={14} /> Edit {student.studentName}
          </button>
        })}
      </div>
    </> : null}
    {editTarget ? <div className="course-modal-backdrop" role="presentation"><form className="course-modal panel-card" role="dialog" aria-modal="true" onSubmit={saveEdit} onClick={(event) => event.stopPropagation()}>
      <button type="button" className="course-modal-close" onClick={() => setEditTarget(null)} aria-label="Close"><X size={18} /></button>
      <h3>Edit Attendance — {editTarget.studentName}</h3>
      <p>Only today&apos;s attendance can be edited. The previous status will remain in history.</p>
      <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} aria-label="Attendance status">
        <option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="UNMARKED">Unmarked</option>
      </select>
      {editStatus === 'LATE' ? <input required value={lateReason} onChange={(event) => setLateReason(event.target.value)} placeholder="Late reason" /> : null}
      <input required value={editReason} onChange={(event) => setEditReason(event.target.value)} placeholder="Edit reason" />
      <button type="submit" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Attendance'}</button>
    </form></div> : null}
  </section>
}
