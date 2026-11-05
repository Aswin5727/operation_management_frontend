import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, ChevronRight, FileSpreadsheet, LoaderCircle, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import {
  cancelCompletedStudentImportJob,
  downloadCompletedStudentImportJobFailedRows,
  getCompletedStudentImportJob,
  listCompletedStudentImportJobs,
  COMPLETED_STUDENT_IMPORT_JOB_EVENT,
} from '../services/completedStudentImportService'
import '../styles/BranchCompletedStudentImportStatus.css'

const REMEMBERED_JOB_KEY = 'cispro.completedStudentImportJobId'
const DISMISSED_JOB_PREFIX = 'cispro.completedStudentImportDismissed:'
const ACTIVE_STATUSES = new Set(['PENDING', 'RUNNING'])
const TERMINAL_STATUSES = new Set(['COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED'])

function readJobs(response) {
  const data = response?.data || response || {}
  return Array.isArray(data?.jobs) ? data.jobs : []
}

function readRememberedJobId() {
  try {
    return String(window.localStorage?.getItem(REMEMBERED_JOB_KEY) || '').trim()
  } catch {
    return ''
  }
}

function isDismissed(jobId) {
  if (!jobId) return false
  try {
    return window.localStorage?.getItem(`${DISMISSED_JOB_PREFIX}${jobId}`) === '1'
  } catch {
    return false
  }
}

function clearRememberedJobId() {
  try { window.localStorage?.removeItem(REMEMBERED_JOB_KEY) } catch {
    // Storage cleanup is best effort.
  }
}

export function BranchCompletedStudentImportStatus({ persistent = false }) {
  const { role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [headerTarget, setHeaderTarget] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const loadInFlight = useRef(false)

  useEffect(() => {
    if (!persistent || typeof document === 'undefined') {
      return undefined
    }

    let frameId = 0
    let observer
    const resolveHeaderTarget = () => {
      // Portal into the stable topbar itself. The status card is positioned in
      // the topbar's center, while the title and account controls stay in the
      // normal header row on both desktop and mobile layouts.
      const nextTarget = document.querySelector('.branch-dashboard-app-shell .super-admin-topbar')
      if (!nextTarget) return
      setHeaderTarget(nextTarget)
      observer?.disconnect()
    }

    if (typeof window.MutationObserver === 'function') {
      observer = new window.MutationObserver(resolveHeaderTarget)
      observer.observe(document.body, { childList: true, subtree: true })
    }
    resolveHeaderTarget()
    if (typeof window.requestAnimationFrame === 'function') {
      frameId = window.requestAnimationFrame(resolveHeaderTarget)
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      observer?.disconnect()
    }
  }, [location.pathname, persistent])

  const loadJobs = useCallback(async () => {
    if (role !== 'branch-admin' || loadInFlight.current) return
    loadInFlight.current = true
    try {
      const response = await listCompletedStudentImportJobs()
      const jobs = readJobs(response)
      const rememberedId = readRememberedJobId()
      let selected = jobs.find((item) => String(item?.id || '') === rememberedId)
        || jobs.find((item) => ACTIVE_STATUSES.has(String(item?.status || '').toUpperCase()))
        || jobs[0]
        || null
      if (rememberedId && !jobs.some((item) => String(item?.id || '') === rememberedId)) {
        try {
          const rememberedResponse = await getCompletedStudentImportJob(rememberedId)
          const rememberedJob = rememberedResponse?.data || rememberedResponse || null
          const rememberedStatus = String(rememberedJob?.status || '').toUpperCase()
          const completedAt = rememberedJob?.completedAt ? new Date(rememberedJob.completedAt).getTime() : 0
          const isRecent = !completedAt || Date.now() - completedAt < 24 * 60 * 60 * 1000
          if (rememberedJob && (ACTIVE_STATUSES.has(rememberedStatus) || (TERMINAL_STATUSES.has(rememberedStatus) && isRecent))) selected = rememberedJob
          else if (TERMINAL_STATUSES.has(rememberedStatus)) clearRememberedJobId()
        } catch {
          clearRememberedJobId()
        }
      }
      setJob(selected)
      setDismissed(selected ? isDismissed(selected.id) : false)
    } catch {
      // The status strip is best effort and must never block the dashboard.
    } finally {
      loadInFlight.current = false
    }
  }, [role])

  useEffect(() => {
    if (role !== 'branch-admin') return undefined
    const timer = window.setTimeout(() => { void loadJobs() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadJobs, role])

  useEffect(() => {
    if (role !== 'branch-admin' || typeof window === 'undefined') return undefined
    const handleImportJobChanged = () => { void loadJobs() }
    window.addEventListener(COMPLETED_STUDENT_IMPORT_JOB_EVENT, handleImportJobChanged)
    return () => window.removeEventListener(COMPLETED_STUDENT_IMPORT_JOB_EVENT, handleImportJobChanged)
  }, [loadJobs, role])

  useEffect(() => {
    if (role !== 'branch-admin' || !job || !ACTIVE_STATUSES.has(String(job.status || '').toUpperCase())) return undefined
    const timer = window.setInterval(() => { loadJobs() }, 1800)
    return () => window.clearInterval(timer)
  }, [job, loadJobs, role])

  const view = useMemo(() => {
    if (!job) return null
    const status = String(job.status || '').toUpperCase()
    const total = Math.max(0, Number(job.totalRows || 0))
    const processed = Math.max(0, Math.min(total || Number.MAX_SAFE_INTEGER, Number(job.processedRows || 0)))
    const imported = Math.max(0, Number(job.importedRows || 0))
    const failed = Math.max(0, Number(job.failedRows || 0))
    const progress = total > 0 ? Math.max(0, Math.min(100, Math.round((processed / total) * 100))) : (status === 'COMPLETED' || status === 'COMPLETED_WITH_ERRORS' ? 100 : 0)
    const active = ACTIVE_STATUSES.has(status)
    const hasErrors = failed > 0 || status === 'COMPLETED_WITH_ERRORS' || status === 'FAILED'
    const stateClass = status === 'FAILED' ? 'is-failed' : status === 'CANCELLED' ? 'is-warning' : hasErrors ? 'is-warning' : status === 'COMPLETED' ? 'is-complete' : 'is-active'
    const title = status === 'FAILED' ? 'Import failed' : status === 'CANCELLED' ? 'Import cancelled' : status === 'COMPLETED_WITH_ERRORS' ? 'Import completed with errors' : status === 'COMPLETED' ? 'Import completed' : 'Importing completed students'
    const summary = status === 'CANCELLED'
      ? `${processed.toLocaleString()} of ${total.toLocaleString()} rows processed`
      : active
        ? `${processed.toLocaleString()} of ${total.toLocaleString()} rows processed`
        : `${imported.toLocaleString()} imported${failed ? ` · ${failed.toLocaleString()} failed` : ''}`
    return { status, total, processed, imported, failed, progress, active, hasErrors, stateClass, title, summary }
  }, [job])

  if (role !== 'branch-admin' || !job || !view || dismissed) return null

  const isTerminal = TERMINAL_STATUSES.has(view.status)
  const Icon = view.status === 'FAILED' || view.status === 'CANCELLED' ? AlertTriangle : view.active ? LoaderCircle : CheckCircle2

  const handleDismiss = () => {
    try { window.localStorage?.setItem(`${DISMISSED_JOB_PREFIX}${job.id}`, '1') } catch {
      // Storage persistence is best effort.
    }
    setDismissed(true)
  }

  const handleFailedRowsDownload = async () => {
    setDownloadError('')
    try {
      await downloadCompletedStudentImportJobFailedRows(job.id)
    } catch (error) {
      setDownloadError(error?.message || 'Unable to download failed rows.')
    }
  }

  const handleCancel = async () => {
    setShowCancelConfirm(false)
    setCancelling(true)
    setDownloadError('')
    try {
      const response = await cancelCompletedStudentImportJob(job.id)
      const cancelled = response?.data || response || {}
      setJob((current) => ({ ...current, ...cancelled, status: 'CANCELLED' }))
      setDismissed(false)
      try {
        window.sessionStorage?.removeItem('completedStudentImportJobId')
        window.localStorage?.removeItem(REMEMBERED_JOB_KEY)
      } catch {
        // Storage cleanup is best effort.
      }
    } catch (error) {
      setDownloadError(error?.message || 'Unable to cancel this import.')
    } finally {
      setCancelling(false)
    }
  }

  const requestCancel = () => {
    if (!cancelling) setShowCancelConfirm(true)
  }

  const statusMarkup = (
      <aside className={`branch-completed-import-status ${view.stateClass} ${persistent && !headerTarget ? 'is-persistent' : ''}`} role="status" aria-live="polite">
      <div className="branch-completed-import-status__icon" aria-hidden="true">
        <Icon className={view.active ? 'is-spinning' : ''} size={20} />
      </div>
      <div className="branch-completed-import-status__content">
        <div className="branch-completed-import-status__heading">
          <div className="branch-completed-import-status__title-wrap">
            <div className="branch-completed-import-status__title-line">
              <span className="branch-completed-import-status__eyebrow"><FileSpreadsheet size={13} /> Completed student import</span>
              {view.status !== 'COMPLETED' ? <h3>{view.title}</h3> : null}
            </div>
            {job.fileName ? <span className="branch-completed-import-status__file">{job.fileName}</span> : null}
          </div>
          <strong>{view.progress}%</strong>
          {isTerminal ? <button type="button" className="branch-completed-import-status__close" onClick={handleDismiss} aria-label="Dismiss import status"><X size={16} /></button> : null}
        </div>
        <div className="branch-completed-import-status__track" aria-label={`${view.progress}% complete`}><span style={{ width: `${view.progress}%` }} /></div>
        <div className="branch-completed-import-status__footer">
          <span>{view.summary}{view.active ? ' · Processing in background' : ''}</span>
          <div className="branch-completed-import-status__actions">
            {view.active ? <button type="button" className="branch-completed-import-status__link is-danger" onClick={requestCancel} disabled={cancelling}>{cancelling ? 'Cancelling…' : 'Cancel import'}</button> : null}
            {view.hasErrors && view.failed > 0 ? <button type="button" className="branch-completed-import-status__link" onClick={handleFailedRowsDownload}>Download failed rows</button> : null}
            <button type="button" className="branch-completed-import-status__link" onClick={() => navigate('/branch-dashboard?section=completed-students')}>View details <ChevronRight size={14} /></button>
          </div>
        </div>
        {downloadError ? <p className="branch-completed-import-status__error">{downloadError}</p> : null}
      </div>
      </aside>
  )

  return (
    <>
      {persistent && headerTarget ? createPortal(statusMarkup, headerTarget) : statusMarkup}
      {showCancelConfirm && typeof document !== 'undefined' ? createPortal(
        <div className="branch-completed-import-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCancelConfirm(false) }}>
          <div className="branch-completed-import-confirm" role="dialog" aria-modal="true" aria-labelledby="completed-import-cancel-title">
            <div className="branch-completed-import-confirm__icon" aria-hidden="true"><AlertTriangle size={20} /></div>
            <h2 id="completed-import-cancel-title">Cancel this import?</h2>
            <p>Rows already imported will remain saved. The remaining rows will stop processing and can be reviewed later.</p>
            <div className="branch-completed-import-confirm__actions">
              <button type="button" className="branch-completed-import-confirm__keep" onClick={() => setShowCancelConfirm(false)}>Keep processing</button>
              <button type="button" className="branch-completed-import-confirm__cancel" onClick={() => void handleCancel()} disabled={cancelling}>{cancelling ? 'Cancelling…' : 'Confirm cancel'}</button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  )
}

export default BranchCompletedStudentImportStatus
