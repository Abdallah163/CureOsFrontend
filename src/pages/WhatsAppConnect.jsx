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
    { step: "2", text: "اضغط على النقاط الثلاث ⋮" },
    { step: "3", text: 'اختر "الأجهزة المرتبطة"' },
    { step: "4", text: 'اضغط "ربط جهاز"' },
    { step: "5", text: "امسح رمز QR" },
  ],
  pairing: [
    { step: "1", text: "افتح واتساب على هاتفك" },
    { step: "2", text: "اضغط على النقاط الثلاث ⋮" },
    { step: "3", text: 'اختر "الأجهزة المرتبطة"' },
    { step: "4", text: 'اضغط "ربط جهاز"' },
    { step: "5", text: "أدخل رمز الاقتران" },
  ],
};

export default function WhatsAppConnect() {
  const [state, setState] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState(null);
  const [qrBase64, setQrBase64] = useState(null);
  const [method, setMethod] = useState("pairing");
  const [connectedPhone, setConnectedPhone] = useState(null);
  const [toast, setToast] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [connecting, setConnecting] = useState(false);

  // refs
  const toastTimerRef = useRef(null);
  const pairingPollRef = useRef(null);
  const mountedRef = useRef(true);

  // ─────────────────────────────────────
  // Toast
  // ─────────────────────────────────────

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });

    clearTimeout(toastTimerRef.current);

    toastTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setToast(null);
      }
    }, 4000);
  }, []);

  // ─────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      clearTimeout(toastTimerRef.current);

      if (pairingPollRef.current) {
        clearTimeout(pairingPollRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────
  // Initial Status Check
  // ─────────────────────────────────────

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      const res = await api.get(`${API}/status`);

      if (!mountedRef.current) return;

      const s = res.data.state || (res.data.ready ? "ready" : "idle");

      setState(s);

      if (res.data.connectedNumber) {
        setConnectedPhone(res.data.connectedNumber);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────
  // Phone Validation
  // ─────────────────────────────────────

  const validatePhone = (phone) => {
    const clean = phone.replace(/\D/g, "");

    const egyptPhoneRegex = /^20(10|11|12|15)\d{8}$/;

    return egyptPhoneRegex.test(clean);
  };

  // ─────────────────────────────────────
  // Polling
  // ─────────────────────────────────────

  const stopPolling = () => {
    if (pairingPollRef.current) {
      clearTimeout(pairingPollRef.current);
      pairingPollRef.current = null;
    }
  };

  const startPairingPolling = useCallback(() => {
    stopPolling();

    const poll = async () => {
      try {
        const res = await api.get(`${API}/pairing-status`);

        if (!mountedRef.current) return;

        const data = res.data;

        // READY
        if (data.state === "ready") {
          setState("ready");
          setConnecting(false);

          if (data.connectedNumber) {
            setConnectedPhone(data.connectedNumber);
          }

          stopPolling();

          showToast("تم الربط بنجاح 🎉");

          return;
        }

        // QR
        if (data.state === "qr") {
          setState("qr");

          if (data.qrBase64) {
            setQrBase64(data.qrBase64);
          }
        }

        // PAIRING
        if (data.state === "pairing") {
          setState("pairing");

          if (data.pairingCode) {
            setPairingCode(data.pairingCode);
          }
        }

        // CONNECTING
        if (data.state === "connecting") {
          setStatusMsg("جارٍ الاتصال...");
        }

        // ERROR
        if (data.state === "error") {
          setState("failed");
          setConnecting(false);

          setErrorMessage(data.error || "فشل الاتصال");

          stopPolling();

          showToast(data.error || "فشل الاتصال", "error");

          return;
        }

        pairingPollRef.current = setTimeout(poll, 2000);
      } catch (err) {
        console.error(err);

        pairingPollRef.current = setTimeout(poll, 3000);
      }
    };

    poll();
  }, [showToast]);

  // ─────────────────────────────────────
  // Connect
  // ─────────────────────────────────────

  const handleConnect = async () => {
    try {
      if (connecting) return;

      setErrorMessage("");

      if (!phoneInput.trim()) {
        showToast("يرجى إدخال رقم الهاتف", "error");
        return;
      }

      const cleanPhone = phoneInput.replace(/\D/g, "");

      if (!validatePhone(cleanPhone)) {
        showToast("رقم الهاتف غير صالح", "error");
        return;
      }

      setConnecting(true);

      setState("connecting");

      setPairingCode(null);

      setQrBase64(null);

      setStatusMsg("بدء الاتصال...");

      const res = await api.post(`${API}/start-pairing`, {
        phone: cleanPhone,
        method,
      });

      if (!res.data.ok) {
        throw new Error(res.data.message || "فشل بدء الاتصال");
      }

      startPairingPolling();
    } catch (err) {
      console.error(err);

      setState("failed");

      setConnecting(false);

      setErrorMessage(
        err.response?.data?.message || err.message || "فشل الاتصال",
      );

      showToast(
        err.response?.data?.message || "حدث خطأ أثناء الاتصال",
        "error",
      );
    }
  };

  // ─────────────────────────────────────
  // Disconnect
  // ─────────────────────────────────────

  const handleDisconnect = async () => {
    if (!window.confirm("قطع الاتصال؟")) return;

    try {
      stopPolling();

      await api.post(`${API}/disconnect`);

      setState("idle");

      setPairingCode(null);

      setQrBase64(null);

      setConnectedPhone(null);

      setConnecting(false);

      showToast("تم قطع الاتصال");
    } catch (err) {
      console.error(err);

      showToast("فشل قطع الاتصال", "error");
    }
  };

  // ─────────────────────────────────────
  // Cancel
  // ─────────────────────────────────────

  const handleCancel = async () => {
    try {
      stopPolling();

      await api.post(`${API}/disconnect`);

      setState("idle");

      setPairingCode(null);

      setQrBase64(null);

      setConnecting(false);

      showToast("تم الإلغاء");
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────
  // UI
  // ─────────────────────────────────────

  const ui = STATE_UI[state] || STATE_UI.idle;

  const colorCls = COLORS[ui.color];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-green-50 to-white"
    >
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Link to="/home" className="text-gray-400 hover:text-gray-600 text-sm">
          ← الرئيسية
        </Link>

        <span className="text-gray-300">|</span>

        <h1 className="text-lg font-bold">📱 ربط واتساب</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className={`flex items-center gap-3 p-4 border-b ${colorCls}`}>
            <span className="text-2xl">{ui.icon}</span>

            <div className="flex-1">
              <p className="font-bold text-sm">{ui.label}</p>

              {connectedPhone && state === "ready" && (
                <p dir="ltr" className="text-xs opacity-70">
                  +{connectedPhone}
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="bg-red-50 border-b border-red-100 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          {(state === "idle" || state === "failed") && (
            <div className="p-4">
              {/* Method */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMethod("pairing")}
                  className={`flex-1 py-2 rounded-xl text-sm border transition ${
                    method === "pairing"
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  🔑 رمز الاقتران
                </button>

                <button
                  onClick={() => setMethod("qr")}
                  className={`flex-1 py-2 rounded-xl text-sm border transition ${
                    method === "qr"
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  📷 QR
                </button>
              </div>

              {/* Phone */}
              <input
                type="tel"
                dir="ltr"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="201012345678"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />

              <p className="text-xs text-gray-400 mt-2">
                مثال: 201012345678
              </p>
            </div>
          )}

          {/* Connecting */}
          {state === "connecting" && (
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />

              <p className="text-sm text-gray-500">
                {statusMsg || "جارٍ الاتصال..."}
              </p>
            </div>
          )}

          {/* Pairing */}
          {state === "pairing" && pairingCode && (
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                <p className="text-xs text-blue-500 mb-2">رمز الاقتران</p>

                <p
                  dir="ltr"
                  className="text-3xl font-bold tracking-widest text-blue-700"
                >
                  {pairingCode}
                </p>

                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(pairingCode);

                      showToast("تم نسخ الرمز 📋");
                    }
                  }}
                  className="mt-3 text-xs text-blue-600 underline"
                >
                  نسخ الرمز
                </button>
              </div>
            </div>
          )}

          {/* QR */}
          {state === "qr" && qrBase64 && (
            <div className="p-6 flex justify-center">
              <div className="border-2 border-blue-200 rounded-2xl p-4 bg-white">
                <img src={qrBase64} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="p-4">
            {(state === "idle" || state === "failed") && (
              <button
                disabled={connecting}
                onClick={handleConnect}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {connecting
                  ? "جارٍ الاتصال..."
                  : method === "qr"
                    ? "📷 بدء QR"
                    : "🔑 بدء الاقتران"}
              </button>
            )}

            {(state === "connecting" ||
              state === "pairing" ||
              state === "qr") && (
              <button
                onClick={handleCancel}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm"
              >
                إلغاء
              </button>
            )}

            {state === "ready" && (
              <button
                onClick={handleDisconnect}
                className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl text-sm font-bold"
              >
                🔌 قطع الاتصال
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        {(state === "pairing" || state === "qr") && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-700 mb-4 text-sm">
              {state === "qr"
                ? "📷 خطوات مسح QR"
                : "🔑 خطوات إدخال رمز الاقتران"}
            </p>

            <div className="space-y-3">
              {WHATSAPP_INSTRUCTIONS[
                state === "qr" ? "qr" : "pairing"
              ].map(({ step, text }) => (
                <div
                  key={step}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span className="w-6 h-6 rounded-full bg-green-50 text-green-600 text-xs flex items-center justify-center font-bold">
                    {step}
                  </span>

                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-700 space-y-1">
          <p className="font-bold text-sm mb-1">⚠️ ملاحظات</p>

          <p>• الهاتف يجب أن يكون متصل بالإنترنت</p>

          <p>• الجلسة تُحفَظ تلقائياً</p>

          <p>• رمز الاقتران صالح لدقائق محدودة</p>
        </div>
      </div>
    </div>
  );
}