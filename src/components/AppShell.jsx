import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ClinicBranding, { SubscriptionBanner } from './ClinicBranding';

export default function AppShell({ title, children, links = [], showLogoUpload = false }) {
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get('/api/auth/me')
      .then((res) => setWarning(res.data.warning))
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const defaultLinks = [
    { to: '/clinics', label: '🌐 عيادات', className: 'bg-teal-600 hover:bg-teal-700' },
    { to: '/patients', label: '📋 ملفات', className: 'bg-purple-600 hover:bg-purple-700' },
    { to: '/scheduler', label: '📅 مواعيد', className: 'bg-blue-600 hover:bg-blue-700' },
    { to: '/whatsapp', label: '📱 واتساب', className: 'bg-green-600 hover:bg-green-700' },
    { to: '/payment', label: '💳 اشتراك', className: 'bg-indigo-600 hover:bg-indigo-700' },
    { to: '/admin', label: '⚙️ إدارة', className: 'bg-slate-700 hover:bg-slate-800' },
  ];

  const nav = links.length ? links : defaultLinks;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <header className="bg-white/90 backdrop-blur shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <ClinicBranding compact />
            <span className="hidden sm:block text-slate-300">|</span>
            <h1 className="text-lg font-bold text-slate-700 hidden sm:block">{title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {nav.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`${l.className} text-white px-3 py-1.5 rounded-lg text-sm font-medium transition`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition"
            >
              خروج
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <SubscriptionBanner warning={warning} />
        {showLogoUpload && <ClinicBranding />}
        {children}
      </main>
    </div>
  );
}
