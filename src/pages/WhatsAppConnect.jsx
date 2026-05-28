import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const API = "/api/whatsapp";

const STATE_UI = {
  idle: { label: "واتساب غير متصل", icon: "📱", color: "gray" },
  connecting: { label: "جارٍ التهيئة...", icon: "⏳", color: "yellow" },
  pairing: { label: "أدخل الرمز في واتساب", icon: "🔑", color: "blue" },
  qr: { label: "امسح رمز QR بالهاتف", icon: "📷", color: "blue" },
  ready: { label: "متصل وجاهز ✅", icon: "✅", color: "green" },
  failed: { label: "فشل الاتصال", icon: "❌", color: "red" },
};

const COLORS = {
  gray: "bg-gray-50 border-gray-200 text-gray-600",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
  red: "bg-red-50 border-red-200 text-red-700",
};

const WHATSAPP_INSTRUCTIONS = {
  qr: [
    { step: "1", text: "افتح واتساب على هاتفك" },
    { step: "2", text: "اضغط على النقاط الثلاث ⋮ (القائمة)" },
    { step: "3", text: 'اختر "الأجهزة المرتبطة" (Linked Devices)' },
    { step: "4", text: 'اضغط "ربط جهاز" (Link a Device)' },
    { step: "5", text: "امسح رمز QR الظاهر أعلاه" },
    { step: "6", text: "انتظر حتى يتم الربط تلقائياً ✅" },
  ],
  pairing: [
    { step: "1", text: "افتح واتساب على هاتفك" },
    { step: "2", text: "اضغط على النقاط الثلاث ⋮ (القائمة)" },
    { step: "3", text: 'اختر "الأجهزة المرتبطة" (Linked Devices)' },
    { step: "4", text: 'اضغط "ربط جهاز" (Link a Device)' },
    { step: "5", text: "أدخل رمز الاقتران الظاهر أعلاه" },
    { step: "6", text: "انتظر حتى يتم الربط تلقائياً ✅" },
  ],
};

function TestSend() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`${API}/test-send`, { phone });
      setResult({ ok: true, msg: res.data.message });
    } catch (err) {
      setResult({
        ok: false,
        msg: `(${err.response?.status || "Network"}) ${err.response?.data?.message || err.message}`,
      });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="font-bold text-gray-700 mb-1 text-sm">🧪 اختبار الإرسال</p>
      <p className="text-xs text-gray-400 mb-3">
        تأكد إن الإرسال شغّال قبل ما تبعت للمرضى
      </p>
      <form onSubmit={handleTest} className="flex gap-2">
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="201012345678"
          dir="ltr"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? "..." : "اختبار"}
        </button>
      </form>
      {result && (
        <p
          className={`mt-2 text-xs font-medium ${result.ok ? "text-green-600" : "text-red-500"}`}
        >
          {result.ok ? "✅" : "❌"} {result.msg}
        </p>
      )}
    </div>
  );
}

export default function WhatsAppConnect() {
  const [state, setState] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState(null);
  const [qrBase64, setQrBase64] = useState(null);
  const [method, setMethod] = useState("pairing"); // 'qr' | 'pairing'
  const [connectedPhone, setConnectedPhone] = useState(null);
  const [absent, setAbsent] = useState(0);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const pollRef = useRef(null);
  const abortRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const poll = useCallback(async () => {
    try {
      const res = await api.get(`${API}/status`);
      const { state: s, ready } = res.data;
      const newState = s || (ready ? "ready" : null);
      if (newState === "ready") {
        setState("ready");
        clearInterval(pollRef.current);
        setConnectedPhone(res.data.connectedNumber);
        fetchAbsent();
        showToast("تم الربط بنجاح! 🎉");
      } else if (newState === "failed") {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      console.error("poll error:", err);
    }
  }, []);

  const startPoll = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(poll, 2000);
  }, [poll]);

  const fetchAbsent = async () => {
    try {
      const r = await api.get(`${API}/absent?days=30`);
      setAbsent(r.data.length);
    } catch (e) {
      console.error("fetchAbsent error:", e);
    }
  };

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get(`${API}/status`);
        const s = res.data.state || (res.data.ready ? "ready" : "idle");
        setState(s);
        if (res.data.connectedNumber)
          setConnectedPhone(res.data.connectedNumber);
        if (s === "ready") fetchAbsent();
      } catch (e) { }
    };
    check();
    return () => {
      clearInterval(pollRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── ربط واتساب عبر رمز الاقتران (Polling) ───────────────────
  const handleConnect = async () => {
    if (!phoneInput.trim()) {
      showToast("يرجى إدخال رقم الهاتف", "error");
      return;
    }

    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      showToast("رقم الهاتف غير صالح (مثال: 201012345678)", "error");
      return;
    }

    setState("connecting");
    setStatusMsg("بدء الاقتران...");
    setPairingCode(null);

    try {
      // 1. ابدأ الـ pairing (يرجع فوراً)
      const startRes = await api.post(`${API}/start-pairing`, {
        phone: cleanPhone,
        method,
      });
      if (!startRes.data.ok) {
        throw new Error(startRes.data.message || "فشل بدء الاقتران");
      }

      // 2. Polling كل ثانيتين لمعرفة النتيجة
      const maxAttempts = 45; // 90 ثانية كحد أقصى
      let attempts = 0;

      const poll = setInterval(async () => {
        attempts++;
        try {
          const res = await api.get(`${API}/pairing-status`);
          const data = res.data;

          if (data.state === "pairing" && data.pairingCode) {
            clearInterval(poll);
            setPairingCode(data.pairingCode);
            setState("pairing");
            startPoll();
          } else if (data.state === "qr" && data.qrBase64) {
            clearInterval(poll);
            setQrBase64(data.qrBase64);
            setState("qr");
            startPoll();
          } else if (data.state === "ready") {
            clearInterval(poll);
            setState("ready");
            if (data.connectedNumber) setConnectedPhone(data.connectedNumber);
            fetchAbsent();
            showToast("تم الربط بنجاح! 🎉");
          } else if (data.state === "error") {
            clearInterval(poll);
            setState("failed");
            showToast(data.error || "فشل الاتصال", "error");
          } else if (data.state === "connecting") {
            setStatusMsg("جارٍ الاتصال بخادم واتساب...");
          }

          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setState("failed");
            showToast(
              "انتهت المهلة الزمنية (90 ثانية). أعد المحاولة.",
              "error",
            );
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 2000);

      // حفظ مرجع الـ poll للتنظيف
      pollRef.current = poll;
    } catch (err) {
      showToast(err.message || "خطأ في الاتصال", "error");
      setState("failed");
    }
  };

  const handleCancel = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    api.post(`${API}/disconnect`).catch(() => { });
    setState("idle");
    setPairingCode(null);
    setQrBase64(null);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("قطع اتصال واتساب؟")) return;
    clearInterval(pollRef.current);
    if (abortRef.current) abortRef.current.abort();
    try {
      await api.post(`${API}/disconnect`);
      setState("idle");
      setPairingCode(null);
      setQrBase64(null);
      setConnectedPhone(null);
      showToast("تم قطع الاتصال");
    } catch (err) {
      showToast("خطأ في قطع الاتصال", "error");
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await api.post(`${API}/send-reminders`, { daysAbsent: 30 });
      showToast(res.data.message);
      fetchAbsent();
    } catch (err) {
      showToast(err.response?.data?.message || "فشل الإرسال", "error");
    }
    setSending(false);
  };

  const ui = STATE_UI[state] || STATE_UI.idle;
  const colorCls = COLORS[ui.color];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-green-50 to-white"
    >
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium
          ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Link to="/home" className="text-gray-400 hover:text-gray-600 text-sm">
          ← الرئيسية
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-bold">📱 ربط واتساب</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        {/* ── بطاقة الحالة ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`flex items-center gap-3 p-4 border-b ${colorCls}`}>
            <span className="text-2xl">{ui.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-sm">{ui.label}</p>
              {state === "ready" && connectedPhone && (
                <p className="text-xs opacity-70" dir="ltr">
                  +{connectedPhone}
                </p>
              )}
            </div>
            {state === "ready" && (
              <span className="flex items-center gap-1 text-xs font-bold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                متصل
              </span>
            )}
          </div>

          {/* ── إدخال رقم الهاتف ── */}
          {(state === "idle" || state === "failed") && (
            <div className="p-4">
              {/* اختيار طريقة الربط */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMethod("pairing")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${method === "pairing"
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                >
                  🔑 رمز الاقتران
                </button>
                <button
                  onClick={() => setMethod("qr")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${method === "qr"
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                >
                  📷 مسح QR
                </button>
              </div>
              <label className="block text-sm text-gray-500 mb-2">
                رقم هاتف واتساب (مع مفتاح الدولة)
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="201012345678"
                  dir="ltr"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                مثال: 201012345678 (مصر: 2 + 10 أرقام)
              </p>
            </div>
          )}

          {/* ── عرض رمز الاقتران ── */}
          {state === "pairing" && pairingCode && (
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                <p className="text-xs text-blue-500 mb-2 font-medium">
                  رمز الاقتران
                </p>
                <p
                  className="text-3xl font-mono font-bold text-blue-700 tracking-widest"
                  dir="ltr"
                >
                  {pairingCode}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(pairingCode);
                    showToast("تم نسخ الرمز 📋");
                  }}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  نسخ الرمز
                </button>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                في انتظار إدخال الرمز في واتساب...
              </p>
            </div>
          )}

          {/* ── عرض QR Code ── */}
          {state === "qr" && qrBase64 && (
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="bg-white border-2 border-blue-200 rounded-2xl p-4">
                <img src={qrBase64} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                افتح واتساب ← الأجهزة المرتبطة ← امسح الرمز
              </p>
            </div>
          )}

          {state === "connecting" && (
            <div className="p-10 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">
                {statusMsg || "جارٍ التوصيل..."}
              </p>
              <p className="text-xs text-gray-300">
                قد يستغرق الأمر حتى 30 ثانية
              </p>
            </div>
          )}

          {/* ── أزرار ── */}
          <div className="p-4">
            {(state === "idle" || state === "failed") && (
              <button
                onClick={handleConnect}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {method === "qr" ? "📷 مسح QR" : "🔑 ربط واتساب برمز الاقتران"}
              </button>
            )}
            {state === "connecting" && (
              <button
                onClick={handleCancel}
                className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
            )}
            {state === "pairing" && (
              <button
                onClick={handleCancel}
                className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
            )}
            {state === "qr" && (
              <button
                onClick={handleCancel}
                className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
            )}
            {state === "ready" && (
              <button
                onClick={handleDisconnect}
                className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition"
              >
                🔌 قطع الاتصال
              </button>
            )}
          </div>
        </div>

        {/* ── تعليمات ── */}
        {(state === "pairing" || state === "qr") && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-3 text-sm">
              {state === "qr"
                ? "📋 خطوات الربط بمسح QR"
                : "📋 خطوات الربط برمز الاقتران"}
            </p>
            <div className="space-y-3">
              {WHATSAPP_INSTRUCTIONS[state === "qr" ? "qr" : "pairing"].map(
                ({ step, text }) => (
                  <div
                    key={step}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="w-6 h-6 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </span>
                    {text}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {state !== "ready" && state !== "pairing" && state !== "qr" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-3 text-sm">
              🔑 طرق الربط المتاحة
            </p>
            <div className="space-y-2">
              {[
                "طريقة 1: رمز الاقتران — أدخل الرقم، احصل على رمز، أدخله في واتساب",
                "طريقة 2: QR — ادخل الرقم، امسح رمز QR من هاتفك",
                "هاتفك يجب أن يكون متصلاً بالإنترنت",
                "الجلسة تُحفَظ تلقائياً — لن تحتاج ربط مرة ثانية",
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span className="w-6 h-6 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {state === "ready" && <TestSend />}

        {state === "ready" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-1 text-sm">
              📤 إرسال تذكيرات للغائبين
            </p>
            <p className="text-xs text-gray-400 mb-4">غائبون أكثر من 30 يوم</p>
            <div className="flex items-center justify-between bg-orange-50 rounded-xl p-3 mb-3 border border-orange-100">
              <span className="text-sm text-gray-600">عدد المرضى</span>
              <span className="text-xl font-extrabold text-orange-500">
                {absent}
              </span>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || absent === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-40"
            >
              {sending ? "جارٍ الإرسال..." : `إرسال تذكير لـ ${absent} مريض`}
            </button>
          </div>
        )}

        {state === "ready" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-1 text-sm">
              📞 الحجز عبر واتساب
            </p>
            <p className="text-xs text-gray-400 mb-3">
              المرضى يمكنهم حجز مواعيد عبر إرسال رسالة واتساب
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-bold">طريقة الحجز:</p>
              <p>• يرسل المريض رسالة تحتوي على "حجز موعد" مع التاريخ والوقت</p>
              <p>
                • مثال:{" "}
                <strong dir="ltr">حجز موعد يوم 2024-01-15 الساعة 10:30</strong>
              </p>
              <p>• يتم إنشاء الموعد تلقائياً وإرسال تأكيد للمريض</p>
              <p>• يتم إشعارك فوراً بطلب الحجز</p>
            </div>
          </div>
        )}

        {state === "ready" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-1 text-sm">
              ⭐ استبيان رضا المرضى
            </p>
            <p className="text-xs text-gray-400 mb-3">
              يُرسل تلقائياً بعد الحضور
            </p>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700 space-y-1">
              <p>• بعد تأكيد حضور المريض، يُرسل استبيان تقييم تلقائياً</p>
              <p>• المريض يرد برقم من 1 إلى 5</p>
              <p>• يتم إشعارك فوراً عند وجود تقييم منخفض (1-2)</p>
              <p>• تحليل شهري لمعدل الرضا متاح في لوحة التحكم</p>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-700 space-y-1">
          <p className="font-bold text-sm mb-1">⚠️ ملاحظات</p>
          <p>• هاتفك يجب أن يكون متصلاً بالإنترنت</p>
          <p>• الجلسة تُحفَظ تلقائياً — لن تحتاج ربط مرة ثانية</p>
          <p>• رمز الاقتران صالح لمدة دقيقتين تقريباً</p>
          <p>• الحجز عبر واتساب واستبيان الرضا يعملان تلقائياً بعد الربط</p>
        </div>
      </div>
    </div>
  );
}
