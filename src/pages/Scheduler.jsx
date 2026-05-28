import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const STATUS_CONFIG = {
  'مجدول':    { color: 'bg-blue-100 text-blue-700',   icon: '📅' },
  'حضر':      { color: 'bg-yellow-100 text-yellow-700', icon: '🚶' },
  'دفع':      { color: 'bg-green-100 text-green-700',  icon: '✅' },
  'ألغى':     { color: 'bg-red-100 text-red-700',      icon: '❌' },
  'لم يحضر': { color: 'bg-gray-100 text-gray-500',    icon: '👻' },
};

const toArabicDate = (d) => new Date(d).toLocaleDateString('ar-EG', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

export default function Scheduler() {
  const today      = new Date().toISOString().split('T')[0];
  const [date, setDate]               = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [showDelay, setShowDelay]     = useState(false);
  const [showPay, setShowPay]         = useState(null); // appointment id
  const [delayMins, setDelayMins]     = useState(30);
  const [payData, setPayData]         = useState({ amount: '', paymentMethod: 'كاش' });
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);
  const pollRef = useRef(null);

  const [form, setForm] = useState({
    patientName: '', patientPhone: '', time: '', duration: 30,
    serviceType: 'كشف عام', doctorName: '', notes: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get(`/api/scheduler?date=${date}`);
      setAppointments(res.data);
    } catch (err) { console.error(err); }
  }, [date]);

  useEffect(() => {
    fetchAppointments();
    // Polling كل 30 ثانية للـ real-time
    pollRef.current = setInterval(fetchAppointments, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchAppointments]);

  // ── إحصائيات اليوم ────────────────────────────────────
  const stats = {
    total:    appointments.length,
    attended: appointments.filter(a => a.status === 'حضر' || a.status === 'دفع').length,
    paid:     appointments.filter(a => a.status === 'دفع').length,
    revenue:  appointments.filter(a => a.status === 'دفع').reduce((s, a) => s + (a.amount || 0), 0),
    pending:  appointments.filter(a => a.status === 'مجدول').length,
  };

  // ── إضافة موعد ────────────────────────────────────────
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/scheduler', { ...form, date });
      setForm({ patientName: '', patientPhone: '', time: '', duration: 30,
                serviceType: 'كشف عام', doctorName: '', notes: '' });
      setShowForm(false);
      await fetchAppointments();
      showToast('تم حجز الموعد وإرسال تأكيد الواتساب ✅');
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ', 'error');
    }
    setSaving(false);
  };

  // ── تحديث الحالة ─────────────────────────────────────
  const updateStatus = async (id, status) => {
    if (status === 'دفع') { setShowPay(id); return; }
    try {
      await api.put(`/api/scheduler/${id}/status`, { status });
      await fetchAppointments();
      showToast(`تم تحديث الحالة إلى "${status}"`);
    } catch (err) {
      showToast(err.response?.data?.message || 'خطأ', 'error');
    }
  };

  // ── تسجيل الدفع ─────────────────────────────────────
  const handlePay = async (e) => {
    e.preventDefault();
    if (!payData.amount) { showToast('أدخل المبلغ', 'error'); return; }
    setSaving(true);
    try {
      await api.put(`/api/scheduler/${showPay}/status`,
        { status: 'دفع', amount: payData.amount, paymentMethod: payData.paymentMethod }
      );
      setShowPay(null);
      setPayData({ amount: '', paymentMethod: 'كاش' });
      await fetchAppointments();
      showToast('تم تسجيل الدفع وإضافته للإيرادات تلقائياً 💰');
    } catch (err) {
      showToast('خطأ في تسجيل الدفع', 'error');
    }
    setSaving(false);
  };

  // ── زر التأخير ───────────────────────────────────────
  const handleDelay = async () => {
    setSaving(true);
    try {
      const res = await api.post('/api/scheduler/delay',
        { date, delayMinutes: delayMins }
      );
      setShowDelay(false);
      await fetchAppointments();
      showToast(res.data.message);
    } catch (err) {
      showToast('خطأ في التأخير', 'error');
    }
    setSaving(false);
  };

  // ── إرسال تذكير ──────────────────────────────────────
  const sendReminder = async (id) => {
    try {
      await api.post(`/api/scheduler/${id}/reminder`);
      showToast('تم إرسال التذكير عبر واتساب 📱');
    } catch (err) {
      showToast('فشل إرسال التذكير', 'error');
    }
  };

  // ── حذف ──────────────────────────────────────────────
  const deleteAppt = async (id) => {
    if (!window.confirm('حذف هذا الموعد؟')) return;
    await api.delete(`/api/scheduler/${id}`);
    await fetchAppointments();
    showToast('تم حذف الموعد');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Navbar ── */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/home" className="text-gray-400 hover:text-gray-600 transition text-sm">← الرئيسية</Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold text-gray-800">📅 جدول المواعيد الحي</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">

        {/* ── إحصائيات اليوم ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'إجمالي المواعيد', value: stats.total,    color: 'border-blue-400',   text: 'text-blue-600' },
            { label: 'في الانتظار',      value: stats.pending,  color: 'border-yellow-400', text: 'text-yellow-600' },
            { label: 'حضروا',           value: stats.attended, color: 'border-indigo-400', text: 'text-indigo-600' },
            { label: 'دفعوا',           value: stats.paid,     color: 'border-green-400',  text: 'text-green-600' },
            { label: 'إيرادات اليوم',   value: `${stats.revenue.toLocaleString()} ج.م`, color: 'border-emerald-500', text: 'text-emerald-600' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-xl p-3 border-r-4 ${s.color} shadow-sm`}>
              <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
              <p className={`text-xl font-extrabold ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── أزرار الإجراءات ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            ＋ حجز موعد جديد
          </button>

          <button
            onClick={() => setShowDelay(true)}
            disabled={stats.pending === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 disabled:opacity-40"
          >
            ⏳ تأخير المواعيد
          </button>

          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            تحديث تلقائي كل 30 ثانية
          </div>
        </div>

        {/* ── فورم إضافة موعد ── */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">+</span>
              حجز موعد جديد — {toArabicDate(date)}
            </h3>
            <form onSubmit={handleAddAppointment}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'اسم المريض *', key: 'patientName', placeholder: 'محمد أحمد' },
                  { label: 'رقم واتساب *', key: 'patientPhone', placeholder: '201012345678' },
                  { label: 'الوقت *', key: 'time', type: 'time' },
                  { label: 'المدة (دقيقة)', key: 'duration', type: 'number' },
                  { label: 'نوع الخدمة', key: 'serviceType', placeholder: 'كشف عام' },
                  { label: 'الدكتور', key: 'doctorName', placeholder: 'د. أحمد' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={form[f.key]}
                      placeholder={f.placeholder}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      required={f.label.includes('*')}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  rows={2}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
                  {saving ? 'جارٍ الحفظ...' : 'حفظ وإرسال تأكيد واتساب 📱'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── قائمة المواعيد ── */}
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-400">لا توجد مواعيد في هذا اليوم</p>
              <button onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 text-sm hover:underline">
                + أضف أول موعد
              </button>
            </div>
          ) : appointments.map(appt => {
            const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG['مجدول'];
            return (
              <div key={appt._id}
                className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-wrap gap-3 items-start
                  ${appt.status === 'دفع' ? 'border-green-200' : appt.status === 'ألغى' ? 'border-red-100 opacity-60' : 'border-gray-100'}`}>

                {/* الوقت */}
                <div className="text-center min-w-[50px]">
                  <p className="text-xl font-extrabold text-blue-600">{appt.time}</p>
                  <p className="text-xs text-gray-300">{appt.duration} د</p>
                </div>

                {/* بيانات المريض */}
                <div className="flex-1 min-w-[150px]">
                  <p className="font-bold text-gray-800">{appt.patientName}</p>
                  <p className="text-xs text-gray-400" dir="ltr">{appt.patientPhone}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {appt.serviceType}
                    {appt.doctorName && ` · ${appt.doctorName}`}
                  </p>
                  {appt.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{appt.notes}</p>}
                </div>

                {/* الحالة */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                    {cfg.icon} {appt.status}
                  </span>
                  {appt.status === 'دفع' && (
                    <span className="text-xs text-green-600 font-bold">
                      💰 {appt.amount?.toLocaleString()} ج.م
                    </span>
                  )}
                  {appt.confirmationSent && (
                    <span className="text-xs text-gray-300">📱 تأكيد أُرسل</span>
                  )}
                </div>

                {/* أزرار الإجراءات */}
                {appt.status !== 'دفع' && appt.status !== 'ألغى' && appt.status !== 'لم يحضر' && (
                  <div className="flex flex-wrap gap-1.5 w-full mt-1 border-t border-gray-50 pt-2">
                    {appt.status === 'مجدول' && (
                      <button onClick={() => updateStatus(appt._id, 'حضر')}
                        className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs font-medium transition border border-yellow-200">
                        🚶 سجّل الحضور
                      </button>
                    )}
                    {(appt.status === 'حضر' || appt.status === 'مجدول') && (
                      <button onClick={() => updateStatus(appt._id, 'دفع')}
                        className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium transition border border-green-200">
                        💰 سجّل الدفع
                      </button>
                    )}
                    <button onClick={() => sendReminder(appt._id)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium transition border border-blue-200">
                      📱 إرسال تذكير
                    </button>
                    <button onClick={() => updateStatus(appt._id, 'ألغى')}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-medium transition border border-red-200">
                      ❌ إلغاء
                    </button>
                    <button onClick={() => updateStatus(appt._id, 'لم يحضر')}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-medium transition border border-gray-200">
                      👻 لم يحضر
                    </button>
                    <button onClick={() => deleteAppt(appt._id)}
                      className="text-gray-300 hover:text-red-400 px-2 py-1 text-xs transition mr-auto">
                      🗑
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal: تأخير المواعيد ── */}
      {showDelay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div dir="rtl" className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-gray-800 text-lg mb-2">⏳ تأخير المواعيد</h3>
            <p className="text-sm text-gray-500 mb-4">
              سيتم إرسال رسالة واتساب لـ <strong>{stats.pending} مريض</strong> لم يحضروا بعد،
              وتحديث مواعيدهم تلقائياً.
            </p>
            <label className="text-sm font-medium text-gray-700 block mb-2">مدة التأخير</label>
            <div className="flex gap-2 mb-5">
              {[15, 30, 45, 60].map(m => (
                <button key={m} onClick={() => setDelayMins(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition border
                    ${delayMins === m ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {m} د
                </button>
              ))}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs text-orange-700">
              📢 سيصل للمرضى: "نعتذر، يوجد تأخير {delayMins} دقيقة، موعدك الجديد الساعة [الوقت الجديد]"
            </div>
            <div className="flex gap-2">
              <button onClick={handleDelay} disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50">
                {saving ? 'جارٍ الإرسال...' : `إرسال للـ ${stats.pending} مريض`}
              </button>
              <button onClick={() => setShowDelay(false)}
                className="px-4 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: تسجيل الدفع ── */}
      {showPay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div dir="rtl" className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-gray-800 text-lg mb-4">💰 تسجيل الدفع</h3>
            <form onSubmit={handlePay}>
              <label className="text-sm font-medium text-gray-700 block mb-1">المبلغ (ج.م) *</label>
              <input
                type="number" min="0" step="0.5"
                value={payData.amount}
                onChange={e => setPayData(p => ({ ...p, amount: e.target.value }))}
                placeholder="200"
                className="w-full p-2.5 border border-gray-200 rounded-xl mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                required
              />
              <label className="text-sm font-medium text-gray-700 block mb-1">طريقة الدفع</label>
              <div className="flex gap-2 mb-4">
                {['كاش', 'بطاقة', 'تأمين'].map(m => (
                  <button key={m} type="button" onClick={() => setPayData(p => ({ ...p, paymentMethod: m }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition border
                      ${payData.paymentMethod === m ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-xs text-green-700">
                ✅ سيظهر هذا المبلغ تلقائياً في لوحة الإيرادات
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50">
                  {saving ? 'جارٍ الحفظ...' : 'تأكيد الدفع'}
                </button>
                <button type="button" onClick={() => setShowPay(null)}
                  className="px-4 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
