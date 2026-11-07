import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCitiesOfState, getCountries, getStatesOfCountry } from '@countrystatecity/countries-browser'
import { AlertCircle, BriefcaseBusiness, Building2, CheckCircle2, ChevronDown, Mail, MapPin, Phone, Shield, UserPlus, Users, X } from 'lucide-react'
import { request } from '../services/apiClient'
import { listBranches } from '../services/branchService'
import { listBranchAccessUsers } from '../services/userRoleManagementService'
import '../styles/UserRoleManagementPage.css'

const accountTypes = [
  { value: 'BRANCH_ADMIN', label: 'Branch Admin', description: 'Manage one branch and its operations.', icon: Shield, tone: 'blue' },
  { value: 'BRANCH_ADMIN_SALES_ADMIN', label: 'Branch Admin + Sales Admin', description: 'Manage one branch with Sales CRM access.', icon: Users, tone: 'teal' },
  { value: 'SALES_ADMIN', label: 'Sales Admin', description: 'Manage Sales CRM across assigned branches.', icon: BriefcaseBusiness, tone: 'purple' },
]

const statusOptions = [
  { value: 'ACTIVE', label: 'Active', description: 'The account can sign in.', icon: CheckCircle2, tone: 'teal' },
  { value: 'INACTIVE', label: 'Inactive', description: 'Sign-in access is disabled.', icon: Shield, tone: 'purple' },
]

const roleFieldConfig = {
  BRANCH_ADMIN: { nameLabel: 'Branch Admin Name', requiresBranch: true, showStatus: true },
  BRANCH_ADMIN_SALES_ADMIN: { nameLabel: 'Branch Admin + Sales Admin Name', requiresBranch: true, showStatus: true },
  SALES_ADMIN: { nameLabel: 'Sales Admin Name', requiresBranch: false, showStatus: true, showSalesId: true },
}

const initialForm = { accountType: 'BRANCH_ADMIN', branchId: '', branchName: '', branchIds: [], salesAdminId: '', fullName: '', email: '', phone: '', country: 'India', state: 'Tamil Nadu', city: '', address: '', status: 'ACTIVE' }

function normalizeError(error) {
  return String(error?.message || 'Unable to create the account. Please try again.')
}

function AccountTypeSelect({ value, options, onChange, ariaLabel = 'Account type', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const selectedOption = options.find((option) => option.value === value) || options[0]

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleTriggerKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen((current) => !current)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const currentIndex = Math.max(0, options.findIndex((option) => option.value === value))
      const nextIndex = event.key === 'ArrowDown'
        ? (currentIndex + 1) % options.length
        : (currentIndex - 1 + options.length) % options.length
      onChange(options[nextIndex].value)
      setIsOpen(true)
    }
  }

  const SelectedIcon = selectedOption.icon

  return (
    <div ref={selectRef} className={`user-role-custom-select${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="user-role-custom-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="user-role-custom-select-value">
          <span className="user-role-custom-select-icon"><SelectedIcon size={16} /></span>
          <span>{selectedOption.label}</span>
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="user-role-custom-select-menu" role="listbox" aria-label={`${ariaLabel} options`}>
          {options.map((option) => {
            const Icon = option.icon
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`user-role-custom-select-option${isSelected ? ' is-selected' : ''}`}
                onClick={() => { onChange(option.value); setIsOpen(false) }}
              >
                <span className={`user-role-custom-select-option-icon tone-${option.tone}`}><Icon size={15} /></span>
                <span className="user-role-custom-select-option-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
                {isSelected ? <span className="user-role-custom-select-check" aria-hidden="true">✓</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function BranchMultiSelect({ value = [], branches = [], onToggle, loading = false, error = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const selectedIds = new Set((Array.isArray(value) ? value : []).map((id) => String(id)))
  const selectedBranches = branches.filter((branch) => selectedIds.has(String(branch.id)))

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={selectRef} className={`user-role-branch-multi-select${isOpen ? ' is-open' : ''}`}>
      <button type="button" className="user-role-branch-multi-trigger" onClick={() => setIsOpen((current) => !current)} disabled={loading} aria-haspopup="listbox" aria-expanded={isOpen}>
        <span className="user-role-branch-multi-trigger-copy"><Building2 size={16} /><span>{selectedBranches.length ? `${selectedBranches.length} branch${selectedBranches.length === 1 ? '' : 'es'} selected` : loading ? 'Loading active branches...' : 'Select branch access'}</span></span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {selectedBranches.length ? <div className="user-role-branch-multi-chips">{selectedBranches.map((branch) => <span key={branch.id}>{branch.branchName || branch.branchId}<button type="button" onClick={() => onToggle(branch.id)} aria-label={`Remove ${branch.branchName || branch.branchId}`}><X size={12} /></button></span>)}</div> : null}
      {isOpen ? <div className="user-role-branch-multi-menu" role="listbox" aria-label="Branch access options">
        {branches.length ? branches.map((branch) => {
          const selected = selectedIds.has(String(branch.id))
          return <button key={branch.id} type="button" role="option" aria-selected={selected} className={`user-role-branch-multi-option${selected ? ' is-selected' : ''}`} onClick={() => onToggle(branch.id)}><span className="user-role-branch-multi-option-icon"><Building2 size={15} /></span><span><strong>{branch.branchName || 'Unnamed branch'}</strong><small>{branch.branchId || 'Branch ID unavailable'}</small></span><span className="user-role-branch-multi-check">{selected ? '✓' : ''}</span></button>
        }) : <p className="user-role-branch-multi-empty">No active branches available.</p>}
      </div> : null}
      {error ? <small className="user-role-inline-error">{error}</small> : null}
    </div>
  )
}

export function UserRoleManagementPage({ pageType = 'branch' }) {
  const isSalesPage = pageType === 'sales'
  const pageTitle = isSalesPage ? 'Sales Admin' : 'Branch Admin'
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [search, setSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [branches, setBranches] = useState([])
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [branchesError, setBranchesError] = useState('')
  const [countryOptions, setCountryOptions] = useState([])
  const [stateOptions, setStateOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError('')
    try {
      setUsers(await listBranchAccessUsers(isSalesPage ? 'SALES_ADMIN' : 'BRANCH_ADMIN'))
    } catch (reason) {
      setUsersError(reason?.message || `Unable to load ${pageTitle.toLowerCase()} accounts.`)
    } finally {
      setUsersLoading(false)
    }
  }, [isSalesPage, pageTitle])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadUsers() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => [user.userCode, user.fullName, user.email, user.phone, user.managedBranch?.branchName, ...(user.assignedBranches || []).map((branch) => branch.branchName)].some((value) => String(value || '').toLowerCase().includes(query)))
  }, [search, users])
  const userPageCount = Math.max(1, Math.ceil(filteredUsers.length / 5))
  const safeUserPage = Math.min(userPage, userPageCount)
  const paginatedUsers = filteredUsers.slice((safeUserPage - 1) * 5, safeUserPage * 5)

  useEffect(() => { setUserPage(1) }, [search])

  useEffect(() => {
    if (!isCreateOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) closeCreateForm()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCreateOpen, saving])

  const selectedType = useMemo(() => accountTypes.find((item) => item.value === form.accountType) || accountTypes[0], [form.accountType])
  const roleConfig = roleFieldConfig[form.accountType] || roleFieldConfig.BRANCH_ADMIN
  const selectedCountryCode = countryOptions.find((country) => country.name === form.country)?.iso2 || ''
  const selectedStateCode = stateOptions.find((state) => state.name === form.state)?.iso2 || ''
  const countrySelectOptions = useMemo(() => countryOptions.length
    ? countryOptions.map((country) => ({ value: country.name, label: country.name, description: country.iso2 || 'Country', icon: MapPin, tone: 'blue' }))
    : [{ value: form.country || '', label: form.country || 'Loading countries...', description: 'Select a country', icon: MapPin, tone: 'blue' }], [countryOptions, form.country])
  const stateSelectOptions = useMemo(() => stateOptions.length
    ? stateOptions.map((state) => ({ value: state.name, label: state.name, description: state.iso2 || 'State', icon: MapPin, tone: 'blue' }))
    : [{ value: form.state || '', label: form.state || (selectedCountryCode ? 'Select state' : 'Select country first'), description: selectedCountryCode ? 'No states available' : 'Choose a country first', icon: MapPin, tone: 'blue' }], [form.state, selectedCountryCode, stateOptions])
  const citySelectOptions = useMemo(() => cityOptions.length
    ? cityOptions.map((city) => ({ value: city.name, label: city.name, description: 'City', icon: MapPin, tone: 'blue' }))
    : [{ value: form.city || '', label: form.city || (selectedStateCode ? 'Select city' : 'Select state first'), description: selectedStateCode ? 'No cities available' : 'Choose a state first', icon: MapPin, tone: 'blue' }], [cityOptions, form.city, selectedStateCode])

  useEffect(() => {
    let active = true
    getCountries().then((items) => {
      if (active) setCountryOptions(Array.isArray(items) ? [...items].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''))) : [])
    }).catch(() => { if (active) setCountryOptions([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedCountryCode) { setStateOptions([]); setCityOptions([]); return undefined }
    let active = true
    getStatesOfCountry(selectedCountryCode).then((items) => {
      if (active) setStateOptions(Array.isArray(items) ? [...items].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''))) : [])
    }).catch(() => { if (active) setStateOptions([]) })
    return () => { active = false }
  }, [selectedCountryCode])

  useEffect(() => {
    if (!selectedCountryCode || !selectedStateCode) { setCityOptions([]); return undefined }
    let active = true
    getCitiesOfState(selectedCountryCode, selectedStateCode).then((items) => {
      if (active) setCityOptions(Array.isArray(items) ? [...items].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''))) : [])
    }).catch(() => { if (active) setCityOptions([]) })
    return () => { active = false }
  }, [selectedCountryCode, selectedStateCode])

  useEffect(() => {
    if (!isCreateOpen || form.accountType !== 'SALES_ADMIN') return undefined
    let active = true
    setBranchesLoading(true)
    setBranchesError('')
    listBranches({ page: 1, limit: 100, status: 'ACTIVE', sortBy: 'branchName', sortOrder: 'asc' }).then((result) => {
      if (!active) return
      const available = Array.isArray(result?.data) ? result.data : []
      setBranches(available)
      setForm((current) => ({ ...current, branchIds: current.branchIds.filter((id) => available.some((branch) => String(branch.id) === String(id))) }))
    }).catch((reason) => {
      if (!active) return
      setBranches([])
      setBranchesError(reason?.message || 'Unable to load active branches.')
    }).finally(() => { if (active) setBranchesLoading(false) })
    return () => { active = false }
  }, [form.accountType, isCreateOpen])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccess('')
  }

  function updateLocation(field, value) {
    setForm((current) => ({ ...current, [field]: value, ...(field === 'country' ? { state: '', city: '' } : field === 'state' ? { city: '' } : {}) }))
    setError('')
    setSuccess('')
  }

  function resetForm() {
    setForm(initialForm)
    setError('')
    setSuccess('')
  }

  function openCreateForm() {
    resetForm()
    setIsCreateOpen(true)
  }

  function closeCreateForm() {
    if (saving) return
    setIsCreateOpen(false)
    resetForm()
  }

  function selectAccountType(value) {
    setForm((current) => ({ ...current, accountType: value, branchId: value === 'SALES_ADMIN' ? '' : current.branchId, branchName: value === 'SALES_ADMIN' ? '' : current.branchName, branchIds: value === 'SALES_ADMIN' ? current.branchIds : [] }))
    setError('')
    setSuccess('')
  }

  function toggleBranchAccess(branchId) {
    const normalizedId = String(branchId)
    setForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(normalizedId)
        ? current.branchIds.filter((id) => String(id) !== normalizedId)
        : [...current.branchIds, normalizedId],
    }))
    setError('')
    setSuccess('')
  }

  function validateBasicDetails() {
    const nextErrors = []
    if (roleConfig.requiresBranch && !/^(?:CIS)?[A-Z]{2,12}\d{3}$/.test(form.branchId.trim().toUpperCase())) nextErrors.push('Enter a valid Branch ID, for example SAI001.')
    if (roleConfig.requiresBranch && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.branchName.trim())) nextErrors.push('Branch Name must contain letters only.')
    if (roleConfig.requiresBranch && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.fullName.trim())) nextErrors.push('Branch Admin Name must contain letters only.')
    if (roleConfig.requiresBranch && !form.country.trim()) nextErrors.push('Select a country.')
    if (roleConfig.requiresBranch && !form.state.trim()) nextErrors.push('Select a state.')
    if (roleConfig.requiresBranch && !form.city.trim()) nextErrors.push('Select a city.')
    if (roleConfig.requiresBranch && !form.address.trim()) nextErrors.push('Enter the branch address.')
    if (roleConfig.showSalesId && !form.branchIds.length) nextErrors.push('Select at least one branch for this Sales Admin.')
    if (roleConfig.showSalesId && !/^CISSALES\d{3,}$/i.test(form.salesAdminId.trim())) nextErrors.push('Enter a valid Sales Admin ID, for example CISSALES001.')
    if (!form.fullName.trim()) nextErrors.push('Full name is required.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.push('Enter a valid email address.')
    if (!/^\d{10}$/.test(form.phone.trim())) nextErrors.push('Phone number must contain exactly 10 digits.')
    return nextErrors
  }

  function validate() {
    return validateBasicDetails()
  }

  async function submit(event) {
    event.preventDefault()
    const validationErrors = validate()
    if (validationErrors.length) { setError(validationErrors[0]); return }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      let payload
      if (form.accountType === 'SALES_ADMIN') {
        payload = { ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), salesAdminId: form.salesAdminId.trim().toUpperCase() }
        delete payload.branchId
        delete payload.branchName
      } else {
        payload = {
          accountType: form.accountType,
          branchId: form.branchId.trim().toUpperCase(),
          branchName: form.branchName.trim(),
          branchAdminName: form.fullName.trim(),
          branchEmail: form.email.trim(),
          branchPhone: form.phone.trim(),
          branchCountryCode: selectedCountryCode || (form.country === 'India' ? 'IN' : ''),
          branchCountry: form.country,
          branchStateCode: selectedStateCode || (form.state === 'Tamil Nadu' ? 'TN' : ''),
          branchState: form.state,
          branchCity: form.city.trim(),
          branchAddress: form.address.trim(),
          status: form.status,
          roleAccess: form.accountType === 'BRANCH_ADMIN_SALES_ADMIN' ? 'BRANCH_ADMIN_SALES_ADMIN' : 'BRANCH_ADMIN_ONLY',
        }
      }
      const response = await request('/user-role-accounts', { method: 'POST', body: JSON.stringify(payload) })
      const invitationSent = response?.data?.invitationSent !== false
      const accessAssigned = response?.data?.accessAssigned === true
      if (form.accountType !== 'SALES_ADMIN') window.dispatchEvent(new CustomEvent('cispro:branches-changed'))
      await loadUsers()
      setSuccess(invitationSent ? selectedType.label + ' created successfully. ' + (accessAssigned ? 'Branch access assigned.' : 'Assign branch access from the Branch Admin table.') : selectedType.label + ' created successfully, but the invitation email could not be sent.')
      setForm((current) => ({ ...initialForm, accountType: current.accountType }))
    } catch (reason) {
      setError(normalizeError(reason))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="user-role-page">
      <header className="user-role-page-header">
        <div><span className="user-role-eyebrow">USER &amp; ROLE MANAGEMENT</span><h1>{pageTitle}</h1><p>Create Branch Admin and Sales Admin accounts from one controlled form.</p></div>
        <div className="user-role-page-header-actions"><div className="user-role-header-badge"><Users size={18} /><span>Super Admin only</span></div><button type="button" className="user-role-create-button" onClick={openCreateForm}><UserPlus size={17} />Create User</button></div>
      </header>

      <section className="user-role-table-card" aria-label={`${pageTitle} accounts`}>
        <div className="user-role-table-header"><div><span className="user-role-card-kicker">{pageTitle.toUpperCase()} ACCOUNTS</span><h2>{pageTitle} accounts</h2></div><div className="user-role-table-tools"><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${pageTitle.toLowerCase()} accounts`} aria-label={`Search ${pageTitle} accounts`} /><span>{filteredUsers.length} account{filteredUsers.length === 1 ? '' : 's'}</span></div></div>
        {usersLoading ? <p className="user-role-table-state">Loading accounts...</p> : usersError ? <p className="user-role-table-state is-error">{usersError}</p> : <><div className="user-role-table-wrap"><table className="user-role-table"><thead><tr><th>S.No</th><th>User</th><th>Account Type</th><th>Phone</th><th>Branch access</th><th>Actions</th></tr></thead><tbody>{paginatedUsers.map((user, index) => { const branchNames = user.managedBranch ? [user.managedBranch.branchName] : (user.assignedBranches || []).map((branch) => branch.branchName).filter(Boolean); return <tr key={user.id}><td>{(safeUserPage - 1) * 5 + index + 1}</td><td><strong>{user.fullName || '-'}</strong><small>{user.userCode || '-'} · {user.email || '-'}</small></td><td>{user.accountType === 'BRANCH_ADMIN_SALES_ADMIN' ? 'Branch Admin + Sales Admin' : user.accountType === 'SALES_ADMIN' ? 'Sales Admin' : 'Branch Admin'}</td><td>{user.phone || '-'}</td><td>{branchNames.join(', ') || 'Unassigned'}</td><td><button type="button" className="user-role-view-button" onClick={() => setSearch(user.userCode || user.fullName || '')}>View</button></td></tr> })}{!filteredUsers.length ? <tr><td colSpan="6" className="user-role-table-state">No {pageTitle.toLowerCase()} accounts found.</td></tr> : null}</tbody></table></div>{userPageCount > 1 ? <div className="user-role-pagination"><span>Page {safeUserPage} of {userPageCount}</span><div><button type="button" disabled={safeUserPage === 1} onClick={() => setUserPage((page) => Math.max(1, page - 1))}>Previous</button><button type="button" disabled={safeUserPage === userPageCount} onClick={() => setUserPage((page) => Math.min(userPageCount, page + 1))}>Next</button></div></div> : null}</>}
      </section>

      {isCreateOpen ? <div className="user-role-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreateForm() }}>
        <section className="user-role-modal" role="dialog" aria-modal="true" aria-labelledby="user-role-modal-title">
      <header className="user-role-modal-header"><div><span className="user-role-eyebrow">USER &amp; ROLE MANAGEMENT</span><h2 id="user-role-modal-title">Create user account</h2><p>{roleConfig.requiresBranch ? 'Choose an account type, enter the branch profile, and complete the account details.' : 'Choose an account type and complete the account details. Sales Admin branch access is managed from the Branch Admin table.'}</p></div><button type="button" className="user-role-modal-close" onClick={closeCreateForm} aria-label="Close create user form"><X size={20} /></button></header>
          <form className="user-role-form" onSubmit={submit} noValidate>
        <section className="user-role-card user-role-account-type-card">
          <div className="user-role-card-heading"><div><span className="user-role-card-kicker">ACCOUNT TYPE</span><h2>Choose access</h2><p>Select the role that controls the dashboard and permissions.</p></div></div>
          <div className="user-role-field"><span>Account type <b>*</b></span><AccountTypeSelect value={form.accountType} options={accountTypes} onChange={selectAccountType} /></div>
          <p className="user-role-selected-type-description">{selectedType.description}</p>
        </section>

        <section className="user-role-card user-role-details-step">
          <div className="user-role-card-heading"><div><span className="user-role-card-kicker">ACCOUNT DETAILS</span><h2>Personal information</h2><p>Enter the login and contact details for this account.</p></div></div>
          <div className="user-role-fields-grid">
            {roleConfig.requiresBranch ? <>
              <label className="user-role-field"><span>Branch ID <b>*</b></span><div className="user-role-input-wrap"><Building2 size={17} /><input value={form.branchId} onChange={(event) => update('branchId', event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="CISTES001" maxLength={24} autoComplete="off" /></div></label>
              <label className="user-role-field"><span>Branch Name <b>*</b></span><div className="user-role-input-wrap"><Building2 size={17} /><input value={form.branchName} onChange={(event) => update('branchName', event.target.value.replace(/[^\p{L} .'-]/gu, ''))} placeholder="Enter branch name" maxLength={80} /></div></label>
            </> : null}
            {roleConfig.showSalesId ? <label className="user-role-field"><span>Sales Admin ID <b>*</b></span><div className="user-role-input-wrap"><Shield size={17} /><input value={form.salesAdminId} onChange={(event) => update('salesAdminId', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="CISSALES001" maxLength={20} /></div></label> : null}
            {roleConfig.showSalesId ? <div className="user-role-field user-role-field-wide"><span>Branch access <b>*</b></span><BranchMultiSelect value={form.branchIds} branches={branches} loading={branchesLoading} error={branchesError} onToggle={toggleBranchAccess} /></div> : null}
            <label className="user-role-field"><span>{roleConfig.nameLabel} <b>*</b></span><div className="user-role-input-wrap"><Users size={17} /><input value={form.fullName} onChange={(event) => update('fullName', event.target.value.replace(roleConfig.requiresBranch ? /[^A-Za-z ]/g : /[^\p{L} .'-]/gu, ''))} placeholder={`Enter ${roleConfig.nameLabel.toLowerCase()}`} autoComplete="name" /></div></label>
            <label className="user-role-field"><span>Email address <b>*</b></span><div className="user-role-input-wrap"><Mail size={17} /><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="name@example.com" autoComplete="email" /></div></label>
            <label className="user-role-field"><span>Phone number <b>*</b></span><div className="user-role-input-wrap"><Phone size={17} /><input inputMode="numeric" maxLength={10} value={form.phone} onChange={(event) => update('phone', event.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile number" autoComplete="tel" /></div></label>
            <div className="user-role-field"><span>Country</span><AccountTypeSelect value={form.country} options={countrySelectOptions} onChange={(value) => updateLocation('country', value)} ariaLabel="Country" disabled={!countryOptions.length} /></div>
            <div className="user-role-field"><span>State</span><AccountTypeSelect value={form.state} options={stateSelectOptions} onChange={(value) => updateLocation('state', value)} ariaLabel="State" disabled={!selectedCountryCode || !stateOptions.length} /></div>
            <div className="user-role-field"><span>City</span><AccountTypeSelect value={form.city} options={citySelectOptions} onChange={(value) => updateLocation('city', value)} ariaLabel="City" disabled={!selectedStateCode || !cityOptions.length} /></div>
            <label className="user-role-field user-role-field-wide"><span>Address</span><textarea value={form.address} onChange={(event) => update('address', event.target.value)} rows={3} placeholder="Enter address" /></label>
            {roleConfig.showStatus ? <div className="user-role-field"><span>{roleConfig.requiresBranch ? 'Branch status' : 'Account status'}</span><AccountTypeSelect value={form.status} options={statusOptions} onChange={(value) => update('status', value)} ariaLabel={roleConfig.requiresBranch ? 'Branch status' : 'Account status'} /></div> : null}
          </div>
        </section>
        {error ? <div className="user-role-alert is-error" role="alert"><AlertCircle size={18} /><span>{error}</span></div> : null}
        {success ? <div className="user-role-alert is-success" role="status"><CheckCircle2 size={18} /><span>{success}</span></div> : null}
        <footer className="user-role-form-footer"><button type="button" className="user-role-secondary-button" onClick={closeCreateForm} disabled={saving}>Cancel</button><button type="submit" className="user-role-primary-button" disabled={saving}>{saving ? 'Creating account...' : <>Create {selectedType.label}</>}</button></footer>
      </form>
        </section>
      </div> : null}
    </main>
  )
}

