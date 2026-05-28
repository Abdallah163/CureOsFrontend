import React, { useEffect, useState } from 'react';
import api from '../api';

export default function ClinicBranding({ compact = false }) {
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.get('/api/auth/me')
      .then((res) => setProfile(res.data.user))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const onLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('الحد الأقصى 2 ميجابايت');
      return;
    }
    const fd = new FormData();
    fd.append('logo', file);
    setUploading(true);
    try {
      const res = await api.post('/api/auth/clinic-logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((p) => ({ ...p, clinicLogoData: res.data.clinicLogo, clinicName: p?.clinicName }));
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل رفع الشعار');
    }
    setUploading(false);
  };

  const logo = profile?.clinicLogoData;
  const name = profile?.clinicName || profile?.name || 'عيادتي';

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {logo ? (
          <img src={logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-teal-100 shadow-sm" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center text-white text-lg">🏥</div>
        )}
        <div>
          <p className="font-bold text-slate-800 text-sm leading-tight">{name}</p>
          <p className="text-xs text-slate-500">CureOS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 flex flex-wrap items-center gap-4 shadow-sm">
      {logo ? (
        <img src={logo} alt="شعار العيادة" className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-100" />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-indigo-100 flex items-center justify-center text-3xl">🏥</div>
      )}
      <div className="flex-1 min-w-[180px]">
        <h2 className="font-bold text-slate-800">{name}</h2>
        <p className="text-xs text-slate-500 mt-1">ارفع شعاراً أو صورة للعيادة — يظهر في الشريط العلوي</p>
        <label className="inline-block mt-2 cursor-pointer text-sm text-teal-700 font-semibold hover:underline">
          {uploading ? 'جارٍ الرفع...' : '📷 تغيير الشعار'}
          <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

export function SubscriptionBanner({ warning }) {
  if (!warning) return null;
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-amber-900 text-sm font-medium">⏰ {warning.message}</p>
      <a
        href="/payment"
        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
      >
        تجديد الاشتراك
      </a>
    </div>
  );
}
