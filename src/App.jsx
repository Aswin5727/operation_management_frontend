import './App.css'
import { AppRouter } from './routes/AppRouter'
import React, { useEffect, useState } from 'react'

class AppErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('CISPRO application render error', error, errorInfo)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', color: '#172944', fontFamily: 'Inter, sans-serif' }}>
        <section style={{ width: 'min(560px, 100%)', padding: 28, border: '1px solid #fecaca', background: '#fff', boxShadow: '0 8px 24px rgba(15, 23, 42, .08)' }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Unable to load this page</h1>
          <p style={{ color: '#64748b', lineHeight: 1.6 }}>Please refresh once. If the issue continues, open the browser console and share this error:</p>
          <pre style={{ overflowX: 'auto', padding: 12, background: '#fff1f2', color: '#991b1b', fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.error?.message || String(this.state.error)}</pre>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 16px', border: 0, background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reload</button>
        </section>
      </main>
    )
  }
}

function App() {
  const [inactiveMessage, setInactiveMessage] = useState('')

  useEffect(() => {
    const showMessage = (event) => setInactiveMessage(event.detail?.message || 'Your account is currently inactive. You have view-only access. Please contact the Super Admin to reactivate your account.')
    window.addEventListener('cispro:inactive-account-action-blocked', showMessage)
    return () => window.removeEventListener('cispro:inactive-account-action-blocked', showMessage)
  }, [])

  return <><AppRouter />{inactiveMessage ? <div role="presentation" onClick={() => setInactiveMessage('')} style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(15, 23, 42, .42)' }}><section role="alertdialog" aria-modal="true" aria-labelledby="inactive-account-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(460px, 100%)', padding: 28, borderRadius: 18, background: '#fff', boxShadow: '0 24px 60px rgba(15, 23, 42, .24)', color: '#172944' }}><h2 id="inactive-account-title" style={{ margin: '0 0 12px', fontSize: 20 }}>View-only access</h2><p style={{ margin: '0 0 22px', lineHeight: 1.6, color: '#52637d' }}>{inactiveMessage}</p><button type="button" onClick={() => setInactiveMessage('')} style={{ border: 0, borderRadius: 9, padding: '10px 20px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>OK</button></section></div> : null}</>
}

export default function RootApp() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  )
}
