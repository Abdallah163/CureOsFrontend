import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function WhatsAppReminder() {
  const [ready, setReady] = useState(false);
  const [absentCount, setAbsentCount] = useState(0);
  const [sending, setSending] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/whatsapp/status');
      setReady(res.data.ready);
    } catch (err) {
      console.error('خطأ في تحميل الحالة:', err);
    }
  }, []);

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

      {ready && <p className="text-green-600">✅ واتساب متصل وجاهز</p>}
      {!ready && <p className="text-amber-600">⚠️ واتساب غير متصل. اذهب إلى صفحة ربط واتساب للاتصال</p>}

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