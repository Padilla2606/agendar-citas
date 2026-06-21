'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => { if (res.ok) router.push('/admin/dashboard'); })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form),
      });
      if (res.ok) { router.push('/admin/dashboard'); }
      else {
        const data = await res.json();
        if (res.status === 429) setLocked(true);
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #640c37, #752347)' }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#640c37' }}>Panel Admin</h1>
          <p className="mt-2 text-sm" style={{ color: '#8c2a55' }}>Inicie sesión para administrar las citas</p>
        </div>

        <form onSubmit={handleSubmit} className="card rounded-3xl shadow-xl p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Usuario</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              required disabled={locked}
              className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="admin" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Contraseña</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              required disabled={locked}
              className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading || locked}
            className="btn-primary w-full text-white font-semibold py-3.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Ingresando...
              </span>
            ) : 'Iniciar Sesión'}
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: locked ? '#fdf2f6' : '#fdf2f6', border: `1px solid ${locked ? '#f3c8dd' : '#f3c8dd'}` }}>
              <svg className="w-4 h-4 shrink-0" style={{ color: '#640c37' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: '#640c37' }}>{error}</p>
            </div>
          )}
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-sm font-medium transition" style={{ color: '#a83d6a' }}>
            &larr; Volver al inicio
          </a>
        </div>
      </div>
    </main>
  );
}
