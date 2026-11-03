import { request, requestBlob } from './apiClient'

const COMPLETED_IMPORT_TIMEOUT_MS = 300000
const IMPORT_POLL_INTERVAL_MS = 1200
export const COMPLETED_STUDENT_IMPORT_JOB_EVENT = 'cispro:completed-student-import-job'

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)) }

export async function downloadCompletedStudentTemplate() {
  const response = await requestBlob('/reports/completed-student-import/template', { method: 'GET' })
  if (!response?.blob) throw new Error('Unable to download the template right now.')
  downloadBlob(response.blob, response.fileName || 'completed-student-upload-template.xlsx')
  return response
}

export async function previewCompletedStudentImport(file) {
  const body = new FormData()
  body.append('file', file)
  return request('/reports/completed-student-import/preview', { method: 'POST', body, timeoutMs: COMPLETED_IMPORT_TIMEOUT_MS })
}

export async function createCompletedStudentImportJob(rows, options = {}) {
  return request('/reports/completed-student-import/jobs', {
    method: 'POST',
    body: JSON.stringify({
      rows,
      fileName: options.fileName || null,
      skippedRows: Number(options.skippedRows || 0),
      allowMissingContact: options.allowMissingContact === true,
    }),
    timeoutMs: COMPLETED_IMPORT_TIMEOUT_MS,
  })
}

export async function getCompletedStudentImportJob(jobId) {
  return request(`/reports/completed-student-import/jobs/${encodeURIComponent(jobId)}`, { method: 'GET' })
}

export async function listCompletedStudentImportJobs() {
  return request('/reports/completed-student-import/jobs/active', { method: 'GET' })
}

export async function cancelCompletedStudentImportJob(jobId) {
  return request(`/reports/completed-student-import/jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' })
}

export async function retryCompletedStudentImportJob(jobId) {
  return request(`/reports/completed-student-import/jobs/${encodeURIComponent(jobId)}/retry`, { method: 'POST' })
}

export async function importCompletedStudents(rows, options = {}) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('No rows were selected for import.')
  const createdResponse = await createCompletedStudentImportJob(rows, options)
  const created = createdResponse?.data || createdResponse || {}
  if (created.validationRequired) {
    const error = new Error(created.message || 'Fix all validation errors and revalidate before importing.')
    error.body = { message: error.message, data: created }
    throw error
  }
  const jobId = created.job?.id
  if (!jobId) throw new Error('Import job could not be created. Please try again.')
  try {
    window.sessionStorage?.setItem('completedStudentImportJobId', jobId)
    window.localStorage?.setItem('cispro.completedStudentImportJobId', jobId)
  } catch {
    // Browser storage is best effort; the server job remains authoritative.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COMPLETED_STUDENT_IMPORT_JOB_EVENT, { detail: { jobId } }))
  }

  let consecutiveErrors = 0
  while (true) {
    try {
      const response = await getCompletedStudentImportJob(jobId)
      const status = response?.data || response || {}
      consecutiveErrors = 0
      options.onChunkComplete?.(status.processedRows || 0, status.totalRows || rows.length, status)
      if (['COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED'].includes(status.status)) {
        if (status.status === 'FAILED') {
          const terminalError = new Error(status.errorMessage || 'Import job failed. Please retry the failed rows.')
          terminalError.isImportTerminal = true
          throw terminalError
        }
        try {
          window.sessionStorage?.removeItem('completedStudentImportJobId')
          window.localStorage?.removeItem('cispro.completedStudentImportJobId')
        } catch {
          // Browser storage cleanup is best effort after the job reaches a terminal state.
        }
        return { data: { ...status, jobId } }
      }
    } catch (error) {
      if (error?.isImportTerminal || (error?.status && error.status !== 408 && error.status < 500)) throw error
      consecutiveErrors += 1
      await delay(Math.min(10000, IMPORT_POLL_INTERVAL_MS * Math.max(1, consecutiveErrors)))
      continue
    }
    await delay(IMPORT_POLL_INTERVAL_MS)
  }
}
export async function revalidateCompletedStudentImport(rows, options = {}) {
  return request('/reports/completed-student-import/import', { method: 'POST', body: JSON.stringify({ rows, dryRun: true, allowMissingContact: options.allowMissingContact === true }), timeoutMs: COMPLETED_IMPORT_TIMEOUT_MS })
}

export async function downloadCompletedStudentFailedRows(rows) {
  const response = await requestBlob('/reports/completed-student-import/failed-rows', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  })
  if (!response?.blob) throw new Error('Unable to download the error report right now.')
  downloadBlob(response.blob, response.fileName || 'completed-student-import-errors.xlsx')
  return response
}

export async function downloadCompletedStudentImportJobFailedRows(jobId) {
  const response = await requestBlob(`/reports/completed-student-import/jobs/${encodeURIComponent(jobId)}/failed-rows`, { method: 'GET' })
  if (!response?.blob) throw new Error('Unable to download the failed rows right now.')
  downloadBlob(response.blob, response.fileName || 'completed-student-import-failed-rows.xlsx')
  return response
}
