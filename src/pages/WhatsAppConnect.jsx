import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const API = '/api/whatsapp';

const STATE_UI = {
  idle:         { label: 'واتساب غير متصل',    icon: '📱', color: 'gray'   },
  initializing: { label: 'جارٍ التهيئة...',     icon: '⏳', color: 'yellow' },
  qr_ready:     { label: 'امسح رمز QR',         icon: '📷', color: 'blue'   },
  ready:        { label: 'متصل وجاهز ✅',        icon: '✅', color: 'green'  },
  failed:       { label: 'فشل الاتصال',         icon: '❌', color: 'red'    },
};

const COLORS = {
  gray:   'bg-gray-50 border-gray-200 text-gray-600',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  blue:   'bg-blue-50 border-blue-200 text-blue-700',
  green:  'bg-green-50 border-green-200 text-green-700',
  red:    'bg-red-50 border-red-200 text-red-700',
};

// ── مكوّن اختبار الإرسال ────────────────────────────────────
function TestSend() {
  const [phone, setPhone]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post(`${API}/test-send`, { phone });
      setResult({ ok: true, msg: res.data.message });
    } catch (err) {
      setResult({ ok: false, msg: `(${err.response?.status || 'Network'}) ${err.response?.data?.message || err.message}` });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="font-bold text-gray-700 mb-1 text-sm">🧪 اختبار الإرسال</p>
      <p className="text-xs text-gray-400 mb-3">تأكد إن الإرسال شغّال قبل ما تبعت للمرضى</p>
      <form onSubmit={handleTest} className="flex gap-2">
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="201012345678"
          dir="ltr"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          required
        />
        <button type="submit" disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
          {loading ? '...' : 'اختبار'}
        </button>
      </form>
      {result && (
        <p className={`mt-2 text-xs font-medium ${result.ok ? 'text-green-600' : 'text-red-500'}`}>
          {result.ok ? '✅' : '❌'} {result.msg}
        </p>
      )}
    </div>
  );
}

export default function WhatsAppConnect() {
  const [state, setState]       = useState('idle');
  const [qrCode, setQrCode]     = useState(null);
  const [phone, setPhone]       = useState(null);
  const [absent, setAbsent]     = useState(0);
  const [sending, setSending]   = useState(false);
  const [toast, setToast]       = useState(null);
  const pollRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── polling واحد بسيط ─────────────────────────────────────
  const poll = useCallback(async () => {
    try {
      const res = await api.get(`${API}/qr`);
      const { state: s, qrCode: qr, ready } = res.data;

      const newState = s || (ready ? 'ready' : 'idle');
      setState(newState);

      if (newState === 'ready') {
        setQrCode(null);
        clearInterval(pollRef.current);
        const sr = await api.get(`${API}/status`);
        setPhone(sr.data.connectedNumber);
        fetchAbsent(); // ✅ جلب عدد الغائبين بعد الربط
        showToast('تم الربط بنجاح! 🎉');
      } else if (newState === 'qr_ready' && qr) {
        setQrCode(qr);
      } else if (newState === 'failed') {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      console.error('poll error:', err);
    }
  }, []);

  const startPoll = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(poll, 2000); // كل 2 ثانية — Baileys سريع
  }, [poll]);

  // ✅ fetchAbsent قبل useEffect
  const fetchAbsent = async () => {
    try {
      const r = await api.get(`${API}/absent?days=30`);
      setAbsent(r.data.length);
    } catch (e) { console.error('fetchAbsent error:', e); }
  };

  // تحقق من الحالة عند فتح الصفحة
  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get(`${API}/status`);
        const s   = res.data.state || (res.data.ready ? 'ready' : 'idle');
        setState(s);
        if (res.data.connectedNumber) setPhone(res.data.connectedNumber);
        if (s === 'ready') fetchAbsent(); // ✅ جلب العدد لو متصل
        if (s === 'initializing' || s === 'qr_ready') startPoll();
        if (s === 'qr_ready') poll();
      } catch (e) {}
    };
    check();
    return () => clearInterval(pollRef.current);
  }, []);

  const handleConnect = async () => {
    setState('initializing');
    setQrCode(null);
    try {
      await api.post(`${API}/connect`);
      startPoll();
    } catch (err) {
      showToast(err.response?.data?.message || 'خطأ في الاتصال', 'error');
      setState('failed');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('قطع اتصال واتساب؟')) return;
    clearInterval(pollRef.current);
    try {
      await api.post(`${API}/disconnect`);
      setState('idle'); setQrCode(null); setPhone(null);
      showToast('تم قطع الاتصال');
    } catch (err) {
      showToast('خطأ في قطع الاتصال', 'error');
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await api.post(`${API}/send-reminders`, { daysAbsent: 30 });
      showToast(res.data.message);
      fetchAbsent();
    } catch (err) {
      showToast(err.response?.data?.message || 'فشل الإرسال', 'error');
    }
    setSending(false);
  };

  const ui = STATE_UI[state] || STATE_UI.idle;
  const colorCls = COLORS[ui.color];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-green-50 to-white">

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Link to="/home" className="text-gray-400 hover:text-gray-600 text-sm">← الرئيسية</Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-bold">📱 ربط واتساب</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-4">

        {/* ── بطاقة الحالة ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Status bar */}
          <div className={`flex items-center gap-3 p-4 border-b ${colorCls}`}>
            <span className="text-2xl">{ui.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-sm">{ui.label}</p>
              {state === 'ready' && phone && (
                <p className="text-xs opacity-70" dir="ltr">+{phone}</p>
              )}
            </div>
            {state === 'ready' && (
              <span className="flex items-center gap-1 text-xs font-bold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                متصل
              </span>
            )}
          </div>

          {/* QR */}
          {state === 'qr_ready' && (
            <div className="p-6 flex flex-col items-center gap-3">
              {qrCode ? (
                <>
                  <div className="p-3 bg-white rounded-2xl shadow border border-gray-100">
                    <img src={qrCode} alt="QR" className="w-52 h-52" />
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"/>
                    في انتظار المسح... يتجدد تلقائياً
                  </p>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"/>
                  <p className="text-sm text-gray-400">جارٍ تحميل QR...</p>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {state === 'initializing' && (
            <div className="p-10 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"/>
              <p className="text-sm text-gray-400">يتم الاتصال بواتساب... (ثوان)</p>
            </div>
          )}

          {/* أزرار */}
          <div className="p-4">
            {(state === 'idle' || state === 'failed') && (
              <button onClick={handleConnect}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                📱 {state === 'failed' ? 'إعادة المحاولة' : 'ربط واتساب'}
              </button>
            )}
            {state === 'qr_ready' && (
              <button onClick={() => { clearInterval(pollRef.current); setState('idle'); setQrCode(null); }}
                className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                إلغاء
              </button>
            )}
            {state === 'ready' && (
              <button onClick={handleDisconnect}
                className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition">
                🔌 قطع الاتصال
              </button>
            )}
          </div>
        </div>

        {/* ── خطوات الربط ── */}
        {state !== 'ready' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-3 text-sm">📋 خطوات الربط</p>
            <ol className="space-y-2">
              {['اضغط "ربط واتساب"',
                'انتظر ظهور رمز QR (ثواني فقط)',
                'افتح واتساب على هاتفك',
                'النقاط الثلاث ⋮ ← الأجهزة المرتبطة',
                'اضغط "ربط جهاز" وامسح QR',
                'تنتهي العملية تلقائياً ✅'
              ].map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-6 h-6 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── اختبار الإرسال ── */}
        {state === 'ready' && (
          <TestSend />
        )}

        {/* ── التذكيرات ── */}
        {state === 'ready' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-1 text-sm">📤 إرسال تذكيرات للغائبين</p>
            <p className="text-xs text-gray-400 mb-4">غائبون أكثر من 30 يوم</p>
            <div className="flex items-center justify-between bg-orange-50 rounded-xl p-3 mb-3 border border-orange-100">
              <span className="text-sm text-gray-600">عدد المرضى</span>
              <span className="text-xl font-extrabold text-orange-500">{absent}</span>
            </div>
            <button onClick={handleSend} disabled={sending || absent === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-40">
              {sending ? 'جارٍ الإرسال...' : `إرسال تذكير لـ ${absent} مريض`}
            </button>
          </div>
        )}

        {/* ── الحجز عبر واتساب ── */}
        {state === 'ready' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-1 text-sm">📞 الحجز عبر واتساب</p>
            <p className="text-xs text-gray-400 mb-3">المرضى يمكنهم حجز مواعيد عبر إرسال رسالة واتساب</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-bold">طريقة الحجز:</p>
              <p>• يرسل المريض رسالة تحتوي على "حجز موعد" مع التاريخ والوقت</p>
              <p>• مثال: <strong dir="ltr">حجز موعد يوم 2024-01-15 الساعة 10:30</strong></p>
              <p>• يتم إنشاء الموعد تلقائياً وإرسال تأكيد للمريض</p>
              <p>• يتم إشعارك فوراً بطلب الحجز</p>
            </div>
          </div>
        )}

        {/* ── استبيان الرضا ── */}
        {state === 'ready' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-1 text-sm">⭐ استبيان رضا المرضى</p>
            <p className="text-xs text-gray-400 mb-3">يُرسل تلقائياً بعد الحضور</p>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700 space-y-1">
              <p>• بعد تأكيد حضور المريض، يُرسل استبيان تقييم تلقائياً</p>
              <p>• المريض يرد برقم من 1 إلى 5</p>
              <p>• يتم إشعارك فوراً عند وجود تقييم منخفض (1-2)</p>
              <p>• تحليل شهري لمعدل الرضا متاح في لوحة التحكم</p>
            </div>
          </div>
        )}

        {/* تنبيه */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-700 space-y-1">
          <p className="font-bold text-sm mb-1">⚠️ ملاحظات</p>
          <p>• هاتفك يجب أن يكون متصلاً بالإنترنت</p>
          <p>• الجلسة تُحفَظ تلقائياً — لن تحتاج QR مرة ثانية</p>
          <p>• لو القرآن لم يظهر خلال 10 ثواني، اضغط إلغاء وأعد المحاولة</p>
          <p>• الحجز عبر واتساب واستبيان الرضا يعملان تلقائياً بعد الربط</p>
        </div>

      </div>
    </div>
  );
}