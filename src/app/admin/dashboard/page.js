'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const router = useRouter();
  const [schedule, setSchedule] = useState({ work_days: '1,2,3,4,5', work_start: '09:00', work_end: '17:00', appointment_duration: '30' });
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', duration: '30' });
  const [editingService, setEditingService] = useState(null);
  const [serviceMsg, setServiceMsg] = useState('');

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setUser(data.user);
      fetchAppointments(); fetchSchedule(); fetchServices();
    } catch { router.push('/admin/login'); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/admin/appointments', { credentials: 'include' });
      if (res.status === 401) { router.push('/admin/login'); return; }
      setAppointments(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const fetchSchedule = async () => {
    try { const r = await fetch('/api/admin/schedule', { credentials: 'include' }); if (r.ok) setSchedule(await r.json()); } catch {}
  };

  const fetchServices = async () => {
    try { const r = await fetch('/api/admin/services', { credentials: 'include' }); if (r.ok) setServices(await r.json()); } catch {}
  };

  const saveSchedule = async () => {
    setScheduleMsg('');
    try {
      const r = await fetch('/api/admin/schedule', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(schedule) });
      if (r.ok) { setScheduleMsg('Guardado'); setTimeout(() => setScheduleMsg(''), 2000); }
    } catch { setScheduleMsg('Error'); }
  };

  const toggleDay = (d) => {
    const days = schedule.work_days.split(',').map(Number);
    setSchedule({ ...schedule, work_days: (days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort()).join(',') });
  };

  const addService = async () => {
    setServiceMsg('');
    if (!newService.name.trim()) { setServiceMsg('Nombre obligatorio'); return; }
    try {
      const r = await fetch('/api/admin/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newService) });
      if (r.ok) { setNewService({ name: '', duration: '30' }); setServiceMsg('Creado'); fetchServices(); setTimeout(() => setServiceMsg(''), 2000); }
    } catch { setServiceMsg('Error'); }
  };

  const updateService = async (svc) => {
    setServiceMsg('');
    try {
      const r = await fetch('/api/admin/services', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: svc.id, name: svc.name, duration: svc.duration }) });
      if (r.ok) { setEditingService(null); setServiceMsg('Actualizado'); fetchServices(); setTimeout(() => setServiceMsg(''), 2000); }
    } catch { setServiceMsg('Error'); }
  };

  const toggleServiceActive = async (svc) => {
    await fetch('/api/admin/services', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: svc.id, active: !svc.active }) });
    fetchServices();
  };

  const deleteService = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE', credentials: 'include' }); fetchServices();
  };

  const updateStatus = async (id, status) => {
    await fetch('/api/admin/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, status }) });
    fetchAppointments();
  };

  const deleteAppointment = async (id) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    await fetch(`/api/admin/appointments?id=${id}`, { method: 'DELETE', credentials: 'include' }); fetchAppointments();
  };

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE', credentials: 'include' }); router.push('/admin/login');
  };

  const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const DAY_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const statusStyles = { pending: 'bg-amber-50 text-amber-700 border border-amber-200', confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200', cancelled: 'bg-red-50 text-red-700 border border-red-200' };
  const statusLabels = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' };
  const svcNameMap = {};
  services.forEach((s) => { svcNameMap[s.id] = s.name; });
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  if (loading) return (
    <main className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ color: '#a83d6a' }}>
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Cargando...
      </div>
    </main>
  );

  const tabs = [
    { key: 'appointments', label: 'Citas', count: appointments.length, icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
    { key: 'services', label: 'Servicios', count: services.length, icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
    { key: 'schedule', label: 'Horario', count: null, icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full animate-fadeIn">
      <div className="glass-header -mx-4 md:-mx-8 -mt-4 md:-mt-8 px-4 md:px-8 py-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#640c37' }}>Panel de Control</h1>
          <p className="mt-1 text-sm" style={{ color: '#8c2a55' }}>
            {pendingCount > 0 && <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e9bed2' }} />{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>}
            {appointments.length} cita{appointments.length !== 1 ? 's' : ''} &middot; {user}
          </p>
        </div>
        <div className="flex gap-3">
          <a href="/" className="px-4 py-2.5 text-sm font-medium rounded-xl transition bg-white/60 hover:bg-white/80"
            style={{ border: '1px solid #d9cfc4', color: '#640c37' }}>Ver pública</a>
          <button onClick={logout} className="btn-primary px-4 py-2.5 text-sm font-medium text-white rounded-xl cursor-pointer">Salir</button>
        </div>
      </div>

      <div className="flex gap-1 mb-8 p-1 rounded-2xl w-fit" style={{ background: 'rgba(233, 190, 210, 0.3)' }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === tab.key ? 'tab-active' : ''}`}
            style={activeTab !== tab.key ? { color: '#a83d6a' } : {}}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
            {tab.count !== null && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={activeTab === tab.key ? { background: '#fdf2f6', color: '#640c37' } : { background: 'rgba(233,190,210,0.4)', color: '#8c2a55' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'appointments' && (
        appointments.length === 0 ? (
          <div className="card rounded-3xl shadow-lg py-20 text-center">
            <svg className="w-12 h-12 mx-auto mb-4" style={{ color: '#e9bed2' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-lg font-medium" style={{ color: '#a83d6a' }}>No hay citas agendadas</p>
            <p className="text-sm mt-1" style={{ color: '#d48baa' }}>Las citas aparecerán aquí cuando los clientes agenden</p>
          </div>
        ) : (
          <div className="card rounded-3xl shadow-lg overflow-hidden animate-slideUp">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3c8dd' }}>
                    {['Nombre', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Estado', 'Acciones'].map((h) => (
                      <th key={h} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#a83d6a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid #fdf2f6' }}>
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="table-row">
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#640c37' }}>{apt.name}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#8c2a55' }}>{apt.phone}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#8c2a55' }}>{svcNameMap[apt.service_id] || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#640c37' }}>{apt.date}</td>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#640c37' }}>{apt.time}</td>
                      <td className="px-6 py-4">
                        <span className={`badge inline-flex px-2.5 py-1 rounded-full ${statusStyles[apt.status] || statusStyles.pending}`}>
                          {statusLabels[apt.status] || apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {apt.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(apt.id, 'confirmed')} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                                style={{ background: '#f3c8dd', color: '#640c37' }}>Confirmar</button>
                              <button onClick={() => updateStatus(apt.id, 'cancelled')} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                                style={{ background: '#fdf2f6', color: '#a83d6a', border: '1px solid #f3c8dd' }}>Cancelar</button>
                            </>
                          )}
                          <button onClick={() => deleteAppointment(apt.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                            style={{ background: '#640c37', color: '#fff' }}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {activeTab === 'services' && (
        <div className="space-y-6 animate-slideUp">
          <div className="card rounded-3xl shadow-lg p-6 max-w-2xl">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#640c37' }}>Agregar Servicio</h2>
            <div className="flex gap-3">
              <input type="text" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Nombre del servicio" className="input-field flex-1 px-4 py-3 rounded-xl outline-none text-sm" />
              <select value={newService.duration} onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                className="input-field px-4 py-3 rounded-xl outline-none text-sm">
                <option value="15">15 min</option><option value="20">20 min</option>
                <option value="30">30 min</option><option value="45">45 min</option>
                <option value="60">1 hora</option><option value="90">1h 30m</option>
                <option value="120">2 horas</option>
              </select>
              <button onClick={addService} className="btn-primary px-6 py-3 text-white text-sm font-semibold rounded-xl cursor-pointer">Agregar</button>
            </div>
            {serviceMsg && <p className="text-sm font-medium mt-3" style={{ color: serviceMsg.includes('Error') ? '#640c37' : '#640c37' }}>{serviceMsg}</p>}
          </div>

          <div className="card rounded-3xl shadow-lg overflow-hidden max-w-3xl">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid #f3c8dd' }}>
                  {['Servicio', 'Duración', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#a83d6a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="table-row" style={{ borderTop: '1px solid #fdf2f6' }}>
                    <td className="px-6 py-4">
                      {editingService?.id === svc.id ? (
                        <input type="text" value={editingService.name} onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          className="input-field px-3 py-2 rounded-lg text-sm outline-none w-full" />
                      ) : (
                        <span className="text-sm font-semibold" style={{ color: svc.active ? '#640c37' : '#d48baa', textDecoration: svc.active ? 'none' : 'line-through' }}>{svc.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingService?.id === svc.id ? (
                        <select value={editingService.duration} onChange={(e) => setEditingService({ ...editingService, duration: e.target.value })}
                          className="input-field px-3 py-2 rounded-lg text-sm outline-none">
                          <option value="15">15 min</option><option value="20">20 min</option>
                          <option value="30">30 min</option><option value="45">45 min</option>
                          <option value="60">1 hora</option><option value="90">1h 30m</option>
                          <option value="120">2 horas</option>
                        </select>
                      ) : (
                        <span className="text-sm font-medium" style={{ color: '#8c2a55' }}>{svc.duration} min</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge inline-flex px-2.5 py-1 rounded-full"
                        style={svc.active ? { background: '#fdf2f6', color: '#640c37', border: '1px solid #f3c8dd' } : { background: '#f3efe9', color: '#a83d6a' }}>
                        {svc.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {editingService?.id === svc.id ? (
                          <>
                            <button onClick={() => updateService(editingService)} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                              style={{ background: '#640c37', color: '#fff' }}>Guardar</button>
                            <button onClick={() => setEditingService(null)} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                              style={{ background: '#e8dfd6', color: '#640c37' }}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingService({ ...svc, duration: String(svc.duration) })} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                              style={{ background: '#f3efe9', color: '#640c37' }}>Editar</button>
                            <button onClick={() => toggleServiceActive(svc)} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                              style={svc.active ? { background: '#fdf2f6', color: '#a83d6a', border: '1px solid #f3c8dd' } : { background: '#f3c8dd', color: '#640c37' }}>
                              {svc.active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button onClick={() => deleteService(svc.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
                              style={{ background: '#640c37', color: '#fff' }}>Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center" style={{ color: '#d48baa' }}>No hay servicios creados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card rounded-3xl shadow-lg p-8 max-w-xl animate-slideUp">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: '#640c37' }}>Configuración de Horario</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#a83d6a' }}>Días laborales</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const isActive = schedule.work_days.split(',').map(Number).includes(day);
                  return (
                    <button key={day} onClick={() => toggleDay(day)}
                      className="w-12 h-12 rounded-xl text-sm font-bold transition-all cursor-pointer"
                      style={isActive ? { background: '#640c37', color: '#fff', boxShadow: '0 2px 8px rgba(100,12,55,0.3)' } : { background: '#f3efe9', color: '#a83d6a' }}>
                      {DAY_NAMES[day]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-3" style={{ color: '#a83d6a' }}>
                Activos: {schedule.work_days.split(',').map(Number).map((d) => DAY_FULL[d]).join(', ') || 'Ninguno'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Hora inicio</label>
                <input type="time" value={schedule.work_start} onChange={(e) => setSchedule({ ...schedule, work_start: e.target.value })}
                  className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Hora fin</label>
                <input type="time" value={schedule.work_end} onChange={(e) => setSchedule({ ...schedule, work_end: e.target.value })}
                  className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#a83d6a' }}>Duración por defecto</label>
              <select value={schedule.appointment_duration} onChange={(e) => setSchedule({ ...schedule, appointment_duration: e.target.value })}
                className="input-field w-full px-4 py-3 rounded-xl outline-none text-sm">
                <option value="15">15 minutos</option><option value="20">20 minutos</option>
                <option value="30">30 minutos</option><option value="45">45 minutos</option>
                <option value="60">1 hora</option><option value="90">1 hora 30 min</option>
                <option value="120">2 horas</option>
              </select>
              <p className="text-xs mt-1" style={{ color: '#d48baa' }}>Se usa cuando no se selecciona un servicio</p>
            </div>
            <button onClick={saveSchedule} className="btn-primary w-full text-white font-semibold py-3.5 rounded-xl cursor-pointer">Guardar Configuración</button>
            {scheduleMsg && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium"
                style={{ background: scheduleMsg.includes('Error') ? '#fdf2f6' : '#fdf2f6', color: '#640c37', border: '1px solid #f3c8dd' }}>
                {scheduleMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
