import { request } from './apiClient'

export async function listBranchAccessUsers(accountType = '') {
  const query = accountType ? `?accountType=${encodeURIComponent(accountType)}` : ''
  const response = await request(`/user-role-accounts/branch-access/users${query}`, { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function assignBranchAccess(branchId, payload) {
  const response = await request(`/user-role-accounts/branch-access/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response?.data || response
}
