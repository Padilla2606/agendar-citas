'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', service_id: '' });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookedInfo, setBookedInfo] = useState({ date: '', time: '', service: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => setServices(data))
      .catch(() => {});
  }, []);

  const fetchSlots = async (date, serviceId) => {
    if (!date) { setAvailableSlots([]); setSlotsMessage(''); return; }
    setSlotsLoading(true);
    setSlotsMessage('');
    setForm((prev) => ({ ...prev, time: '' }));
    try {
      let url = `/api/available-slots?date=${date}`;
      if (serviceId) url += `&service_id=${serviceId}`;
      const res = await fetch(url);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
      if (data.message) setSlotsMessage(data.message);
      else if (data.slots?.length === 0) setSlotsMessage('No hay horarios disponibles');
    } catch { setSlotsMessage('Error al cargar horarios'); }
    finally { setSlotsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const svc = services.find((s) => String(s.id) === String(form.service_id));
        setBookedInfo({ date: form.date, time: form.time, service: svc?.name || '' });
        setForm({ name: '', phone: '', date: '', time: '', service_id: '' });
        setAvailableSlots([]);
        setShowSuccess(true);
      } else { setErrorMsg(data.error || 'Error al agendar'); }
    } catch { setErrorMsg('Error de conexión'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (showSuccess) { const t = setTimeout(() => setShowSuccess(false), 3000); return () => clearTimeout(t); }
  }, [showSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'date' || name === 'service_id') fetchSlots(name === 'date' ? value : prev.date, name === 'service_id' ? value : prev.service_id);
      return updated;
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn" style={{ background: 'linear-gradient(135deg, #640c37 0%, #752347 100%)' }}>
          <div className="text-center text-white animate-scaleIn">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" className="animate-checkmark" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-4xl font-bold tracking-tight">Cita Agendada</p>
            <div className="mt-4 bg-white/15 rounded-2xl px-8 py-4 inline-block backdrop-blur-sm">
              <p className="text-lg font-medium opacity-90">{bookedInfo.date}</p>
              <p className="text-3xl font-bold mt-1">{bookedInfo.time}</p>
              {bookedInfo.service && <p className="text-sm mt-2 opacity-80">{bookedInfo.service}</p>}
            </div>
          </div>
        </div>
      )}

      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #640c37, #752347)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ color: '#640c37' }}>AgendaPro</span>
          </div>
          <a href="/admin/login" className="btn-primary px-6 py-2.5 text-sm font-semibold text-white rounded-xl">
            Admin
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg animate-slideUp">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#640c37' }}>Agendar Cita</h1>
            <p className="mt-2 text-sm" style={{ color: '#8c2a55' }}>Complete el formulario para reservar su cita</p>
          </div>

          <form onSubmit={handleSubmit} className="card rounded-3xl shadow-xl p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Nombre completo</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm" placeholder="Juan Pérez" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Teléfono</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} required
                className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm" placeholder="1234567890" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Servicio</label>
              {services.length > 0 ? (
                <select name="service_id" value={form.service_id} onChange={handleChange} required
                  className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm">
                  <option value="">Seleccione un servicio</option>
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>{svc.name} ({svc.duration} min)</option>
                  ))}
                </select>
              ) : (
                <div className="input-field w-full px-4 py-3 rounded-xl text-sm" style={{ color: '#d48baa' }}>
                  No hay servicios disponibles
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Fecha</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required min={today}
                className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Hora</label>
              {slotsLoading ? (
                <div className="input-field w-full px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ color: '#d48baa' }}>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando horarios...
                </div>
              ) : form.date ? (
                availableSlots.length > 0 ? (
                  <select name="time" value={form.time} onChange={handleChange} required
                    className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm">
                    <option value="">Seleccione una hora</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 rounded-xl text-sm" style={{ color: '#640c37', background: '#fdf2f6', border: '1px solid #f3c8dd' }}>
                    {slotsMessage || 'No hay horarios disponibles'}
                  </div>
                )
              ) : (
                <div className="input-field w-full px-4 py-3 rounded-xl text-sm" style={{ color: '#d48baa' }}>
                  Seleccione una fecha primero
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !form.time}
              className="btn-primary w-full text-white font-semibold py-3.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Agendando...
                </span>
              ) : 'Agendar Cita'}
            </button>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#fdf2f6', border: '1px solid #f3c8dd' }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: '#640c37' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm font-medium" style={{ color: '#640c37' }}>{errorMsg}</p>
              </div>
            )}
          </form>
        </div>
      </main>

      <footer className="text-center py-6 text-xs" style={{ color: '#a83d6a' }}>
        AgendaPro &copy; {new Date().getFullYear()}
      </footer>
    </>
  );
}
