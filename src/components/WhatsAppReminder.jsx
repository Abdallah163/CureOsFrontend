import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function WhatsAppReminder() {
  const [qr, setQr] = useState(null);
  const [ready, setReady] = useState(false);
  const [absentCount, setAbsentCount] = useState(0);
  const [sending, setSending] = useState(false);

  const fetchQR = useCallback(async () => {
    try {
      const res = await api.get('/api/whatsapp/qr');
      if (res.data.qrCode) setQr(res.data.qrCode);
    } catch (err) {
      console.error('خطأ في تحميل QR:', err);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/whatsapp/status');
      setReady(res.data.ready);
      if (!res.data.ready) fetchQR();
    } catch (err) {
      console.error('خطأ في تحميل الحالة:', err);
    }
  }, [fetchQR]);

  const fetchAbsentCount = useCallback(async () => {
    try {
      const res = await api.get('/api/whatsapp/absent?days=30');
      setAbsentCount(res.data.length);
    } catch (err) {
      console.error('خطأ في تحميل الغائبين:', err);
    }
  }, []);

  const sendReminders = async () => {
    setSending(true);
    try {
      await api.post('/api/whatsapp/send-reminders', { daysAbsent: 30 });
      alert('تم إرسال التذكيرات');
      fetchAbsentCount();
    } catch (err) {
      alert('فشل الإرسال: ' + err.message);
    }
    setSending(false);
  };

  useEffect(() => {
    fetchStatus();
    fetchAbsentCount();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchAbsentCount]);

  return (
    <div className="bg-white p-4 rounded shadow mt-6">
      <h3 className="text-lg font-bold mb-2">📱 تذكير المرضى عبر واتساب</h3>

      {!ready && qr && (
        <div className="mb-3">
          <p>امسح رمز QR باستخدام هاتفك في تطبيق واتساب:</p>
          <img src={qr} alt="QR Code" className="w-48 h-48 mx-auto" />
        </div>
      )}

      {ready && <p className="text-green-600">✅ واتساب متصل وجاهز</p>}

      <p className="my-2">
        عدد المرضى الغائبين &gt;30 يوماً: <strong>{absentCount}</strong>
      </p>

      <button
        onClick={sendReminders}
        disabled={sending || !ready || absentCount === 0}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {sending ? 'جارٍ الإرسال...' : 'إرسال تذكير للجميع'}
      </button>
    </div>
  );
}