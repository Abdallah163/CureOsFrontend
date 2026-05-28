import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const API_BASE = process.env.REACT_APP_API_URL || '';

function NotificationBell({ count, onClick }) {
  if (count === 0) return null;
  return (
    <button onClick={onClick}
      className="relative bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition animate-pulse">
      🔔 {count} طلب جديد
    </button>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [grantDays, setGrantDays] = useState({});
  const [prevCount, setPrevCount] = useState(0);
  const [paymentAlert, setPaymentAlert] = useState(null);
  const [toast, setToast] = useState(null);
  const pollRef = useRef(null);
  const audioRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const playNotification = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      // صوت تنبيه بسيط
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) { }
  };

  const load = useCallback(async (silent = false) => {
    try {
      const [u, s, p] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/stats'),
        api.get('/api/payment/pending'),
      ]);
      setUsers(u.data);
      setStats(s.data);

      // كشف الدفع الجديد
      if (!silent && p.data.length > prevCount && prevCount > 0) {
        const newCount = p.data.length - prevCount;
        setPaymentAlert(`💰 تم استلام ${newCount} طلب دفع جديد!`);
        playNotification();
        setTimeout(() => setPaymentAlert(null), 6000);
      }
      setPrevCount(p.data.length);
      setPayments(p.data);

      const defaults = {};
      p.data.forEach((pay) => {
        defaults[pay._id] = pay.plan === 'weekly' ? 7 : pay.plan === '4months' ? 120 : 30;
      });
      setGrantDays((prev) => ({ ...defaults, ...prev }));
    } catch (err) {
      console.error(err);
      if (!silent) {
        alert(err.response?.data?.message || 'خطأ في تحميل بيانات الأدمن');
      }
    }
    setLoading(false);
  }, [prevCount]);

  useEffect(() => { load(); }, []);

  // Polling كل 15 ثانية للكشف عن الدفوعات الجديدة
  useEffect(() => {
    pollRef.current = setInterval(() => load(true), 15000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const toggleActive = async (id) => {
    try {
      await api.put(`/api/admin/users/${id}/toggle-active`);
      setUsers(users.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ');
    }
  };

  const approvePayment = async (id) => {
    const days = grantDays[id];
    if (!days || days < 1) {
      alert('حدد عدد الأيام');
      return;
    }
    try {
      await api.post(`/api/payment/${id}/approve`, { grantedDays: Number(days) });
      setPayments((prev) => prev.filter((p) => p._id !== id));
      await load();
      alert(`تم التفعيل لمدة ${days} يوماً`);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التفعيل');
    }
  };

  const rejectPayment = async (id) => {
    if (!window.confirm('رفض هذا الطلب؟')) return;
    try {
      await api.post(`/api/payment/${id}/reject`, { notes: 'مرفوض من الأدمن' });
      setPayments((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) return <div className="text-center py-20">جارٍ التحميل...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* تنبيه الدفع الجديد */}
      {paymentAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-bounce">
          {paymentAlert}
        </div>
      )}

      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">⚙️ لوحة المدير</h1>
        <div className="flex gap-2 items-center">
          <NotificationBell count={payments.length} onClick={() => document.getElementById('payments-section')?.scrollIntoView({ behavior: 'smooth' })} />
          <Link to="/home" className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm">الرئيسية</Link>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm">خروج</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="الأطباء" value={stats.totalDoctors} color="blue" />
          <Stat label="نشطون" value={stats.activeDoctors} color="green" />
          <Stat label="تجريبي" value={stats.trialDoctors} color="amber" />
          <Stat label="مدفوع" value={stats.paidDoctors} color="purple" />
        </div>

        <div id="payments-section" className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden border border-amber-100">
          <div className="p-4 border-b bg-amber-50">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-amber-900">💳 طلبات دفع بانتظار الموافقة ({payments.length})</h2>
              <span className="text-xs text-gray-400">تحديث تلقائي كل 15 ثانية</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">يُرسل إشعار للبريد وعند ضبط SMTP. يُشعَر الأدمن أيضاً بصوت عند وصول طلب جديد.</p>
          </div>
          {payments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">لا توجد طلبات معلّقة</p>
          ) : (
            <div className="divide-y">
              {payments.map((p) => {
                const hasAddons = p.addons && p.addons.length > 0;
                return (
                  <div key={p._id} className="p-4 flex flex-wrap gap-4 items-start">
                    <div className="flex-1 min-w-[200px] text-sm space-y-1">
                      <p><b>{p.name}</b> — {p.email}</p>
                      <p className="text-gray-500">{p.clinicName} · {p.plan} · {p.amount} ج.م · {p.paymentMethod}</p>
                      {hasAddons && (
                        <p className="text-purple-600 text-xs font-medium">
                          📢 إضافات: {p.addons.map(a => a === 'advertising' ? 'حملة إعلانية (+40 رسالة)' : a).join(', ')}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs">{new Date(p.createdAt).toLocaleString('ar-EG')}</p>
                    </div>
                    {p.receiptData && (
                      <a
                        href={`${API_BASE}/api/payment/${p._id}/receipt`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-24 h-24 rounded-lg overflow-hidden border shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          api.get(`/api/payment/${p._id}/receipt`, { responseType: 'blob' })
                            .then((res) => {
                              const url = URL.createObjectURL(res.data);
                              window.open(url, '_blank');
                            })
                            .catch(() => alert('تعذر فتح الإيصال'));
                        }}
                      >
                        <span className="flex items-center justify-center w-full h-full bg-slate-100 text-xs text-teal-700">عرض الإيصال</span>
                      </a>
                    )}
                    <div className="flex flex-col gap-2 items-end">
                      <label className="text-xs text-gray-500">أيام التفعيل</label>
                      <input
                        type="number"
                        min={1}
                        max={3650}
                        value={grantDays[p._id] || 30}
                        onChange={(e) => setGrantDays((g) => ({ ...g, [p._id]: e.target.value }))}
                        className="w-24 border rounded-lg p-2 text-sm text-center"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => approvePayment(p._id)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs">
                          تفعيل
                        </button>
                        <button onClick={() => rejectPayment(p._id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs">
                          رفض
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-700">قائمة الأطباء</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">البريد</th>
                  <th className="p-3 text-right">الباقة</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">الاستخدام (زيارات/واتساب)</th>
                  <th className="p-3 text-right">ينتهي</th>
                  <th className="p-3 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.plan === '4months' ? 'bg-indigo-100 text-indigo-700' :
                          u.plan === 'monthly' ? 'bg-blue-100 text-blue-700' :
                            u.plan === 'weekly' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                        }`}>
                        {u.plan === '4months' ? 'رباعية' :
                          u.plan === 'monthly' ? 'شهرية' :
                            u.plan === 'weekly' ? 'أسبوعية' : u.plan}
                      </span>
                      {u.addons && u.addons.includes('advertising') && (
                        <span className="mr-1 bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">📢</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.paymentStatus} {u.isActive ? '· نشط' : '· موقوف'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {u.usage?.visitsCount ?? 0}/{u.usage?.limitVisits ?? '∞'} · {u.usage?.whatsappCount ?? 0}/{u.usage?.limitWhatsapp ?? '∞'}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {u.subscriptionEndsAt
                        ? new Date(u.subscriptionEndsAt).toLocaleDateString('ar-EG')
                        : u.trialEndsAt
                          ? `تجربة: ${new Date(u.trialEndsAt).toLocaleDateString('ar-EG')}`
                          : '—'}
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(u._id)}
                        className={`text-xs font-medium px-2 py-1 rounded-lg transition ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}>
                        {u.isActive ? 'إيقاف' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colors = {
    blue: 'border-blue-500 text-blue-600',
    green: 'border-green-500 text-green-600',
    amber: 'border-amber-500 text-amber-600',
    purple: 'border-purple-500 text-purple-600',
  };
  return (
    <div className={`bg-white p-4 rounded-xl shadow border-r-4 ${colors[color]}`}>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${colors[color].split(' ')[1]}`}>{value ?? 0}</p>
    </div>
  );
}